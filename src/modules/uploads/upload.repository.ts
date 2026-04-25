import { inject, singleton } from "tsyringe";
import { TOKENS } from "../../shared/container/tokens";
import { CloudflareR2StorageProvider } from "./storage/cloudflare-r2-storage.provider";
import { IStorageProvider } from "./storage/storage.provider.interface";
import { IUploadRepository } from "./upload.repository.interface";
import { StoredFile, UploadableFile } from "./upload.types";

@singleton()
export class UploadRepository implements IUploadRepository {
  constructor(
    @inject(TOKENS.LocalStorageProvider)
    private readonly localStorage: IStorageProvider,
    @inject(TOKENS.CloudflareR2StorageProvider)
    private readonly cloudflareStorage: CloudflareR2StorageProvider
  ) {}

  public deleteCloudFile(key: string) {
    return this.cloudflareStorage.deleteFile(key);
  }

  public deleteLocalFile(key: string) {
    return this.localStorage.deleteFile(key);
  }

  public isCloudConfigured() {
    return this.cloudflareStorage.isConfigured();
  }

  public readCloudFile(key: string): Promise<StoredFile | null> {
    return this.cloudflareStorage.readFile(key);
  }

  public readLocalFile(key: string): Promise<StoredFile | null> {
    return this.localStorage.readFile(key);
  }

  public saveCloudFile(key: string, file: UploadableFile) {
    return this.cloudflareStorage.saveFile(key, file);
  }

  public saveLocalFile(key: string, file: UploadableFile) {
    return this.localStorage.saveFile(key, file);
  }
}
