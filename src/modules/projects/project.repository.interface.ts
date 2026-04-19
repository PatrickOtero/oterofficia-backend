import { ProjectEntity } from "../../shared/infra/database/entities/ProjectEntity";
import { ProjectInput } from "./project.types";

export interface IProjectRepository {
  createProject(input: ProjectInput): Promise<ProjectEntity>;
  deleteProject(projectId: number): Promise<void>;
  findAll(): Promise<ProjectEntity[]>;
  findById(projectId: number): Promise<ProjectEntity | null>;
  findConflictingProject(projectId: number, imageUrl: string, projectName: string): Promise<ProjectEntity | null>;
  findByImageUrl(imageUrl: string): Promise<ProjectEntity | null>;
  findByName(projectName: string): Promise<ProjectEntity | null>;
  updateProject(projectId: number, input: ProjectInput): Promise<void>;
}
