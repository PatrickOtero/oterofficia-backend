import { UserActionTokenType } from "../../core/auth/actionToken";

export type UserRole = "admin" | "user";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatarUrl: string | null;
  birthDate: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthenticatedSessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface UserProfile extends AuthenticatedSessionUser {
  avatarUrl: string | null;
  birthDate: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
}

export interface UserActionTokenRecord {
  id: string;
  userId: string;
  type: UserActionTokenType;
  tokenHash: string;
  payload: Record<string, unknown> | null;
  expiresAt: string;
  consumedAt: string | null;
  createdAt: string;
}

export interface AuthPayload {
  token: string;
  user: UserProfile;
}

export interface RegisterResponse {
  message: string;
  requiresEmailVerification: boolean;
}
