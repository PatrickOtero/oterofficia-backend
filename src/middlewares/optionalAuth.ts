import { NextFunction, Request, Response } from "express";
import { container } from "tsyringe";
import { AuthService } from "../modules/auth/auth.service";

const extractBearerToken = (authorizationHeader?: string) => {
  if (!authorizationHeader) {
    return null;
  }

  const [type, token] = authorizationHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return null;
  }

  return token.trim();
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    return next();
  }

  const user = await container.resolve(AuthService).resolveSession(token);

  if (user) {
    req.sessionToken = token;
    req.user = user;
  }

  return next();
};
