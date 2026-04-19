import { Router } from "express";
import { asyncHandler } from "../core/http/asyncHandler";
import { requireAuth } from "../middlewares/requireAuth";
import { AuthController } from "../modules/auth/auth.controller";

const authRouter = Router();
const authController = new AuthController();

authRouter.post("/register", asyncHandler(authController.register));
authRouter.post("/login", asyncHandler(authController.login));
authRouter.get("/me", requireAuth, asyncHandler(authController.getProfile));
authRouter.post("/logout", requireAuth, asyncHandler(authController.logout));

export { authRouter };
