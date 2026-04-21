import { Request, Response } from "express";
import { container } from "tsyringe";
import { EngagementService } from "./engagement.service";

const parseLimit = (value: unknown) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.min(Math.max(Math.trunc(parsed), 1), 50);
};

export class EngagementController {
  public getAdminAnalytics = async (_req: Request, res: Response) => {
    const analytics = await container.resolve(EngagementService).getAdminInteractionAnalytics();

    return res.status(200).json(analytics);
  };

  public listNotifications = async (req: Request, res: Response) => {
    const feed = await container.resolve(EngagementService).listNotifications(
      req.user!.id,
      parseLimit(req.query.limit)
    );

    return res.status(200).json(feed);
  };

  public markAllNotificationsRead = async (req: Request, res: Response) => {
    const feed = await container.resolve(EngagementService).markAllNotificationsRead(req.user!.id);

    return res.status(200).json(feed);
  };

  public markNotificationRead = async (req: Request, res: Response) => {
    const feed = await container.resolve(EngagementService).markNotificationRead(
      req.params.notificationId,
      req.user!.id
    );

    return res.status(200).json(feed);
  };
}
