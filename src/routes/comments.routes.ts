import { Router } from "express";
import { asyncHandler } from "../core/http/asyncHandler";
import { optionalAuth } from "../middlewares/optionalAuth";
import { requireAdmin } from "../middlewares/requireAdmin";
import { requireAuth } from "../middlewares/requireAuth";
import { CommentController } from "../modules/comments/comment.controller";

const commentsRouter = Router();
const adminCommentsRouter = Router();
const commentController = new CommentController();

commentsRouter.get("/studies/:studyId/comments", optionalAuth, asyncHandler(commentController.listByPost));
commentsRouter.post("/studies/:studyId/comments", requireAuth, asyncHandler(commentController.create));
commentsRouter.delete("/comments/:commentId", requireAuth, asyncHandler(commentController.delete));

adminCommentsRouter.use(requireAuth, requireAdmin);
adminCommentsRouter.get("/comments", asyncHandler(commentController.listAdmin));
adminCommentsRouter.delete("/comments/:commentId", asyncHandler(commentController.delete));

export { adminCommentsRouter, commentsRouter };
