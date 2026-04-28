import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { singleton } from "tsyringe";
import { AppError } from "../core/errors/AppError";
import { getErrorMessage, getErrorResponseCode, hasErrorCode, toErrorLike } from "../core/utils/error";
import { IMailService, MailTemplateOptions } from "./mail.service.interface";

const handlebars = require("nodemailer-express-handlebars");

const MAIL_VIEW_PATH_CANDIDATES = [
  path.resolve(process.cwd(), "views"),
  path.resolve(process.cwd(), "src/views"),
];

const REQUIRED_MAIL_ENV_VARS = [
  "NODEMAILER_HOST",
  "NODEMAILER_USER",
  "NODEMAILER_PASS",
] as const;

const readBoolean = (value: string | undefined, fallback: boolean) => {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return fallback;
};

const readPort = () => {
  const value = Number(process.env.NODEMAILER_PORT || 587);

  if (!Number.isFinite(value) || value <= 0) {
    return 587;
  }

  return value;
};

const resolveSenderAddress = () =>
  process.env.NODEMAILER_FROM || process.env.NODEMAILER_USER || "no-reply@oterofficia.local";

const resolveMailViewPath = () =>
  MAIL_VIEW_PATH_CANDIDATES.find((candidate) => fs.existsSync(candidate)) || null;

const readMissingMailEnvVars = () =>
  REQUIRED_MAIL_ENV_VARS.filter((envName) => !process.env[envName]?.trim());

const buildMailErrorDetails = (error: unknown) => {
  const errorLike = toErrorLike(error);

  return {
    providerCode: typeof errorLike.code === "string" ? errorLike.code : null,
    providerMessage: typeof errorLike.response === "string" ? errorLike.response : null,
    reason: getErrorMessage(error) || null,
    responseCode: getErrorResponseCode(error),
  };
};

@singleton()
export class NodemailerService implements IMailService {
  private readonly viewPath: string | null;
  private readonly port: number;
  private readonly requireTLS: boolean;
  private readonly secure: boolean;
  private readonly transporter: ReturnType<typeof nodemailer.createTransport>;

  constructor() {
    this.port = readPort();
    this.secure = readBoolean(process.env.NODEMAILER_SECURE, this.port === 465);
    this.requireTLS = readBoolean(process.env.NODEMAILER_REQUIRE_TLS, false);
    this.viewPath = resolveMailViewPath();

    this.transporter = nodemailer.createTransport({
      auth: {
        pass: process.env.NODEMAILER_PASS,
        user: process.env.NODEMAILER_USER,
      },
      host: process.env.NODEMAILER_HOST,
      port: this.port,
      requireTLS: this.requireTLS,
      secure: this.secure,
    });

    if (this.viewPath) {
      this.transporter.use(
        "compile",
        handlebars({
          viewEngine: {
            defaultLayout: false,
            extname: ".handlebars",
          },
          viewPath: this.viewPath,
        })
      );
    }
  }

  private buildOperationalDetails(extra?: Record<string, unknown>) {
    return {
      host: process.env.NODEMAILER_HOST || null,
      port: this.port,
      requireTLS: this.requireTLS,
      resolvedViewPath: this.viewPath,
      secure: this.secure,
      sender: resolveSenderAddress(),
      ...extra,
    };
  }

  private ensureMailConfiguration(template?: string) {
    const missingVariables = readMissingMailEnvVars();

    if (missingVariables.length) {
      throw new AppError(
        "A configuração de e-mail do servidor está incompleta.",
        500,
        "mail_config_invalid",
        this.buildOperationalDetails({
          hint: "Defina as variáveis SMTP obrigatórias no ambiente do backend.",
          missingVariables,
        })
      );
    }

    if (template && !this.viewPath) {
      throw new AppError(
        "Os templates de e-mail não foram encontrados no servidor.",
        500,
        "mail_template_missing",
        this.buildOperationalDetails({
          hint: "Garanta que a pasta de templates de e-mail seja copiada para a imagem de produção.",
          searchedPaths: MAIL_VIEW_PATH_CANDIDATES,
          template,
        })
      );
    }
  }

  private logMailFailure(error: unknown, options: MailTemplateOptions) {
    console.error("Mail delivery failed", {
      ...this.buildOperationalDetails({
        template: options.template || null,
        to: options.to,
      }),
      ...buildMailErrorDetails(error),
    });
  }

  public async sendMail(options: MailTemplateOptions) {
    this.ensureMailConfiguration(options.template);

    try {
      return await this.transporter.sendMail({
        ...options,
        from: options.from || resolveSenderAddress(),
      });
    } catch (error) {
      this.logMailFailure(error, options);

      if (
        hasErrorCode(error, "ENOENT") ||
        /Failed to lookup view/i.test(getErrorMessage(error))
      ) {
        throw new AppError(
          "O template de e-mail configurado não foi encontrado.",
          500,
          "mail_template_missing",
          this.buildOperationalDetails({
            ...buildMailErrorDetails(error),
            hint: "Confirme se os arquivos .handlebars estão presentes na imagem publicada.",
            searchedPaths: MAIL_VIEW_PATH_CANDIDATES,
            template: options.template || null,
          })
        );
      }

      if (hasErrorCode(error, "EAUTH") || getErrorResponseCode(error) === 535) {
        throw new AppError(
          "Falha na autenticação do provedor de e-mail. Revise as credenciais SMTP configuradas.",
          500,
          "mail_auth_failed",
          this.buildOperationalDetails({
            ...buildMailErrorDetails(error),
            hint: "Revise host, usuário, senha e a política SMTP do provedor.",
          })
        );
      }

      if (
        hasErrorCode(error, "ECONNECTION") ||
        hasErrorCode(error, "ESOCKET") ||
        hasErrorCode(error, "ETIMEDOUT") ||
        hasErrorCode(error, "EDNS")
      ) {
        throw new AppError(
          "Não foi possível conectar ao provedor de e-mail configurado.",
          500,
          "mail_connection_failed",
          this.buildOperationalDetails({
            ...buildMailErrorDetails(error),
            hint: "Verifique host, porta, TLS e regras de rede do provedor SMTP.",
          })
        );
      }

      throw new AppError(
        "Não foi possível enviar o e-mail no momento.",
        500,
        "mail_send_failed",
        this.buildOperationalDetails({
          ...buildMailErrorDetails(error),
          hint: "Consulte os logs do backend usando o requestId retornado pela API.",
          template: options.template || null,
        })
      );
    }
  }
}
