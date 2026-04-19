import { inject, injectable } from "tsyringe";
import { AppError } from "../../core/errors/AppError";
import { TOKENS } from "../../shared/container/tokens";
import { CloudflareR2StorageProvider } from "./storage/cloudflare-r2-storage.provider";
import { getStorageConfig } from "./storage/storage.config";
import { IStorageProvider } from "./storage/storage.provider.interface";
import { createUploadKey } from "./storage/storage.utils";
import { StoredFile, UploadFolder, UploadableFile, UploadedAsset } from "./upload.types";

@injectable()
export class UploadService {
  private describeError(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }

  constructor(
    @inject(TOKENS.LocalStorageProvider)
    private readonly localStorage: IStorageProvider,
    @inject(TOKENS.CloudflareR2StorageProvider)
    private readonly cloudflareStorage: CloudflareR2StorageProvider
  ) {}

  public async deleteFile(key: string) {
    let localDeleted = false;
    let cloudDeleted = false;
    const providerErrors: unknown[] = [];

    try {
      localDeleted = await this.localStorage.deleteFile(key);
    } catch (error) {
      providerErrors.push(error);
    }

    try {
      cloudDeleted = await this.cloudflareStorage.deleteFile(key);
    } catch (error) {
      console.error("Falha ao remover o arquivo da Cloudflare R2.", this.describeError(error));
      providerErrors.push(error);
    }

    if (localDeleted || cloudDeleted) {
      return { message: "Arquivo removido com sucesso." };
    }

    if (providerErrors.length) {
      throw new AppError(
        "Nao foi possivel remover o arquivo no storage remoto.",
        503,
        "upload_delete_failed"
      );
    }

    if (!localDeleted && !cloudDeleted) {
      throw new AppError("Arquivo nao encontrado.", 404, "upload_not_found");
    }
  }

  public async getFile(key: string): Promise<StoredFile> {
    const localFile = await this.localStorage.readFile(key);

    if (localFile) {
      return localFile;
    }

    let cloudFile: StoredFile | null = null;

    try {
      cloudFile = await this.cloudflareStorage.readFile(key);
    } catch (error) {
      console.error("Falha ao ler o arquivo da Cloudflare R2.", this.describeError(error));
      throw new AppError(
        "Nao foi possivel acessar o arquivo no storage remoto.",
        503,
        "upload_read_failed"
      );
    }

    if (cloudFile) {
      return cloudFile;
    }

    throw new AppError("Arquivo nao encontrado.", 404, "upload_not_found");
  }

  public async uploadFile(file: UploadableFile, folder: UploadFolder): Promise<UploadedAsset> {
    const { allowLocalFallback, preferCloudUpload } = getStorageConfig();
    const { fileName, key } = createUploadKey(folder, file);

    if (preferCloudUpload && this.cloudflareStorage.isConfigured()) {
      try {
        await this.cloudflareStorage.saveFile(key, file);

        return {
          fallbackUsed: false,
          fileName,
          folder,
          key,
          mimeType: file.mimeType,
          size: file.size,
          source: "cloudflare",
        };
      } catch (error) {
        console.error(
          "Falha ao enviar o arquivo para a Cloudflare R2. O fallback local sera utilizado.",
          this.describeError(error)
        );

        if (!allowLocalFallback) {
          throw new AppError(
            "Nao foi possivel concluir o upload no storage principal.",
            503,
            "cloud_upload_failed"
          );
        }
      }
    }

    await this.localStorage.saveFile(key, file);

    return {
      fallbackUsed: preferCloudUpload && this.cloudflareStorage.isConfigured(),
      fileName,
      folder,
      key,
      mimeType: file.mimeType,
      size: file.size,
      source: "local",
    };
  }
}
