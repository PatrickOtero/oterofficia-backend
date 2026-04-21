const LOCAL_API_FALLBACK_URL = "http://localhost:3002";
const UPLOADS_PREFIX = "/uploads/";

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, "");

const extractUploadKey = (value: string) => {
  if (!value.includes(UPLOADS_PREFIX)) {
    return null;
  }

  try {
    const parsedUrl = new URL(value, LOCAL_API_FALLBACK_URL);
    const uploadsIndex = parsedUrl.pathname.indexOf(UPLOADS_PREFIX);

    if (uploadsIndex < 0) {
      return null;
    }

    return decodeURIComponent(parsedUrl.pathname.slice(uploadsIndex + UPLOADS_PREFIX.length))
      .replace(/^\/+/, "");
  } catch {
    return null;
  }
};

export const resolvePublicApiUrl = () => {
  const explicitUrl = process.env.PUBLIC_API_URL?.trim();

  if (explicitUrl) {
    return normalizeBaseUrl(explicitUrl);
  }

  return null;
};

export const buildPublicUploadUrl = (key: string) => {
  const baseUrl = resolvePublicApiUrl() || LOCAL_API_FALLBACK_URL;
  return `${baseUrl}${UPLOADS_PREFIX}${key.replace(/^\/+/, "")}`;
};

export const normalizeUploadUrl = <T extends string | null | undefined>(value: T): T => {
  if (typeof value !== "string") {
    return value;
  }

  const uploadKey = extractUploadKey(value);
  const publicApiUrl = resolvePublicApiUrl();

  if (!uploadKey || !publicApiUrl) {
    return value;
  }

  return `${publicApiUrl}${UPLOADS_PREFIX}${uploadKey}` as T;
};

export const normalizeUploadPayload = <T>(value: T): T => {
  if (typeof value === "string") {
    return normalizeUploadUrl(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeUploadPayload(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeUploadPayload(item)])
    ) as T;
  }

  return value;
};
