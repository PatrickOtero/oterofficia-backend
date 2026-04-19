import { randomUUID } from "crypto";
import { inject, injectable } from "tsyringe";
import { hashPassword, verifyPassword } from "../../core/auth/password";
import { buildSessionExpiry, createSessionToken, hashSessionToken } from "../../core/auth/session";
import { AppError } from "../../core/errors/AppError";
import { TOKENS } from "../../shared/container/tokens";
import { IAuthRepository } from "./auth.repository.interface";
import { AuthPayload, AuthenticatedSessionUser } from "./auth.types";

const sanitizeUser = (user: {
  email: string;
  id: string;
  name: string;
  role: "admin" | "user";
}): AuthenticatedSessionUser => ({
  email: user.email,
  id: user.id,
  name: user.name,
  role: user.role,
});

const shouldBeAdmin = (email: string) =>
  email.toLowerCase() === process.env.ADMIN_EMAIL?.trim().toLowerCase();

@injectable()
export class AuthService {
  constructor(
    @inject(TOKENS.AuthRepository)
    private readonly repository: IAuthRepository
  ) {}

  public async ensureAdminAccount() {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD?.trim();
    const name = process.env.ADMIN_NAME?.trim() || "Administrador";

    if (!email || !password) {
      return;
    }

    const existingUser = await this.repository.findUserByEmail(email);

    if (!existingUser) {
      await this.repository.createUser({
        email,
        id: randomUUID(),
        name,
        passwordHash: hashPassword(password),
        role: "admin",
      });

      return;
    }

    const shouldKeepPassword = verifyPassword(password, existingUser.passwordHash);
    const shouldKeepName = existingUser.name === name;
    const shouldKeepRole = existingUser.role === "admin";

    if (shouldKeepPassword && shouldKeepName && shouldKeepRole) {
      return;
    }

    await this.repository.updateUser({
      id: existingUser.id,
      name,
      passwordHash: shouldKeepPassword ? existingUser.passwordHash : hashPassword(password),
      role: "admin",
    });
  }

  public async getCurrentUser(userId: string) {
    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw new AppError("UsuÃ¡rio nÃ£o encontrado.", 404, "user_not_found");
    }

    return sanitizeUser(user);
  }

  public async login(input: { email: string; password: string }): Promise<AuthPayload> {
    let user = await this.repository.findUserByEmail(input.email);

    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw new AppError("E-mail ou senha invÃ¡lidos.", 401, "invalid_credentials");
    }

    if (shouldBeAdmin(user.email) && user.role !== "admin") {
      await this.repository.updateUserRole(user.id, "admin");
      user = {
        ...user,
        role: "admin",
      };
    }

    const token = createSessionToken();

    await this.repository.createSession({
      expiresAt: buildSessionExpiry(),
      id: randomUUID(),
      tokenHash: hashSessionToken(token),
      userId: user.id,
    });

    return {
      token,
      user: sanitizeUser(user),
    };
  }

  public async logout(token: string) {
    await this.repository.deleteSessionByTokenHash(hashSessionToken(token));
  }

  public async register(input: { email: string; name: string; password: string }): Promise<AuthPayload> {
    const existingUser = await this.repository.findUserByEmail(input.email);

    if (existingUser) {
      throw new AppError("JÃ¡ existe um usuÃ¡rio cadastrado com este e-mail.", 409, "email_in_use");
    }

    const createdUser = await this.repository.createUser({
      email: input.email,
      id: randomUUID(),
      name: input.name,
      passwordHash: hashPassword(input.password),
      role: shouldBeAdmin(input.email) ? "admin" : "user",
    });

    if (!createdUser) {
      throw new AppError("NÃ£o foi possÃ­vel criar o usuÃ¡rio.", 500, "user_creation_failed");
    }

    const token = createSessionToken();

    await this.repository.createSession({
      expiresAt: buildSessionExpiry(),
      id: randomUUID(),
      tokenHash: hashSessionToken(token),
      userId: createdUser.id,
    });

    return {
      token,
      user: sanitizeUser(createdUser),
    };
  }

  public async resolveSession(token: string) {
    const sessionData = await this.repository.findSessionByTokenHash(hashSessionToken(token));

    if (!sessionData) {
      return null;
    }

    if (new Date(sessionData.session.expiresAt).getTime() <= Date.now()) {
      await this.repository.deleteSessionByTokenHash(hashSessionToken(token));
      return null;
    }

    return sessionData.user;
  }
}
