import { Request, Response } from "express";
import { container } from "tsyringe";
import { parseProjectId, parseProjectPayload } from "./project.schemas";
import { ProjectService } from "./project.service";

export class ProjectController {
  public create = async (req: Request, res: Response) => {
    const payload = parseProjectPayload(req.body);
    const response = await container.resolve(ProjectService).createProject(payload);

    return res.status(201).json(response);
  };

  public delete = async (req: Request, res: Response) => {
    const response = await container.resolve(ProjectService).deleteProject(parseProjectId(req.params.projectId));

    return res.status(200).json(response);
  };

  public list = async (_req: Request, res: Response) => {
    const projects = await container.resolve(ProjectService).listProjects();

    return res.status(200).json(projects);
  };

  public show = async (req: Request, res: Response) => {
    const project = await container.resolve(ProjectService).getProject(parseProjectId(req.params.projectId));

    return res.status(200).json(project);
  };

  public update = async (req: Request, res: Response) => {
    const payload = parseProjectPayload(req.body);
    const response = await container.resolve(ProjectService).updateProject(parseProjectId(req.params.projectId), payload);

    return res.status(200).json(response);
  };
}
