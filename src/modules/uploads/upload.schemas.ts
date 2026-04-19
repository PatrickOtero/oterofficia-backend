import { AppError } from "../../core/errors/AppError";
import { readObject, readRequiredString } from "../../core/utils/validation";
import { UPLOAD_FOLDERS, UploadFolder, UploadableFile } from "./upload.types";

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
]);

const SAFE_FILE_NAME_PATTERN = /^[a-z0-9][a-z0-9._-]*$/i;

const normalizeUploadKey = (value: string) => value.replace(/\\/g, "/").replace(/^\/+/, "");

const validateUploadKey = (key: string) => {
  const [folder, fileName, ...remainingParts] = normalizeUploadKey(key).split("/");

  if (!folder || !fileName || remainingParts.length > 0) {
    throw new AppError("Arquivo invalido.", 400, "invalid_upload_key");
  }

  if (!UPLOAD_FOLDERS.includes(folder as UploadFolder)) {
    throw new AppError("Pasta de upload invalida.", 400, "invalid_upload_folder");
  }

  if (!SAFE_FILE_NAME_PATTERN.test(fileName)) {
    throw new AppError("Nome do arquivo invalido.", 400, "invalid_upload_key");
  }

  return `${folder}/${fileName}`;
};

export const parseUploadFolder = (value: unknown): UploadFolder => {
  const folder = readRequiredString(value, "Pasta de upload");

  if (!UPLOAD_FOLDERS.includes(folder as UploadFolder)) {
    throw new AppError("Pasta de upload invalida.", 400, "invalid_upload_folder");
  }

  return folder as UploadFolder;
};

export const parseUploadFile = (file?: Express.Multer.File): UploadableFile => {
  if (!file) {
    throw new AppError("Nenhum arquivo foi enviado.", 400, "upload_file_required");
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    throw new AppError("Apenas imagens sao aceitas para upload.", 400, "invalid_upload_file_type");
  }

  if (!file.buffer.length) {
    throw new AppError("O arquivo enviado esta vazio.", 400, "empty_upload_file");
  }

  return {
    buffer: file.buffer,
    mimeType: file.mimetype,
    originalName: file.originalname,
    size: file.size,
  };
};

export const parseUploadDeleteInput = (value: unknown) => {
  const body = readObject(value, "Dados do arquivo");
  const reference = body.key ?? body.url;

  return {
    key: parseUploadKeyReference(reference),
  };
};

export const parseUploadKeyFromParams = (folder: unknown, fileName: unknown) => {
  const normalizedFolder = parseUploadFolder(folder);
  const normalizedFileName = readRequiredString(fileName, "Nome do arquivo");

  return validateUploadKey(`${normalizedFolder}/${normalizedFileName}`);
};

export const parseUploadKeyReference = (value: unknown) => {
  const reference = readRequiredString(value, "Arquivo");

  if (reference.includes("/uploads/")) {
    const parsedUrl = new URL(reference, "http://localhost");
    const uploadsPrefix = "/uploads/";
    const uploadsIndex = parsedUrl.pathname.indexOf(uploadsPrefix);

    if (uploadsIndex < 0) {
      throw new AppError("Arquivo invalido.", 400, "invalid_upload_key");
    }

    return validateUploadKey(decodeURIComponent(parsedUrl.pathname.slice(uploadsIndex + uploadsPrefix.length)));
  }

  return validateUploadKey(reference);
};
