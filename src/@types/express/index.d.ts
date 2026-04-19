import type { AuthenticatedSessionUser } from "../../modules/auth/auth.types";

declare global {
  namespace Express {
    interface Request {
      sessionToken?: string;
      user?: AuthenticatedSessionUser;
    }
  }
}

export {};
