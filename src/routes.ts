import { Router } from "express"
import { receiveEmail } from "./controllers/receiveEmail";
import { createStudyPost } from "./controllers/studyPostController";

const routes = Router();

routes.post("/studyPost", createStudyPost)
routes.post("/receiveEmail", receiveEmail)

export { routes }