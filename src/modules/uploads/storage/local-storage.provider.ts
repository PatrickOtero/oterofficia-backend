import { mkdir, readFile, rm, writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import { injectable } from "tsyringe";
import { StoredFile, UploadableFile } from "../upload.types";
import { getStorageConfig } from "./storage.config";
import { IStorageProvider } from "./storage.provider.interface";
import { guessMimeTypeFromKey } from "./storage.utils";

@injectable()
export class LocalStorageProvider implements IStorageProvider {
  private readonly uploadsRoot = getStorageConfig().localUploadsRoot;

  private resolveStoragePath(key: string) {
    const normalizedKey = key.replace(/\\/g, "/");
    const storagePath = resolve(this.uploadsRoot, normalizedKey);

    if (!storagePath.startsWith(this.uploadsRoot)) {
      throw new Error("Tentativa de acessar um caminho de upload inválido.");
    }

    return storagePath;
  }

  public async deleteFile(key: string) {
    const storagePath = this.resolveStoragePath(key);

    try {
      await rm(storagePath, { force: false });
      return true;
    } catch (error: any) {
      if (error?.code === "ENOENT") {
        return false;
      }

      throw error;
    }
  }

  public async readFile(key: string): Promise<StoredFile | null> {
    const storagePath = this.resolveStoragePath(key);

    try {
      const buffer = await readFile(storagePath);

      return {
        buffer,
        contentLength: buffer.byteLength,
        mimeType: guessMimeTypeFromKey(key),
      };
    } catch (error: any) {
      if (error?.code === "ENOENT") {
        return null;
      }

      throw error;
    }
  }

  public async saveFile(key: string, file: UploadableFile) {
    const storagePath = this.resolveStoragePath(key);

    await mkdir(dirname(storagePath), { recursive: true });
    await writeFile(storagePath, new Uint8Array(file.buffer));
  }
}
