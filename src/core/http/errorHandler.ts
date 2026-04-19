import { ErrorRequestHandler } from "express";
import { MulterError } from "multer";
import { AppError } from "../errors/AppError";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      code: error.code,
      details: error.details,
      message: error.message,
    });
  }

  if (error instanceof MulterError) {
    return res.status(400).json({
      code: error.code,
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "O arquivo ultrapassa o limite permitido para upload."
          : "Nao foi possivel processar o arquivo enviado.",
    });
  }

  console.error(error);

  return res.status(500).json({
    code: "internal_server_error",
    message: "O servidor não conseguiu concluir a solicitação.",
  });
};
