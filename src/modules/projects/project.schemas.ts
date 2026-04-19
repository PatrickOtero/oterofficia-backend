import { AppError } from "../../core/errors/AppError";
import { readObject, readOptionalPositiveInteger, readOptionalUrl, readRequiredString } from "../../core/utils/validation";
import { ProjectInput } from "./project.types";

export const parseProjectId = (value: unknown) => {
  const projectId = readOptionalPositiveInteger(value, "Identificador do projeto");

  if (!projectId) {
    throw new AppError("Identificador de projeto invalido.", 400, "invalid_project_id");
  }

  return projectId;
};

export const parseProjectPayload = (value: unknown): ProjectInput => {
  const body = readObject(value, "Dados do projeto");

  return {
    backendUrl: readOptionalUrl(body.backend_url, "URL do backend") ?? null,
    frontendUrl: readOptionalUrl(body.frontend_url, "URL do frontend") ?? null,
    imageUrl: readRequiredString(body.image_url, "Imagem do projeto", { max: 2048 }),
    projectDescription: readRequiredString(body.project_desc, "Descricao do projeto", {
      max: 4000,
      preserveWhitespace: true,
    }),
    projectName: readRequiredString(body.project_name, "Nome do projeto", { max: 255 }),
    videoUrl: readOptionalUrl(body.video_url, "URL do video") ?? null,
  };
};
