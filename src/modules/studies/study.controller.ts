import { Request, Response } from "express";
import { container } from "tsyringe";
import { parseAdminStudyFilters, parsePublicStudyFilters, parseStatusPayload, parseStudyPayload } from "./study.schemas";
import { StudyService } from "./study.service";

export class StudyController {
  public create = async (req: Request, res: Response) => {
    const payload = parseStudyPayload(req.body);
    const study = await container.resolve(StudyService).createStudy(payload);

    return res.status(201).json(study);
  };

  public delete = async (req: Request, res: Response) => {
    await container.resolve(StudyService).deleteStudy(req.params.id);

    return res.status(204).send();
  };

  public getAdminDashboard = async (req: Request, res: Response) => {
    const dashboard = await container.resolve(StudyService).getAdminDashboard(req.user?.id);

    return res.status(200).json(dashboard);
  };

  public getAdminStudy = async (req: Request, res: Response) => {
    const study = await container.resolve(StudyService).getAdminStudy(req.params.id, req.user?.id);

    return res.status(200).json(study);
  };

  public getPublicStudy = async (req: Request, res: Response) => {
    const study = await container.resolve(StudyService).getPublicStudy(req.params.slug, req.user?.id);

    return res.status(200).json(study);
  };

  public listAdmin = async (req: Request, res: Response) => {
    const filters = parseAdminStudyFilters(req.query);
    const studies = await container.resolve(StudyService).listAdminStudies(filters, req.user?.id);

    return res.status(200).json(studies);
  };

  public listPublic = async (req: Request, res: Response) => {
    const filters = parsePublicStudyFilters(req.query);
    const studies = await container.resolve(StudyService).listPublishedStudies(filters, req.user?.id);

    return res.status(200).json(studies);
  };

  public setStatus = async (req: Request, res: Response) => {
    const status = parseStatusPayload(req.body);
    const study = await container.resolve(StudyService).setStudyStatus(req.params.id, status, req.user?.id);

    return res.status(200).json(study);
  };

  public update = async (req: Request, res: Response) => {
    const payload = parseStudyPayload(req.body);
    const study = await container.resolve(StudyService).updateStudy(req.params.id, payload, req.user?.id);

    return res.status(200).json(study);
  };
}
