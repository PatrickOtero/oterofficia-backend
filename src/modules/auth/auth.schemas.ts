import { AppError } from "../../core/errors/AppError";
import { readObject, readOptionalString, readRequiredString } from "../../core/utils/validation";

const parseOptionalBirthDate = (value: unknown) => {
  const normalized = readOptionalString(value, "A data de nascimento", { max: 20 });

  if (!normalized) {
    return null;
  }

  const parsedDate = new Date(`${normalized}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError("A data de nascimento esta invalida.", 400, "validation_error");
  }

  return parsedDate;
};

export const parseRegisterPayload = (payload: unknown) => {
  const body = readObject(payload, "Os dados de cadastro");

  return {
    email: readRequiredString(body.email, "O e-mail", { max: 190 }).toLowerCase(),
    name: readRequiredString(body.name, "O nome", { max: 160 }),
    password: readRequiredString(body.password, "A senha", { max: 120, min: 8 }),
  };
};

export const parseLoginPayload = (payload: unknown) => {
  const body = readObject(payload, "Os dados de acesso");

  return {
    email: readRequiredString(body.email, "O e-mail", { max: 190 }).toLowerCase(),
    password: readRequiredString(body.password, "A senha", { max: 120, min: 8 }),
  };
};

export const parseEmailPayload = (payload: unknown) => {
  const body = readObject(payload, "Os dados do e-mail");

  return {
    email: readRequiredString(body.email, "O e-mail", { max: 190 }).toLowerCase(),
  };
};

export const parseTokenPayload = (payload: unknown) => {
  const body = readObject(payload, "Os dados do token");

  return {
    token: readRequiredString(body.token, "O token", { max: 220 }),
  };
};

export const parseResetPasswordPayload = (payload: unknown) => {
  const body = readObject(payload, "Os dados de redefinicao");

  return {
    password: readRequiredString(body.password, "A nova senha", { max: 120, min: 8 }),
    token: readRequiredString(body.token, "O token", { max: 220 }),
  };
};

export const parseUpdateProfilePayload = (payload: unknown) => {
  const body = readObject(payload, "Os dados do perfil");

  return {
    avatarUrl: body.avatarUrl === null ? null : readOptionalString(body.avatarUrl, "O avatar", { max: 2048 }),
    birthDate: parseOptionalBirthDate(body.birthDate),
    name: readOptionalString(body.name, "O nome", { max: 160 }),
  };
};

export const parseChangePasswordPayload = (payload: unknown) => {
  const body = readObject(payload, "Os dados de senha");

  return {
    currentPassword: readRequiredString(body.currentPassword, "A senha atual", { max: 120, min: 8 }),
    newPassword: readRequiredString(body.newPassword, "A nova senha", { max: 120, min: 8 }),
  };
};

export const parseEmailChangePayload = (payload: unknown) => {
  const body = readObject(payload, "Os dados de troca de e-mail");

  return {
    nextEmail: readRequiredString(body.nextEmail, "O novo e-mail", { max: 190 }).toLowerCase(),
  };
};

export const parseDeletionRequestPayload = (payload: unknown) => {
  const body = readObject(payload, "Os dados de exclusao");

  return {
    password: readRequiredString(body.password, "A senha atual", { max: 120, min: 8 }),
  };
};
