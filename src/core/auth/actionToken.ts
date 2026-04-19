import { createHash, randomBytes } from "crypto";

export type UserActionTokenType =
  | "confirm_account_deletion"
  | "confirm_email_change"
  | "reset_password"
  | "verify_email";

export const createActionToken = () => randomBytes(40).toString("hex");

export const hashActionToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const buildActionTokenExpiry = (ttlHours: number) => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + ttlHours);
  return expiresAt;
};
