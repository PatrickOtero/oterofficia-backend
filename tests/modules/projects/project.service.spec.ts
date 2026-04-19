import { AppError } from "../../../src/core/errors/AppError";
import { ProjectRepositoryInMemory } from "../../../src/modules/projects/repositories/in-memory/ProjectRepositoryInMemory";
import { ProjectService } from "../../../src/modules/projects/project.service";

describe("ProjectService", () => {
  let projectRepository: ProjectRepositoryInMemory;
  let projectService: ProjectService;

  beforeEach(() => {
    projectRepository = new ProjectRepositoryInMemory();
    projectService = new ProjectService(projectRepository);
  });

  it("creates and lists projects in ascending order", async () => {
    await projectService.createProject({
      backendUrl: "https://api.example.com",
      frontendUrl: "https://app.example.com",
      imageUrl: "https://cdn.example.com/image.png",
      projectDescription: "Projeto principal",
      projectName: "Oterofficia",
      videoUrl: null,
    });

    const projects = await projectService.listProjects();

    expect(projects).toHaveLength(1);
    expect(projects[0]).toMatchObject({
      project_name: "Oterofficia",
      image_url: "https://cdn.example.com/image.png",
    });
  });

  it("prevents duplicate project names or images", async () => {
    await projectService.createProject({
      backendUrl: null,
      frontendUrl: null,
      imageUrl: "https://cdn.example.com/image-a.png",
      projectDescription: "Primeiro projeto",
      projectName: "Projeto A",
      videoUrl: null,
    });

    await expect(
      projectService.createProject({
        backendUrl: null,
        frontendUrl: null,
        imageUrl: "https://cdn.example.com/image-a.png",
        projectDescription: "Projeto repetido",
        projectName: "Projeto B",
        videoUrl: null,
      })
    ).rejects.toMatchObject<AppError>({
      code: "project_conflict",
      statusCode: 400,
    });
  });

  it("updates an existing project", async () => {
    await projectService.createProject({
      backendUrl: null,
      frontendUrl: null,
      imageUrl: "https://cdn.example.com/image-a.png",
      projectDescription: "Primeiro projeto",
      projectName: "Projeto A",
      videoUrl: null,
    });

    await projectService.updateProject(1, {
      backendUrl: "https://api.example.com",
      frontendUrl: "https://app.example.com",
      imageUrl: "https://cdn.example.com/image-b.png",
      projectDescription: "Projeto atualizado",
      projectName: "Projeto A+",
      videoUrl: "https://youtube.com/watch?v=123",
    });

    const projects = await projectService.listProjects();

    expect(projects[0]).toMatchObject({
      backend_url: "https://api.example.com",
      project_desc: "Projeto atualizado",
      project_name: "Projeto A+",
    });
  });
});
