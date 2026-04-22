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

const parseDateQuery = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export class EngagementController {
  public getAdminAnalytics = async (_req: Request, res: Response) => {
    const analytics = await container.resolve(EngagementService).getAdminInteractionAnalytics();

    return res.status(200).json(analytics);
  };

  public getSiteVisitorSummary = async (req: Request, res: Response) => {
    const since = parseDateQuery(req.query.since);
    const until = parseDateQuery(req.query.until);

    if (since === undefined || until === undefined) {
      return res.status(400).json({
        error: {
          code: "invalid_site_visit_window",
          message: "Os parametros since/until precisam ser datas validas.",
        },
      });
    }

    if (since && until && since.getTime() >= until.getTime()) {
      return res.status(400).json({
        error: {
          code: "invalid_site_visit_window",
          message: "O intervalo do radar precisa ter since menor que until.",
        },
      });
    }

    const summary = await container.resolve(EngagementService).getSiteVisitorSummary({
      since,
      until,
    });

    return res.status(200).json(summary);
  };

  public trackSiteVisit = async (req: Request, res: Response) => {
    const visitorKey =
      typeof req.body?.visitorKey === "string" ? req.body.visitorKey.trim() : "";
    const userAgentHeader = req.headers["user-agent"];
    const userAgent = Array.isArray(userAgentHeader) ? userAgentHeader.join(" | ") : userAgentHeader ?? null;

    if (!visitorKey) {
      return res.status(400).json({
        error: {
          code: "invalid_visitor_key",
          message: "visitorKey eh obrigatorio.",
        },
      });
    }

    await container.resolve(EngagementService).registerSiteVisit({
      isAdminUser: req.user?.role === "admin",
      lastPath: typeof req.body?.path === "string" ? req.body.path : null,
      referrer: typeof req.body?.referrer === "string" ? req.body.referrer : null,
      userAgent,
      visitorKey,
    });

    return res.status(204).send();
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
