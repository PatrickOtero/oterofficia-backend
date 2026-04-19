export const UPLOAD_FOLDERS = ["avatars", "projects", "study-content", "study-covers"] as const;

export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export type UploadSource = "cloudflare" | "local";

export type UploadableFile = {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  size: number;
};

export type UploadedAsset = {
  fallbackUsed: boolean;
  fileName: string;
  folder: UploadFolder;
  key: string;
  mimeType: string;
  size: number;
  source: UploadSource;
};

export type StoredFile = {
  buffer: Buffer;
  contentLength: number;
  mimeType: string | null;
};
