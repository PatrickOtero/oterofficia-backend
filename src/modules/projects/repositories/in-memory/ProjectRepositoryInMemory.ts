import { ProjectEntity } from "../../../../shared/infra/database/entities/ProjectEntity";
import { IProjectRepository } from "../../project.repository.interface";
import { ProjectInput } from "../../project.types";

export class ProjectRepositoryInMemory implements IProjectRepository {
  public projects: ProjectEntity[] = [];

  private nextId = 1;

  public async createProject(input: ProjectInput) {
    const project = Object.assign(new ProjectEntity(), {
      ...input,
      id: this.nextId,
    });

    this.nextId += 1;
    this.projects.push(project);

    return project;
  }

  public async deleteProject(projectId: number) {
    this.projects = this.projects.filter((project) => project.id !== projectId);
  }

  public async findAll() {
    return [...this.projects].sort((firstProject, secondProject) => firstProject.id - secondProject.id);
  }

  public async findById(projectId: number) {
    return this.projects.find((project) => project.id === projectId) ?? null;
  }

  public async findConflictingProject(projectId: number, imageUrl: string, projectName: string) {
    return (
      this.projects.find(
        (project) =>
          project.id !== projectId &&
          (project.imageUrl === imageUrl || project.projectName === projectName)
      ) ?? null
    );
  }

  public async findByImageUrl(imageUrl: string) {
    return this.projects.find((project) => project.imageUrl === imageUrl) ?? null;
  }

  public async findByName(projectName: string) {
    return this.projects.find((project) => project.projectName === projectName) ?? null;
  }

  public async updateProject(projectId: number, input: ProjectInput) {
    this.projects = this.projects.map((project) =>
      project.id === projectId
        ? Object.assign(new ProjectEntity(), {
            ...project,
            ...input,
          })
        : project
    );
  }
}
