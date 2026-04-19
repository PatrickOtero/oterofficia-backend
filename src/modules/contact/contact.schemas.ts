import { readObject, readRequiredString } from "../../core/utils/validation";

export type ContactPayload = {
  email: string;
  emailContent: string;
  name: string;
  subject: string;
};

export const parseContactPayload = (value: unknown): ContactPayload => {
  const body = readObject(value, "Dados de contato");

  return {
    email: readRequiredString(body.email, "E-mail", { max: 320 }),
    emailContent: readRequiredString(body.emailContent, "Mensagem", {
      max: 10000,
      preserveWhitespace: true,
    }),
    name: readRequiredString(body.name, "Nome", { max: 120 }),
    subject: readRequiredString(body.subject, "Assunto", { max: 160 }),
  };
};
