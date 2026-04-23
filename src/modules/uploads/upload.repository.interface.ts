import { StoredFile, UploadableFile } from "./upload.types";

export interface IUploadRepository {
  deleteCloudFile(key: string): Promise<boolean>;
  deleteLocalFile(key: string): Promise<boolean>;
  isCloudConfigured(): boolean;
  readCloudFile(key: string): Promise<StoredFile | null>;
  readLocalFile(key: string): Promise<StoredFile | null>;
  saveCloudFile(key: string, file: UploadableFile): Promise<void>;
  saveLocalFile(key: string, file: UploadableFile): Promise<void>;
}
