import {
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { injectable } from "tsyringe";
import { StoredFile, UploadableFile } from "../upload.types";
import { getStorageConfig } from "./storage.config";
import { IStorageProvider } from "./storage.provider.interface";
import { guessMimeTypeFromKey } from "./storage.utils";

@injectable()
export class CloudflareR2StorageProvider implements IStorageProvider {
  private readonly config = getStorageConfig().cloudflare;

  private client: S3Client | null = null;

  public isConfigured() {
    return Boolean(
      this.config.accessKeyId &&
        this.config.secretAccessKey &&
        this.config.bucketName &&
        this.config.endpoint
    );
  }

  private getClient() {
    if (!this.isConfigured()) {
      throw new Error("O storage da Cloudflare R2 nao esta configurado.");
    }

    if (!this.client) {
      this.client = new S3Client({
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
        endpoint: this.config.endpoint,
        forcePathStyle: true,
        region: this.config.region,
      });
    }

    return this.client;
  }

  private async readBodyAsBuffer(body: unknown) {
    if (!body) {
      return null;
    }

    if (body instanceof Readable) {
      const chunks: Uint8Array[] = [];

      for await (const chunk of body) {
        chunks.push(
          chunk instanceof Uint8Array
            ? new Uint8Array(chunk)
            : typeof chunk === "string"
            ? new TextEncoder().encode(chunk)
            : chunk instanceof ArrayBuffer
            ? new Uint8Array(chunk)
            : ArrayBuffer.isView(chunk)
            ? new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
            : new TextEncoder().encode(String(chunk))
        );
      }

      const combinedBuffer = new Uint8Array(
        chunks.reduce((totalSize, chunk) => totalSize + chunk.byteLength, 0)
      );
      let offset = 0;

      chunks.forEach((chunk) => {
        combinedBuffer.set(chunk, offset);
        offset += chunk.byteLength;
      });

      return Buffer.from(combinedBuffer);
    }

    if (
      typeof body === "object" &&
      body !== null &&
      "transformToByteArray" in body &&
      typeof body.transformToByteArray === "function"
    ) {
      const bytes = await body.transformToByteArray();
      return Buffer.from(bytes);
    }

    return Buffer.from(body as Uint8Array);
  }

  public async deleteFile(key: string) {
    if (!this.isConfigured()) {
      return false;
    }

    await this.getClient().send(
      new DeleteObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      })
    );

    return true;
  }

  public async readFile(key: string): Promise<StoredFile | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await this.getClient().send(
        new GetObjectCommand({
          Bucket: this.config.bucketName,
          Key: key,
        })
      );

      const buffer = await this.readBodyAsBuffer(response.Body);

      if (!buffer) {
        return null;
      }

      return {
        buffer,
        contentLength: response.ContentLength ? Number(response.ContentLength) : buffer.byteLength,
        mimeType: response.ContentType ?? guessMimeTypeFromKey(key),
      };
    } catch (error: any) {
      if (
        error instanceof NoSuchKey ||
        error?.name === "NoSuchKey" ||
        error?.$metadata?.httpStatusCode === 404
      ) {
        return null;
      }

      throw error;
    }
  }

  public async saveFile(key: string, file: UploadableFile) {
    await this.getClient().send(
      new PutObjectCommand({
        Body: new Uint8Array(file.buffer),
        Bucket: this.config.bucketName,
        ContentType: file.mimeType,
        Key: key,
      })
    );
  }
}
