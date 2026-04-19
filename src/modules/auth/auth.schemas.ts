import { readObject, readRequiredString } from "../../core/utils/validation";

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
