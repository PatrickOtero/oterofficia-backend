import { Request, Response } from "express";
import { container } from "tsyringe";
import { LikeService } from "./like.service";

export class LikeController {
  public create = async (req: Request, res: Response) => {
    const payload = await container.resolve(LikeService).createLike(req.params.studyId, req.user!.id);

    return res.status(201).json(payload);
  };

  public delete = async (req: Request, res: Response) => {
    const payload = await container.resolve(LikeService).deleteLike(req.params.studyId, req.user!.id);

    return res.status(200).json(payload);
  };
}
