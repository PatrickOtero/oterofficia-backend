import { randomUUID } from "crypto";
import { ErrorRequestHandler } from "express";
import { MulterError } from "multer";
import { AppError } from "../errors/AppError";

const shouldExposeErrorDetails = process.env.NODE_ENV === "development";

const readRequestId = (requestIdHeader: string | string[] | undefined) => {
  if (Array.isArray(requestIdHeader)) {
    return requestIdHeader[0] || randomUUID();
  }

  return requestIdHeader || randomUUID();
};

const logRequestError = (
  requestId: string,
  method: string,
  path: string,
  error: Error,
  statusCode: number,
  code: string,
  details?: unknown
) => {
  const logPayload = {
    code,
    details,
    message: error.message,
    method,
    path,
    requestId,
    stack: error.stack,
    statusCode,
  };

  if (statusCode >= 500) {
    console.error("Request failed", logPayload);
    return;
  }

  console.warn("Request failed", logPayload);
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const requestId = readRequestId(req.headers["x-request-id"]);
  res.setHeader("x-request-id", requestId);

  if (error instanceof AppError) {
    logRequestError(
      requestId,
      req.method,
      req.originalUrl,
      error,
      error.statusCode,
      error.code,
      error.details
    );

    return res.status(error.statusCode).json({
      code: error.code,
      details: shouldExposeErrorDetails ? error.details : undefined,
      message: error.message,
      requestId,
    });
  }

  if (error instanceof MulterError) {
    const details = {
      hint:
        error.code === "LIMIT_FILE_SIZE"
          ? "Reduza o tamanho do arquivo antes de tentar novamente."
          : "Revise o arquivo enviado e tente novamente.",
    };

    logRequestError(
      requestId,
      req.method,
      req.originalUrl,
      error,
      400,
      error.code,
      details
    );

    return res.status(400).json({
      code: error.code,
      details: shouldExposeErrorDetails ? details : undefined,
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "O arquivo ultrapassa o limite permitido para upload."
          : "Não foi possível processar o arquivo enviado.",
      requestId,
    });
  }

  const fallbackError = error instanceof Error ? error : new Error(String(error));

  logRequestError(
    requestId,
    req.method,
    req.originalUrl,
    fallbackError,
    500,
    "internal_server_error"
  );

  return res.status(500).json({
    code: "internal_server_error",
    details:
      process.env.NODE_ENV === "development"
        ? {
            reason: fallbackError.message,
          }
        : undefined,
    message: "O servidor não conseguiu concluir a solicitação.",
    requestId,
  });
};
