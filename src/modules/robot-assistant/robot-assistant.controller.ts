import { Request, Response } from "express";
import { container } from "tsyringe";
import { RobotAssistantService } from "./robot-assistant.service";
import { RobotAssistantRequest } from "./robot-assistant.types";

const sanitizeNavigationContext = (value: unknown): RobotAssistantRequest["navigationContext"] => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const source = value as Record<string, unknown>;
  const recentRoutes = Array.isArray(source.recentRoutes)
    ? source.recentRoutes
        .filter(
          (entry): entry is { path: string; title?: string | null; visitedAt: string } =>
            Boolean(
              entry &&
                typeof entry === "object" &&
                !Array.isArray(entry) &&
                typeof (entry as { path?: unknown }).path === "string" &&
                typeof (entry as { visitedAt?: unknown }).visitedAt === "string"
            )
        )
        .slice(-12)
    : [];

  const lastStudy =
    source.lastStudy && typeof source.lastStudy === "object" && !Array.isArray(source.lastStudy)
      ? (source.lastStudy as RobotAssistantRequest["navigationContext"] extends infer T
          ? T extends { lastStudy?: infer L }
            ? L
            : never
          : never)
      : null;

  return {
    lastStudy,
    recentRoutes,
  };
};

export class RobotAssistantController {
  public respond = async (req: Request, res: Response) => {
    const payload: RobotAssistantRequest = {
      currentPath: typeof req.body?.currentPath === "string" ? req.body.currentPath : null,
      currentStudySlug: typeof req.body?.currentStudySlug === "string" ? req.body.currentStudySlug : null,
      navigationContext: sanitizeNavigationContext(req.body?.navigationContext),
      prompt: typeof req.body?.prompt === "string" ? req.body.prompt : "",
    };

    const response = await container.resolve(RobotAssistantService).respond({
      actor: req.user ?? null,
      request: payload,
    });

    return res.status(200).json(response);
  };
}
