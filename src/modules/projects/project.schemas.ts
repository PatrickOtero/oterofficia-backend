import { AppError } from "../../core/errors/AppError";
import {
  readEnum,
  readObject,
  readOptionalPositiveInteger,
  readOptionalString,
  readOptionalUrl,
  readRequiredString,
  readStringArray,
} from "../../core/utils/validation";
import { ProjectInput, ProjectStatus, ProjectTrack } from "./project.types";

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
    organizationName: readOptionalString(body.organization_name, "Organização", { max: 120 }) ?? null,
    projectDescription: readRequiredString(body.project_desc, "Descricao do projeto", {
      max: 4000,
      preserveWhitespace: true,
    }),
    projectHighlight: readOptionalString(body.project_highlight, "Resumo do projeto", {
      max: 220,
      preserveWhitespace: true,
    }) ?? null,
    projectName: readRequiredString(body.project_name, "Nome do projeto", { max: 255 }),
    projectRole: readOptionalString(body.project_role, "Papel no projeto", { max: 140 }) ?? null,
    projectStatus: readEnum<ProjectStatus>(
      body.project_status,
      "Status do projeto",
      ["completed", "in_progress"],
      "completed"
    ),
    projectTags: readStringArray(body.project_tags, "Tags do projeto", {
      maxItemLength: 40,
      maxItems: 10,
    }),
    projectTrack: readEnum<ProjectTrack>(
      body.project_track,
      "Trilha do projeto",
      ["personal", "soujunior"],
      "personal"
    ),
    videoUrl: readOptionalUrl(body.video_url, "URL do video") ?? null,
  };
};
