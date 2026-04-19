import { AuthenticatedSessionUser, SessionRecord, UserRecord, UserRole } from "./auth.types";

export type CreateSessionInput = {
  expiresAt: Date;
  id: string;
  tokenHash: string;
  userId: string;
};

export type CreateUserInput = {
  email: string;
  id: string;
  name: string;
  passwordHash: string;
  role: UserRole;
};

export type UpdateUserInput = {
  id: string;
  name: string;
  passwordHash: string;
  role: UserRole;
};

export interface IAuthRepository {
  createSession(input: CreateSessionInput): Promise<void>;
  createUser(input: CreateUserInput): Promise<UserRecord | null>;
  deleteSessionByTokenHash(tokenHash: string): Promise<void>;
  findSessionByTokenHash(tokenHash: string): Promise<{ session: SessionRecord; user: AuthenticatedSessionUser } | null>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findUserById(userId: string): Promise<UserRecord | null>;
  updateUser(input: UpdateUserInput): Promise<void>;
  updateUserRole(userId: string, role: UserRole): Promise<void>;
}
