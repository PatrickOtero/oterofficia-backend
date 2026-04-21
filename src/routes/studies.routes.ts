import { Router } from "express";
import { asyncHandler } from "../core/http/asyncHandler";
import { optionalAuth } from "../middlewares/optionalAuth";
import { requireAdmin } from "../middlewares/requireAdmin";
import { requireAuth } from "../middlewares/requireAuth";
import { EngagementController } from "../modules/engagement/engagement.controller";
import { StudyController } from "../modules/studies/study.controller";

const studiesRouter = Router();
const adminStudiesRouter = Router();
const studyController = new StudyController();
const engagementController = new EngagementController();

studiesRouter.get("/", optionalAuth, asyncHandler(studyController.listPublic));
studiesRouter.get("/:slug", optionalAuth, asyncHandler(studyController.getPublicStudy));

adminStudiesRouter.use(requireAuth, requireAdmin);
adminStudiesRouter.get("/analytics", asyncHandler(engagementController.getAdminAnalytics));
adminStudiesRouter.get("/dashboard", asyncHandler(studyController.getAdminDashboard));
adminStudiesRouter.get("/", asyncHandler(studyController.listAdmin));
adminStudiesRouter.get("/:id", asyncHandler(studyController.getAdminStudy));
adminStudiesRouter.post("/", asyncHandler(studyController.create));
adminStudiesRouter.put("/:id", asyncHandler(studyController.update));
adminStudiesRouter.patch("/:id/status", asyncHandler(studyController.setStatus));
adminStudiesRouter.delete("/:id", asyncHandler(studyController.delete));

export { adminStudiesRouter, studiesRouter };
