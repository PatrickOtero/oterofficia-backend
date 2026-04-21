import { randomUUID } from "crypto";
import { extname } from "path";
import { UploadFolder, UploadableFile } from "../upload.types";

const MIME_TYPE_TO_EXTENSION: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/svg+xml": "svg",
  "image/webp": "webp",
};

const EXTENSION_TO_MIME_TYPE: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  webp: "image/webp",
};

export const createUploadKey = (folder: UploadFolder, file: UploadableFile) => {
  const originalExtension = extname(file.originalName).replace(".", "").toLowerCase();
  const extension = MIME_TYPE_TO_EXTENSION[file.mimeType] || originalExtension || "bin";
  const fileName = `${randomUUID().replace(/-/g, "")}.${extension}`;

  return {
    fileName,
    key: `${folder}/${fileName}`,
  };
};

export const guessMimeTypeFromKey = (key: string) => {
  const extension = extname(key).replace(".", "").toLowerCase();

  return EXTENSION_TO_MIME_TYPE[extension] ?? null;
};
