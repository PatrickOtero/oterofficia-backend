import { NextFunction, Request, Response } from "express";
import { AppError } from "../core/errors/AppError";
import { optionalAuth } from "./optionalAuth";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  await optionalAuth(req, res, (error?: unknown) => {
    if (error) {
      return next(error);
    }

    if (!req.user || !req.sessionToken) {
      return next(new AppError("Faça login para continuar.", 401, "authentication_required"));
    }

    return next();
  });
};
