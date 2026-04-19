import { inject, injectable } from "tsyringe";
import { TOKENS } from "../../shared/container/tokens";
import { IMailService } from "../../services/mail.service.interface";

type ContactEmailInput = {
  email: string;
  emailContent: string;
  name: string;
  subject: string;
};

@injectable()
export class ContactService {
  constructor(
    @inject(TOKENS.MailService)
    private readonly mailer: IMailService
  ) {}

  public async sendEmail(input: ContactEmailInput) {
    await this.mailer.sendMail({
      context: {
        emailContent: input.emailContent,
        name: input.name,
      },
      from: `"${input.name}" <${process.env.NODEMAILER_USER}>`,
      replyTo: input.email,
      subject: input.subject,
      template: "receivingEmail",
      to: "patrick.rocha.otero@gmail.com",
    });

    return { message: "E-mail enviado com sucesso" };
  }
}
