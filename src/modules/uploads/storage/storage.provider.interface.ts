import { StoredFile, UploadableFile } from "../upload.types";

export interface IStorageProvider {
  deleteFile(key: string): Promise<boolean>;
  readFile(key: string): Promise<StoredFile | null>;
  saveFile(key: string, file: UploadableFile): Promise<void>;
}
