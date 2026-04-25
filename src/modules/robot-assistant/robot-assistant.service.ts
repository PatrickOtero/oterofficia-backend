import { singleton } from "tsyringe";
import { AuthenticatedSessionUser } from "../auth/auth.types";
import { RobotAdminAssistantService } from "./robot-admin-assistant.service";
import { RobotAssistantDataService } from "./robot-assistant.data.service";
import { RobotAssistantRequest } from "./robot-assistant.types";
import { RobotUserAssistantService } from "./robot-user-assistant.service";

@singleton()
export class RobotAssistantService {
  constructor(
    private readonly dataService: RobotAssistantDataService,
    private readonly adminAssistant: RobotAdminAssistantService,
    private readonly userAssistant: RobotUserAssistantService
  ) {}

  public async respond(input: {
    actor: AuthenticatedSessionUser | null;
    request: RobotAssistantRequest;
  }) {
    const { actor, request } = input;

    if (actor?.role === "admin") {
      const snapshot = await this.dataService.getAdminSnapshot({
        currentPath: request.currentPath ?? null,
      });

      return this.adminAssistant.buildResponse({
        prompt: request.prompt,
        snapshot,
      });
    }

    const snapshot = await this.dataService.getUserSnapshot({
      currentPath: request.currentPath ?? null,
      currentStudySlug: request.currentStudySlug ?? null,
      navigationContext: request.navigationContext ?? null,
      userId: actor?.id ?? null,
      userRole: actor?.role ?? null,
    });

    return this.userAssistant.buildResponse({
      prompt: request.prompt,
      snapshot,
    });
  }
}
