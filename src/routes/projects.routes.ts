import { Router } from "express";
import { asyncHandler } from "../core/http/asyncHandler";
import { requireAdmin } from "../middlewares/requireAdmin";
import { requireAuth } from "../middlewares/requireAuth";
import { ProjectController } from "../modules/projects/project.controller";

const projectsRouter = Router();
const projectController = new ProjectController();

projectsRouter.get("/", asyncHandler(projectController.list));
projectsRouter.get("/:projectId", requireAuth, requireAdmin, asyncHandler(projectController.show));
projectsRouter.post("/", requireAuth, requireAdmin, asyncHandler(projectController.create));
projectsRouter.put("/:projectId", requireAuth, requireAdmin, asyncHandler(projectController.update));
projectsRouter.delete("/:projectId", requireAuth, requireAdmin, asyncHandler(projectController.delete));

export { projectsRouter };
