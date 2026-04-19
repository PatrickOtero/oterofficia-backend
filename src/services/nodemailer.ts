import nodemailer from "nodemailer";
import { injectable } from "tsyringe";
import { IMailService, MailTemplateOptions } from "./mail.service.interface";

const handlebars = require("nodemailer-express-handlebars");

@injectable()
export class NodemailerService implements IMailService {
  private readonly transporter: ReturnType<typeof nodemailer.createTransport>;

  constructor() {
    this.transporter = nodemailer.createTransport({
      auth: {
        pass: process.env.NODEMAILER_PASS,
        user: process.env.NODEMAILER_USER,
      },
      host: process.env.NODEMAILER_HOST,
      port: 587,
      secure: false,
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
    return this.transporter.sendMail(options);
  }
}
