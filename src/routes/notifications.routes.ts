import { Router } from "express";
import { asyncHandler } from "../core/http/asyncHandler";
import { requireAuth } from "../middlewares/requireAuth";
import { EngagementController } from "../modules/engagement/engagement.controller";

const notificationsRouter = Router();
const engagementController = new EngagementController();

notificationsRouter.use(requireAuth);
notificationsRouter.get("/notifications", asyncHandler(engagementController.listNotifications));
notificationsRouter.post("/notifications/read-all", asyncHandler(engagementController.markAllNotificationsRead));
notificationsRouter.post(
  "/notifications/:notificationId/read",
  asyncHandler(engagementController.markNotificationRead)
);

export { notificationsRouter };
