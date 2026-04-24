import { randomUUID } from "crypto";
import { inject, injectable } from "tsyringe";
import {
  buildActionTokenExpiry,
  createActionToken,
  hashActionToken,
  UserActionTokenType,
} from "../../core/auth/actionToken";
import { hashPassword, verifyPassword } from "../../core/auth/password";
import { buildSessionExpiry, createSessionToken, hashSessionToken } from "../../core/auth/session";
import { AppError } from "../../core/errors/AppError";
import { TOKENS } from "../../shared/container/tokens";
import { IMailService } from "../../services/mail.service.interface";
import { UploadService } from "../uploads/upload.service";
import { buildPublicUploadUrl } from "../uploads/upload-url";
import { IAuthRepository } from "./auth.repository.interface";
import { AuthPayload, RegisterResponse, UserProfile, UserRecord } from "./auth.types";

const shouldBeAdmin = (email: string) =>
  email.toLowerCase() === process.env.ADMIN_EMAIL?.trim().toLowerCase();

const resolveSiteUrl = () =>
  (process.env.FRONTEND_APP_URL || process.env.PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

const resolveSenderAddress = () =>
  process.env.NODEMAILER_FROM || process.env.NODEMAILER_USER || "no-reply@oterofficia.local";

const toUserProfile = (user: UserRecord): UserProfile => ({
  avatarUrl: user.avatarUrl,
  birthDate: user.birthDate,
  createdAt: user.createdAt,
  email: user.email,
  emailVerifiedAt: user.emailVerifiedAt,
  id: user.id,
  name: user.name,
  role: user.role,
  updatedAt: user.updatedAt,
});

type UploadAvatarInput = {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  size: number;
};

@injectable()
export class AuthService {
  constructor(
    @inject(TOKENS.AuthRepository)
    private readonly repository: IAuthRepository,
    @inject(TOKENS.MailService)
    private readonly mailer: IMailService,
    private readonly uploadService: UploadService
  ) {}

  private async createUserActionToken(
    userId: string,
    type: UserActionTokenType,
    payload?: Record<string, unknown> | null,
    ttlHours = 24
  ) {
    await this.repository.deleteActiveTokensByUserAndType(userId, type);

    const rawToken = createActionToken();

    await this.repository.createActionToken({
      expiresAt: buildActionTokenExpiry(ttlHours),
      id: randomUUID(),
      payload: payload ?? null,
      tokenHash: hashActionToken(rawToken),
      type,
      userId,
    });

    return rawToken;
  }

  private async ensureValidActionToken(type: UserActionTokenType, token: string) {
    const actionToken = await this.repository.findActionTokenByHash(type, hashActionToken(token));

    if (!actionToken || actionToken.consumedAt) {
      throw new AppError("O link informado não é mais válido.", 400, "invalid_action_token");
    }

    if (new Date(actionToken.expiresAt).getTime() <= Date.now()) {
      throw new AppError("O link informado expirou.", 400, "expired_action_token");
    }

    return actionToken;
  }

  private async sendActionEmail(input: {
    actionLabel: string;
    actionPath: string;
    intro: string;
    subject: string;
    title: string;
    to: string;
  }) {
    const appUrl = resolveSiteUrl();

    await this.mailer.sendMail({
      context: {
        actionLabel: input.actionLabel,
        actionUrl: `${appUrl}${input.actionPath}`,
        intro: input.intro,
        outro: "Se você não solicitou esta operação, ignore este e-mail.",
        title: input.title,
      },
      from: resolveSenderAddress(),
      replyTo: resolveSenderAddress(),
      subject: input.subject,
      template: "authAction",
      to: input.to,
    });
  }

  private extractUploadKeyFromUrl(fileUrl?: string | null) {
    if (!fileUrl) {
      return null;
    }

    try {
      const parsedUrl = new URL(fileUrl);
      return parsedUrl.pathname.replace(/^\/uploads\//, "");
    } catch (_error) {
      return null;
    }
  }

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
        emailVerifiedAt: new Date(),
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

    if (shouldKeepPassword && shouldKeepName && shouldKeepRole && existingUser.emailVerifiedAt) {
      return;
    }

    await this.repository.updateUser({
      emailVerifiedAt: existingUser.emailVerifiedAt ? new Date(existingUser.emailVerifiedAt) : new Date(),
      id: existingUser.id,
      name,
      passwordHash: shouldKeepPassword ? existingUser.passwordHash : hashPassword(password),
      role: "admin",
    });
  }

  public async getCurrentUser(userId: string) {
    const user = await this.repository.getUserProfileById(userId);

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404, "user_not_found");
    }

    return user;
  }

  public async login(input: { email: string; password: string }): Promise<AuthPayload> {
    let user = await this.repository.findUserByEmail(input.email);

    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw new AppError("E-mail ou senha inválidos.", 401, "invalid_credentials");
    }

    if (!user.emailVerifiedAt) {
      throw new AppError(
        "Confirme o seu e-mail antes de acessar a plataforma.",
        403,
        "email_not_verified"
      );
    }

    if (shouldBeAdmin(user.email) && user.role !== "admin") {
      await this.repository.updateUserRole(user.id, "admin");
      user = (await this.repository.findUserById(user.id)) ?? {
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
      user: toUserProfile(user),
    };
  }

  public async logout(token: string) {
    await this.repository.deleteSessionByTokenHash(hashSessionToken(token));
  }

  public async register(input: { email: string; name: string; password: string }): Promise<RegisterResponse> {
    const existingUser = await this.repository.findUserByEmail(input.email);

    if (existingUser) {
      throw new AppError("Já existe um usuário cadastrado com este e-mail.", 409, "email_in_use");
    }

    const createdUser = await this.repository.createUser({
      email: input.email,
      emailVerifiedAt: shouldBeAdmin(input.email) ? new Date() : null,
      id: randomUUID(),
      name: input.name,
      passwordHash: hashPassword(input.password),
      role: shouldBeAdmin(input.email) ? "admin" : "user",
    });

    if (!createdUser) {
      throw new AppError("Não foi possível criar o usuário.", 500, "user_creation_failed");
    }

    if (!createdUser.emailVerifiedAt) {
      try {
        const token = await this.createUserActionToken(createdUser.id, "verify_email", null, 24);

        await this.sendActionEmail({
          actionLabel: "Confirmar e-mail",
          actionPath: `/verify-email?token=${encodeURIComponent(token)}`,
          intro: "Sua conta foi criada. Confirme o seu e-mail para liberar o acesso ao site.",
          subject: "Confirme o seu cadastro no Oterofficia",
          title: "Confirme o seu e-mail",
          to: createdUser.email,
        });
      } catch (error) {
        await this.repository.deleteUser(createdUser.id);
        throw error;
      }
    }

    return {
      message: createdUser.emailVerifiedAt
        ? "Conta criada com sucesso."
        : "Conta criada. Verifique o seu e-mail para confirmar o cadastro.",
      requiresEmailVerification: !createdUser.emailVerifiedAt,
    };
  }

  public async resendVerificationEmail(email: string) {
    const user = await this.repository.findUserByEmail(email);

    if (!user) {
      return { message: "Se existir uma conta com este e-mail, uma nova confirmação será enviada." };
    }

    if (user.emailVerifiedAt) {
      return { message: "Este e-mail já está confirmado." };
    }

    const token = await this.createUserActionToken(user.id, "verify_email", null, 24);

    await this.sendActionEmail({
      actionLabel: "Confirmar e-mail",
      actionPath: `/verify-email?token=${encodeURIComponent(token)}`,
      intro: "Recebemos um novo pedido para confirmar o seu e-mail no Oterofficia.",
      subject: "Confirme o seu cadastro no Oterofficia",
      title: "Confirmação de e-mail",
      to: user.email,
    });

    return { message: "Enviamos um novo e-mail de confirmação." };
  }

  public async verifyEmail(token: string) {
    const actionToken = await this.ensureValidActionToken("verify_email", token);
    const user = await this.repository.findUserById(actionToken.userId);

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404, "user_not_found");
    }

    await this.repository.updateUser({
      emailVerifiedAt: new Date(),
      id: user.id,
    });
    await this.repository.markActionTokenConsumed(actionToken.id);

    return { message: "E-mail confirmado com sucesso." };
  }

  public async requestPasswordReset(email: string) {
    const user = await this.repository.findUserByEmail(email);

    if (!user) {
      return { message: "Se existir uma conta com este e-mail, enviaremos as instruções de redefinição." };
    }

    const token = await this.createUserActionToken(user.id, "reset_password", null, 2);

    await this.sendActionEmail({
      actionLabel: "Redefinir senha",
      actionPath: `/reset-password?token=${encodeURIComponent(token)}`,
      intro: "Você solicitou a redefinição da senha da sua conta no Oterofficia.",
      subject: "Redefinição de senha no Oterofficia",
      title: "Redefina a sua senha",
      to: user.email,
    });

    return { message: "Se existir uma conta com este e-mail, enviaremos as instruções de redefinição." };
  }

  public async resetPassword(token: string, password: string) {
    const actionToken = await this.ensureValidActionToken("reset_password", token);
    const user = await this.repository.findUserById(actionToken.userId);

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404, "user_not_found");
    }

    await this.repository.updateUser({
      id: user.id,
      passwordHash: hashPassword(password),
    });
    await this.repository.markActionTokenConsumed(actionToken.id);

    return { message: "Senha atualizada com sucesso." };
  }

  public async updateProfile(
    userId: string,
    input: { avatarUrl?: string | null; birthDate?: Date | null; name?: string }
  ) {
    const existingUser = await this.repository.findUserById(userId);

    if (!existingUser) {
      throw new AppError("Usuário não encontrado.", 404, "user_not_found");
    }

    const updatedUser = await this.repository.updateUser({
      avatarUrl: input.avatarUrl !== undefined ? input.avatarUrl : existingUser.avatarUrl,
      birthDate: input.birthDate !== undefined ? input.birthDate : existingUser.birthDate ? new Date(existingUser.birthDate) : null,
      id: userId,
      name: input.name ?? existingUser.name,
    });

    if (!updatedUser) {
      throw new AppError("Não foi possível atualizar o perfil.", 500, "profile_update_failed");
    }

    return {
      message: "Perfil atualizado com sucesso.",
      user: toUserProfile(updatedUser),
    };
  }

  public async uploadAvatar(userId: string, file: UploadAvatarInput) {
    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404, "user_not_found");
    }

    const uploadedAvatar = await this.uploadService.uploadFile(file, "avatars");

    if (user.avatarUrl) {
      const previousKey = this.extractUploadKeyFromUrl(user.avatarUrl);

      if (previousKey) {
        await this.uploadService.deleteFile(previousKey).catch(() => undefined);
      }
    }

    return this.updateProfile(userId, {
      avatarUrl: buildPublicUploadUrl(uploadedAvatar.key),
    });
  }

  public async changePassword(userId: string, input: { currentPassword: string; newPassword: string }) {
    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404, "user_not_found");
    }

    if (!verifyPassword(input.currentPassword, user.passwordHash)) {
      throw new AppError("A senha atual está incorreta.", 401, "invalid_current_password");
    }

    await this.repository.updateUser({
      id: userId,
      passwordHash: hashPassword(input.newPassword),
    });

    return { message: "Senha atualizada com sucesso." };
  }

  public async requestEmailChange(userId: string, nextEmail: string) {
    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404, "user_not_found");
    }

    if (user.email.toLowerCase() === nextEmail.toLowerCase()) {
      throw new AppError("Informe um novo e-mail para prosseguir.", 400, "email_unchanged");
    }

    const existingUser = await this.repository.findUserByEmail(nextEmail);

    if (existingUser && existingUser.id !== userId) {
      throw new AppError("Já existe uma conta usando este e-mail.", 409, "email_in_use");
    }

    const token = await this.createUserActionToken(
      userId,
      "confirm_email_change",
      { nextEmail },
      24
    );

    await this.sendActionEmail({
      actionLabel: "Confirmar novo e-mail",
      actionPath: `/confirm-email-change?token=${encodeURIComponent(token)}`,
      intro: "Confirme este link para concluir a troca do seu e-mail de acesso.",
      subject: "Confirme a troca do seu e-mail",
      title: "Confirmação de novo e-mail",
      to: nextEmail,
    });

    return { message: "Enviamos a confirmação para o novo e-mail informado." };
  }

  public async confirmEmailChange(token: string) {
    const actionToken = await this.ensureValidActionToken("confirm_email_change", token);
    const nextEmail = String(actionToken.payload?.nextEmail || "").trim().toLowerCase();

    if (!nextEmail) {
      throw new AppError("Não foi possível identificar o novo e-mail.", 400, "invalid_action_payload");
    }

    const existingUser = await this.repository.findUserByEmail(nextEmail);

    if (existingUser && existingUser.id !== actionToken.userId) {
      throw new AppError("Este e-mail já está em uso por outra conta.", 409, "email_in_use");
    }

    await this.repository.updateUser({
      email: nextEmail,
      emailVerifiedAt: new Date(),
      id: actionToken.userId,
    });
    await this.repository.markActionTokenConsumed(actionToken.id);

    return { message: "E-mail atualizado com sucesso." };
  }

  public async requestAccountDeletion(userId: string, password: string) {
    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404, "user_not_found");
    }

    if (!verifyPassword(password, user.passwordHash)) {
      throw new AppError("A senha atual está incorreta.", 401, "invalid_current_password");
    }

    const token = await this.createUserActionToken(user.id, "confirm_account_deletion", null, 2);

    await this.sendActionEmail({
      actionLabel: "Confirmar exclusão da conta",
      actionPath: `/confirm-account-deletion?token=${encodeURIComponent(token)}`,
      intro: "Recebemos um pedido para excluir permanentemente a sua conta do Oterofficia.",
      subject: "Confirme a exclusão da sua conta",
      title: "Exclusão de conta",
      to: user.email,
    });

    return { message: "Enviamos um e-mail para confirmar a exclusão da conta." };
  }

  public async confirmAccountDeletion(token: string) {
    const actionToken = await this.ensureValidActionToken("confirm_account_deletion", token);
    const user = await this.repository.findUserById(actionToken.userId);

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404, "user_not_found");
    }

    await this.repository.markActionTokenConsumed(actionToken.id);
    await this.repository.deleteUser(user.id);

    return { message: "Conta excluída com sucesso." };
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
