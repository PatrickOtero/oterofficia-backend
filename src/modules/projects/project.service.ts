import { inject, singleton } from "tsyringe";
import { AppError } from "../../core/errors/AppError";
import { TOKENS } from "../../shared/container/tokens";
import { ProjectEntity } from "../../shared/infra/database/entities/ProjectEntity";
import { normalizeUploadUrl } from "../uploads/upload-url";
import { IProjectRepository } from "./project.repository.interface";
import { ProjectInput, ProjectResponse } from "./project.types";

const mapProject = (project: ProjectEntity): ProjectResponse => ({
  backend_url: project.backendUrl,
  frontend_url: project.frontendUrl,
  id: project.id,
  image_url: normalizeUploadUrl(project.imageUrl),
  organization_name: project.organizationName,
  project_desc: project.projectDescription,
  project_highlight: project.projectHighlight,
  project_name: project.projectName,
  project_role: project.projectRole,
  project_status: project.projectStatus,
  project_tags: Array.isArray(project.projectTags) ? project.projectTags : [],
  project_track: project.projectTrack,
  video_url: project.videoUrl,
});

@singleton()
export class ProjectService {
  constructor(
    @inject(TOKENS.ProjectRepository)
    private readonly repository: IProjectRepository
  ) {}

  public async createProject(input: ProjectInput) {
    const existingByImage = await this.repository.findByImageUrl(input.imageUrl);
    const existingByName = await this.repository.findByName(input.projectName);

    if (existingByImage || existingByName) {
      throw new AppError("Já existe um projeto com esta imagem ou este nome.", 400, "project_conflict");
    }

    const project = await this.repository.createProject(input);

    return mapProject(project);
  }

  public async deleteProject(projectId: number) {
    const project = await this.repository.findById(projectId);

    if (!project) {
      throw new AppError("Projeto não encontrado.", 404, "project_not_found");
    }

    await this.repository.deleteProject(projectId);

    return { message: "Projeto excluído com sucesso." };
  }

  public async getProject(projectId: number) {
    const project = await this.repository.findById(projectId);

    if (!project) {
      throw new AppError("Projeto não encontrado.", 404, "project_not_found");
    }

    return mapProject(project);
  }

  public async listProjects() {
    const allProjects = await this.repository.findAll();

    return allProjects.map((project) => mapProject(project));
  }

  public async updateProject(projectId: number, input: ProjectInput) {
    const project = await this.repository.findById(projectId);

    if (!project) {
      throw new AppError("Projeto não encontrado.", 404, "project_not_found");
    }

    const conflictingProject = await this.repository.findConflictingProject(
      projectId,
      input.imageUrl,
      input.projectName
    );

    if (conflictingProject) {
      throw new AppError("Já existe um projeto com esta imagem ou este nome.", 400, "project_conflict");
    }

    await this.repository.updateProject(projectId, input);

    const updatedProject = await this.repository.findById(projectId);

    if (!updatedProject) {
      throw new AppError("Projeto não encontrado.", 404, "project_not_found");
    }

    return mapProject(updatedProject);
  }
}
