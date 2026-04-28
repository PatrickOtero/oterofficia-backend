type ErrorLike = {
  code?: unknown;
  message?: unknown;
  name?: unknown;
  response?: unknown;
  responseCode?: unknown;
  $metadata?: {
    httpStatusCode?: unknown;
  };
};

export const toErrorLike = (error: unknown): ErrorLike =>
  error && typeof error === "object" ? (error as ErrorLike) : {};

export const hasErrorCode = (error: unknown, code: string) =>
  toErrorLike(error).code === code;

export const getErrorMessage = (error: unknown) => {
  const message = toErrorLike(error).message;

  return typeof message === "string" ? message : "";
};

export const getErrorResponseCode = (error: unknown) => {
  const responseCode = toErrorLike(error).responseCode;

  return typeof responseCode === "number" ? responseCode : null;
};
