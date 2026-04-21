import { resolve } from "path";

const resolveCloudflareEndpoint = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}.r2.cloudflarestorage.com`;
};

export const getStorageConfig = () => ({
  allowLocalFallback: process.env.UPLOAD_FALLBACK_TO_LOCAL !== "false",
  cloudflare: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY ?? "",
    bucketName: process.env.CLOUDFLARE_BUCKET_NAME ?? "",
    endpoint: resolveCloudflareEndpoint(process.env.CLOUDFLARE_ACCOUNT_ID),
    region: process.env.CLOUDFLARE_REGION ?? "auto",
    secretAccessKey: process.env.CLOUDFLARE_ACCESS_SECRET_KEY ?? "",
  },
  localUploadsRoot: resolve(process.cwd(), process.env.LOCAL_UPLOADS_DIR || "storage/uploads"),
  preferCloudUpload: process.env.UPLOAD_DRIVER !== "local",
});
