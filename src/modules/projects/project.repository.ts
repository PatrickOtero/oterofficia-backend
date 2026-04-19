import { getDataSource } from "../../shared/infra/database/data-source";
import { ProjectEntity } from "../../shared/infra/database/entities/ProjectEntity";
import { injectable } from "tsyringe";
import { IProjectRepository } from "./project.repository.interface";
import { ProjectInput } from "./project.types";

@injectable()
export class ProjectRepository implements IProjectRepository {
  private async syncPrimaryKeySequence() {
    const dataSource = await getDataSource();

    await dataSource.query(
      `
        SELECT setval(
          pg_get_serial_sequence('"projects"', 'id'),
          COALESCE((SELECT MAX(id) FROM "projects"), 0) + 1,
          false
        )
      `
    );
  }

  public async createProject(input: ProjectInput) {
    const dataSource = await getDataSource();
    const repository = dataSource.getRepository(ProjectEntity);
    await this.syncPrimaryKeySequence();
    const project = repository.create(input);

    return repository.save(project);
  }

  public async deleteProject(projectId: number) {
    const dataSource = await getDataSource();

    await dataSource.getRepository(ProjectEntity).delete({ id: projectId });
  }

  public async findAll() {
    const dataSource = await getDataSource();

    return dataSource.getRepository(ProjectEntity).find({
      order: {
        id: "ASC",
      },
    });
  }

  public async findById(projectId: number) {
    const dataSource = await getDataSource();

    return dataSource.getRepository(ProjectEntity).findOne({
      where: {
        id: projectId,
      },
    });
  }

  public async findConflictingProject(projectId: number, imageUrl: string, projectName: string) {
    const dataSource = await getDataSource();

    return dataSource
      .getRepository(ProjectEntity)
      .createQueryBuilder("project")
      .where("(project.imageUrl = :imageUrl OR project.projectName = :projectName)", {
        imageUrl,
        projectName,
      })
      .andWhere("project.id != :projectId", { projectId })
      .getOne();
  }

  public async findByImageUrl(imageUrl: string) {
    const dataSource = await getDataSource();

    return dataSource.getRepository(ProjectEntity).findOne({
      where: {
        imageUrl,
      },
    });
  }

  public async findByName(projectName: string) {
    const dataSource = await getDataSource();

    return dataSource.getRepository(ProjectEntity).findOne({
      where: {
        projectName,
      },
    });
  }

  public async updateProject(projectId: number, input: ProjectInput) {
    const dataSource = await getDataSource();

    await dataSource.getRepository(ProjectEntity).update({ id: projectId }, input);
  }
}
