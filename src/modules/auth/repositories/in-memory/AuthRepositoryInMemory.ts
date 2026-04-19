import { IAuthRepository, CreateSessionInput, CreateUserInput, UpdateUserInput } from "../../auth.repository.interface";
import { AuthenticatedSessionUser, SessionRecord, UserRecord } from "../../auth.types";

const toIso = (value: Date) => value.toISOString();

export class AuthRepositoryInMemory implements IAuthRepository {
  public sessions: SessionRecord[] = [];

  public users: UserRecord[] = [];

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
      createdAt: toIso(now),
      email: input.email,
      id: input.id,
      name: input.name,
      passwordHash: input.passwordHash,
      role: input.role,
      updatedAt: toIso(now),
    };

    this.users.push(user);

    return user;
  }

  public async deleteSessionByTokenHash(tokenHash: string) {
    this.sessions = this.sessions.filter((session) => session.tokenHash !== tokenHash);
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

  public async updateUser(input: UpdateUserInput) {
    this.users = this.users.map((user) =>
      user.id === input.id
        ? {
            ...user,
            name: input.name,
            passwordHash: input.passwordHash,
            role: input.role,
            updatedAt: toIso(new Date()),
          }
        : user
    );
  }

  public async updateUserRole(userId: string, role: UserRecord["role"]) {
    const existingUser = await this.findUserById(userId);

    if (!existingUser) {
      return;
    }

    await this.updateUser({
      id: existingUser.id,
      name: existingUser.name,
      passwordHash: existingUser.passwordHash,
      role,
    });
  }
}
