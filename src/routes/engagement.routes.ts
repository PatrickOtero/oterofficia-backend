import { Router } from "express";
import { asyncHandler } from "../core/http/asyncHandler";
import { optionalAuth } from "../middlewares/optionalAuth";
import { requireAdmin } from "../middlewares/requireAdmin";
import { requireAuth } from "../middlewares/requireAuth";
import { EngagementController } from "../modules/engagement/engagement.controller";

const engagementRouter = Router();
const adminEngagementRouter = Router();
const engagementController = new EngagementController();

engagementRouter.post("/site-visits/track", optionalAuth, asyncHandler(engagementController.trackSiteVisit));

adminEngagementRouter.use(requireAuth, requireAdmin);
adminEngagementRouter.get("/site-visits/summary", asyncHandler(engagementController.getSiteVisitorSummary));

export { adminEngagementRouter, engagementRouter };
