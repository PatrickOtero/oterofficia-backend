import { Request, Response } from "express";
import { container } from "tsyringe";
import { parseAboutPayload } from "./about.schemas";
import { AboutService } from "./about.service";

export class AboutController {
  public getAdminPage = async (_req: Request, res: Response) => {
    const page = await container.resolve(AboutService).getAdminPage();

    return res.status(200).json(page);
  };

  public getPublicPage = async (_req: Request, res: Response) => {
    const page = await container.resolve(AboutService).getPublicPage();

    return res.status(200).json(page);
  };

  public updatePage = async (req: Request, res: Response) => {
    const payload = parseAboutPayload(req.body);
    const page = await container.resolve(AboutService).updatePage(payload);

    return res.status(200).json(page);
  };
}
