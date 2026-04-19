export type UserRole = "admin" | "user";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthenticatedSessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface SessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
}

export interface AuthPayload {
  token: string;
  user: AuthenticatedSessionUser;
}
