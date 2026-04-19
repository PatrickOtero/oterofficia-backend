import { createHash, randomBytes } from "crypto";

const DEFAULT_SESSION_TTL_DAYS = 30;

export const createSessionToken = () => randomBytes(48).toString("hex");

export const hashSessionToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const buildSessionExpiry = () => {
  const sessionTtlDays = Number(process.env.SESSION_TTL_DAYS ?? DEFAULT_SESSION_TTL_DAYS);
  const expiresAt = new Date();

  expiresAt.setDate(expiresAt.getDate() + sessionTtlDays);

  return expiresAt;
};
