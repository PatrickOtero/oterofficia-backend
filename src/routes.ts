import { Router } from "express"
import { createProject, deleteProject, editProject, getProjects } from "./controllers/projectsControllers";
import { receiveEmail } from "./controllers/receiveEmail";
import { createStudyPost } from "./controllers/studyPostControllers";

const routes = Router();

// Postagens de estudos
routes.post("/studyPosts", createStudyPost)

// Recebimento de e-mail
routes.post("/receiveEmail", receiveEmail)

// Projetos
routes.get("/projects", getProjects)
routes.post("/projects", createProject)
routes.put("/projects/:projectId", editProject)
routes.delete("/projects/:projectId", deleteProject)

export { routes }