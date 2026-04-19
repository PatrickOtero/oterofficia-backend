import { NextFunction, Request, Response } from "express";
import { AppError } from "../core/errors/AppError";

export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError("Faça login para continuar.", 401, "authentication_required"));
  }

  if (req.user.role !== "admin") {
    return next(new AppError("Acesso restrito à administração.", 403, "admin_only"));
  }

  return next();
};
