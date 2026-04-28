export const extractUploadKeyFromUrl = (fileUrl?: string | null) => {
  if (!fileUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(fileUrl);
    return parsedUrl.pathname.replace(/^\/uploads\//, "");
  } catch (_error) {
    return null;
  }
};
