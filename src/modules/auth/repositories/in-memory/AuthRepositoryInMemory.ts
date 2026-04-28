import {
  CreateSessionInput,
  CreateUserActionTokenInput,
  CreateUserInput,
  IAuthRepository,
  UpdateUserInput,
} from "../../auth.repository.interface";
import { toUserProfile } from "../../auth.mappers";
import {
  AuthenticatedSessionUser,
  SessionRecord,
  UserActionTokenRecord,
  UserRecord,
} from "../../auth.types";

const toIso = (value: Date) => value.toISOString();

export class AuthRepositoryInMemory implements IAuthRepository {
  public sessions: SessionRecord[] = [];

  public tokens: UserActionTokenRecord[] = [];

  public users: UserRecord[] = [];

  public async createActionToken(input: CreateUserActionTokenInput) {
    const token: UserActionTokenRecord = {
      consumedAt: null,
      createdAt: toIso(new Date()),
      expiresAt: toIso(input.expiresAt),
      id: input.id,
      payload: input.payload ?? null,
      tokenHash: input.tokenHash,
      type: input.type,
      userId: input.userId,
    };

    this.tokens.push(token);
    return token;
  }

  public async createSession(input: CreateSessionInput) {
    this.sessions.push({
      createdAt: toIso(new Date()),
      expiresAt: toIso(input.expiresAt),
      id: input.id,
      tokenHash: input.tokenHash,
      userId: input.userId,
    });
  }

  public async createUser(input: CreateUserInput) {
    const now = new Date();
    const user: UserRecord = {
      avatarUrl: input.avatarUrl ?? null,
      birthDate: input.birthDate ? input.birthDate.toISOString().slice(0, 10) : null,
      createdAt: toIso(now),
      email: input.email,
      emailVerifiedAt: input.emailVerifiedAt ? toIso(input.emailVerifiedAt) : null,
      id: input.id,
      name: input.name,
      passwordHash: input.passwordHash,
      role: input.role,
      updatedAt: toIso(now),
    };

    this.users.push(user);

    return user;
  }

  public async deleteActiveTokensByUserAndType(userId: string, type: UserActionTokenRecord["type"]) {
    this.tokens = this.tokens.filter(
      (token) => !(token.userId === userId && token.type === type && !token.consumedAt)
    );
  }

  public async deleteSessionByTokenHash(tokenHash: string) {
    this.sessions = this.sessions.filter((session) => session.tokenHash !== tokenHash);
  }

  public async deleteUser(userId: string) {
    this.users = this.users.filter((user) => user.id !== userId);
    this.sessions = this.sessions.filter((session) => session.userId !== userId);
    this.tokens = this.tokens.filter((token) => token.userId !== userId);
  }

  public async findActionTokenByHash(type: UserActionTokenRecord["type"], tokenHash: string) {
    return this.tokens.find((token) => token.type === type && token.tokenHash === tokenHash) ?? null;
  }

  public async findSessionByTokenHash(tokenHash: string) {
    const session = this.sessions.find((currentSession) => currentSession.tokenHash === tokenHash);

    if (!session) {
      return null;
    }

    const user = this.users.find((currentUser) => currentUser.id === session.userId);

    if (!user) {
      return null;
    }

    const sanitizedUser: AuthenticatedSessionUser = {
      email: user.email,
      id: user.id,
      name: user.name,
      role: user.role,
    };

    return { session, user: sanitizedUser };
  }

  public async findUserByEmail(email: string) {
    return this.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  public async findUserById(userId: string) {
    return this.users.find((user) => user.id === userId) ?? null;
  }

  public async getUserProfileById(userId: string) {
    const user = await this.findUserById(userId);
    return user ? toUserProfile(user) : null;
  }

  public async markActionTokenConsumed(tokenId: string) {
    this.tokens = this.tokens.map((token) =>
      token.id === tokenId
        ? {
            ...token,
            consumedAt: toIso(new Date()),
          }
        : token
    );
  }

  public async updateUser(input: UpdateUserInput) {
    const currentUser = await this.findUserById(input.id);

    if (!currentUser) {
      return null;
    }

    const updatedUser: UserRecord = {
      ...currentUser,
      avatarUrl: input.avatarUrl !== undefined ? input.avatarUrl : currentUser.avatarUrl,
      birthDate:
        input.birthDate !== undefined
          ? input.birthDate
            ? input.birthDate.toISOString().slice(0, 10)
            : null
          : currentUser.birthDate,
      email: input.email ?? currentUser.email,
      emailVerifiedAt:
        input.emailVerifiedAt !== undefined
          ? input.emailVerifiedAt
            ? toIso(input.emailVerifiedAt)
            : null
          : currentUser.emailVerifiedAt,
      name: input.name ?? currentUser.name,
      passwordHash: input.passwordHash ?? currentUser.passwordHash,
      role: input.role ?? currentUser.role,
      updatedAt: toIso(new Date()),
    };

    this.users = this.users.map((user) => (user.id === input.id ? updatedUser : user));
    return updatedUser;
  }

  public async updateUserRole(userId: UserRecord["id"], role: UserRecord["role"]) {
    await this.updateUser({
      id: userId,
      role,
    });
  }
}
