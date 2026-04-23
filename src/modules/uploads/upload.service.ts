import { inject, injectable } from "tsyringe";
import { AppError } from "../../core/errors/AppError";
import { TOKENS } from "../../shared/container/tokens";
import { getStorageConfig } from "./storage/storage.config";
import { createUploadKey } from "./storage/storage.utils";
import { IUploadRepository } from "./upload.repository.interface";
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
    @inject(TOKENS.UploadRepository)
    private readonly repository: IUploadRepository
  ) {}

  public async deleteFile(key: string) {
    let localDeleted = false;
    let cloudDeleted = false;
    const providerErrors: unknown[] = [];

    try {
      localDeleted = await this.repository.deleteLocalFile(key);
    } catch (error) {
      providerErrors.push(error);
    }

    try {
      cloudDeleted = await this.repository.deleteCloudFile(key);
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
    const localFile = await this.repository.readLocalFile(key);

    if (localFile) {
      return localFile;
    }

    let cloudFile: StoredFile | null = null;

    try {
      cloudFile = await this.repository.readCloudFile(key);
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
    const isCloudConfigured = this.repository.isCloudConfigured();

    if (preferCloudUpload && isCloudConfigured) {
      try {
        await this.repository.saveCloudFile(key, file);

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

    await this.repository.saveLocalFile(key, file);

    return {
      fallbackUsed: preferCloudUpload && isCloudConfigured,
      fileName,
      folder,
      key,
      mimeType: file.mimeType,
      size: file.size,
      source: "local",
    };
  }
}
