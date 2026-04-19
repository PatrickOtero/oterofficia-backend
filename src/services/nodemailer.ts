import nodemailer from "nodemailer";
import { injectable } from "tsyringe";
import { AppError } from "../core/errors/AppError";
import { IMailService, MailTemplateOptions } from "./mail.service.interface";

const handlebars = require("nodemailer-express-handlebars");

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

@injectable()
export class NodemailerService implements IMailService {
  private readonly transporter: ReturnType<typeof nodemailer.createTransport>;

  constructor() {
    const port = readPort();
    const secure = readBoolean(process.env.NODEMAILER_SECURE, port === 465);
    const requireTLS = readBoolean(process.env.NODEMAILER_REQUIRE_TLS, false);

    this.transporter = nodemailer.createTransport({
      auth: {
        pass: process.env.NODEMAILER_PASS,
        user: process.env.NODEMAILER_USER,
      },
      host: process.env.NODEMAILER_HOST,
      port,
      secure,
      requireTLS,
    });

    this.transporter.use(
      "compile",
      handlebars({
        viewEngine: {
          defaultLayout: false,
          extname: ".handlebars",
        },
        viewPath: "src/views/",
      })
    );
  }

  public async sendMail(options: MailTemplateOptions) {
    try {
      return await this.transporter.sendMail({
        ...options,
        from: options.from || resolveSenderAddress(),
      });
    } catch (error: any) {
      if (error?.code === "EAUTH" || error?.responseCode === 535) {
        throw new AppError(
          "Falha na autenticacao do provedor de e-mail. Revise as credenciais SMTP configuradas.",
          500,
          "mail_auth_failed"
        );
      }

      if (
        error?.code === "ECONNECTION" ||
        error?.code === "ESOCKET" ||
        error?.code === "ETIMEDOUT" ||
        error?.code === "EDNS"
      ) {
        throw new AppError(
          "Nao foi possivel conectar ao provedor de e-mail configurado.",
          500,
          "mail_connection_failed"
        );
      }

      throw new AppError(
        "Nao foi possivel enviar o e-mail no momento.",
        500,
        "mail_send_failed"
      );
    }
  }
}
