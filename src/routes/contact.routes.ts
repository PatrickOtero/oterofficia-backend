import { Router } from "express";
import { asyncHandler } from "../core/http/asyncHandler";
import { ContactController } from "../modules/contact/contact.controller";

const contactRouter = Router();
const contactController = new ContactController();

contactRouter.post("/receiveEmail", asyncHandler(contactController.sendEmail));

export { contactRouter };
