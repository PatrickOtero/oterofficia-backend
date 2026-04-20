import { Router } from "express";
import { asyncHandler } from "../core/http/asyncHandler";
import { requireAdmin } from "../middlewares/requireAdmin";
import { requireAuth } from "../middlewares/requireAuth";
import { AboutController } from "../modules/about/about.controller";

const aboutRouter = Router();
const adminAboutRouter = Router();
const aboutController = new AboutController();

aboutRouter.get("/", asyncHandler(aboutController.getPublicPage));

adminAboutRouter.use(requireAuth, requireAdmin);
adminAboutRouter.get("/", asyncHandler(aboutController.getAdminPage));
adminAboutRouter.put("/", asyncHandler(aboutController.updatePage));

export { aboutRouter, adminAboutRouter };
