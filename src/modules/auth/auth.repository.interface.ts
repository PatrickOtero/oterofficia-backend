import { UserActionTokenType } from "../../core/auth/actionToken";
import {
  AuthenticatedSessionUser,
  SessionRecord,
  UserActionTokenRecord,
  UserProfile,
  UserRecord,
  UserRole,
} from "./auth.types";

export type CreateSessionInput = {
  expiresAt: Date;
  id: string;
  tokenHash: string;
  userId: string;
};

export type CreateUserInput = {
  avatarUrl?: string | null;
  birthDate?: Date | null;
  email: string;
  emailVerifiedAt?: Date | null;
  id: string;
  name: string;
  passwordHash: string;
  role: UserRole;
};

export type UpdateUserInput = {
  avatarUrl?: string | null;
  birthDate?: Date | null;
  email?: string;
  emailVerifiedAt?: Date | null;
  id: string;
  name?: string;
  passwordHash?: string;
  role?: UserRole;
};

export type CreateUserActionTokenInput = {
  expiresAt: Date;
  id: string;
  payload?: Record<string, unknown> | null;
  tokenHash: string;
  type: UserActionTokenType;
  userId: string;
};

export interface IAuthRepository {
  createActionToken(input: CreateUserActionTokenInput): Promise<UserActionTokenRecord>;
  createSession(input: CreateSessionInput): Promise<void>;
  createUser(input: CreateUserInput): Promise<UserRecord | null>;
  deleteActiveTokensByUserAndType(userId: string, type: UserActionTokenType): Promise<void>;
  deleteSessionByTokenHash(tokenHash: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  findActionTokenByHash(type: UserActionTokenType, tokenHash: string): Promise<UserActionTokenRecord | null>;
  findSessionByTokenHash(tokenHash: string): Promise<{ session: SessionRecord; user: AuthenticatedSessionUser } | null>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findUserById(userId: string): Promise<UserRecord | null>;
  getUserProfileById(userId: string): Promise<UserProfile | null>;
  markActionTokenConsumed(tokenId: string): Promise<void>;
  updateUser(input: UpdateUserInput): Promise<UserRecord | null>;
  updateUserRole(userId: string, role: UserRole): Promise<void>;
}
