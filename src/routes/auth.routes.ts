import multer from "multer";
import { Router } from "express";
import { asyncHandler } from "../core/http/asyncHandler";
import { requireAuth } from "../middlewares/requireAuth";
import { AuthController } from "../modules/auth/auth.controller";

const authRouter = Router();
const authController = new AuthController();
const uploadMiddleware = multer({
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  storage: multer.memoryStorage(),
});

authRouter.post("/register", asyncHandler(authController.register));
authRouter.post("/login", asyncHandler(authController.login));
authRouter.post("/resend-verification", asyncHandler(authController.resendVerificationEmail));
authRouter.post("/verify-email", asyncHandler(authController.verifyEmail));
authRouter.post("/forgot-password", asyncHandler(authController.requestPasswordReset));
authRouter.post("/reset-password", asyncHandler(authController.resetPassword));
authRouter.post("/confirm-email-change", asyncHandler(authController.confirmEmailChange));
authRouter.post("/confirm-account-deletion", asyncHandler(authController.confirmAccountDeletion));

authRouter.get("/me", requireAuth, asyncHandler(authController.getProfile));
authRouter.post("/logout", requireAuth, asyncHandler(authController.logout));
authRouter.patch("/profile", requireAuth, asyncHandler(authController.updateProfile));
authRouter.patch("/profile/password", requireAuth, asyncHandler(authController.changePassword));
authRouter.post("/profile/avatar", requireAuth, uploadMiddleware.single("file"), asyncHandler(authController.uploadAvatar));
authRouter.post("/profile/email-change", requireAuth, asyncHandler(authController.requestEmailChange));
authRouter.post("/profile/account-deletion", requireAuth, asyncHandler(authController.requestAccountDeletion));

export { authRouter };
