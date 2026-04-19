export type MailTemplateOptions = {
  context?: Record<string, unknown>;
  from: string;
  replyTo: string;
  subject: string;
  template?: string;
  to: string;
};

export interface IMailService {
  sendMail(options: MailTemplateOptions): Promise<unknown>;
}
