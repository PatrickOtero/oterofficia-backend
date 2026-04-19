import { Request, Response } from "express";
import { container } from "tsyringe";
import { parseAdminCommentFilters, parseCommentPayload } from "./comment.schemas";
import { CommentService } from "./comment.service";

export class CommentController {
  public create = async (req: Request, res: Response) => {
    const { content } = parseCommentPayload(req.body);
    const payload = await container.resolve(CommentService).createComment(req.params.studyId, content, req.user!);

    return res.status(201).json(payload);
  };

  public delete = async (req: Request, res: Response) => {
    const payload = await container.resolve(CommentService).deleteComment(req.params.commentId, req.user!);

    return res.status(200).json(payload);
  };

  public listAdmin = async (req: Request, res: Response) => {
    const filters = parseAdminCommentFilters(req.query);
    const comments = await container.resolve(CommentService).listAdminComments(filters);

    return res.status(200).json(comments);
  };

  public listByPost = async (req: Request, res: Response) => {
    const comments = await container.resolve(CommentService).listComments(req.params.studyId, req.user);

    return res.status(200).json(comments);
  };
}
