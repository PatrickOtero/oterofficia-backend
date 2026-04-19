import { Router } from "express";
import { authRouter } from "./auth.routes";
import { adminCommentsRouter, commentsRouter } from "./comments.routes";
import { contactRouter } from "./contact.routes";
import { likesRouter } from "./likes.routes";
import { projectsRouter } from "./projects.routes";
import { adminStudiesRouter, studiesRouter } from "./studies.routes";
import { adminUploadsRouter, uploadsRouter } from "./uploads.routes";

const router = Router();

router.use("/uploads", uploadsRouter);
router.use("/auth", authRouter);
router.use("/studies", studiesRouter);
router.use("/projects", projectsRouter);
router.use("/", contactRouter);
router.use("/", commentsRouter);
router.use("/", likesRouter);
router.use("/admin/uploads", adminUploadsRouter);
router.use("/admin/studies", adminCommentsRouter);
router.use("/admin/studies", adminStudiesRouter);

export { router };
