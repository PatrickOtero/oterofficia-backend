import { Router } from "express";
import { asyncHandler } from "../core/http/asyncHandler";
import { optionalAuth } from "../middlewares/optionalAuth";
import { RobotAssistantController } from "../modules/robot-assistant/robot-assistant.controller";

const robotAssistantRouter = Router();
const robotAssistantController = new RobotAssistantController();

robotAssistantRouter.post("/robot/converse", optionalAuth, asyncHandler(robotAssistantController.respond));

export { robotAssistantRouter };
