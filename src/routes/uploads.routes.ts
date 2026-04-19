import multer from "multer";
import { Router } from "express";
import { asyncHandler } from "../core/http/asyncHandler";
import { requireAdmin } from "../middlewares/requireAdmin";
import { requireAuth } from "../middlewares/requireAuth";
import { UploadController } from "../modules/uploads/upload.controller";

const uploadsRouter = Router();
const adminUploadsRouter = Router();
const uploadController = new UploadController();
const uploadMiddleware = multer({
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  storage: multer.memoryStorage(),
});

uploadsRouter.get("/:folder/:fileName", asyncHandler(uploadController.show));

adminUploadsRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  uploadMiddleware.single("file"),
  asyncHandler(uploadController.create)
);

adminUploadsRouter.delete("/", requireAuth, requireAdmin, asyncHandler(uploadController.delete));

export { adminUploadsRouter, uploadsRouter };
