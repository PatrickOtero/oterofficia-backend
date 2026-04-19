import { Router } from "express";
import { asyncHandler } from "../core/http/asyncHandler";
import { requireAuth } from "../middlewares/requireAuth";
import { LikeController } from "../modules/likes/like.controller";

const likesRouter = Router();
const likeController = new LikeController();

likesRouter.post("/studies/:studyId/likes", requireAuth, asyncHandler(likeController.create));
likesRouter.delete("/studies/:studyId/likes", requireAuth, asyncHandler(likeController.delete));

export { likesRouter };
