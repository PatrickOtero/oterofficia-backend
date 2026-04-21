import "reflect-metadata";
import "./shared/container/index";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { ensureAdminAccount } from "./core/boot/ensureAdminAccount";
import { runPendingMigrations } from "./core/boot/runPendingMigrations";
import { errorHandler } from "./core/http/errorHandler";
import { openApiDocument } from "./docs/openapi";
import { router } from "./routes/index";

dotenv.config();

const server = express();
const port = Number(process.env.PORT || 3002);
const shouldRunMigrations =
  process.env.RUN_MIGRATIONS?.trim().toLowerCase() !== "false";

server.use(express.json());
server.use(cors());
server.get("/docs/openapi.json", (_req, res) => {
  res.status(200).json(openApiDocument);
});
server.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument, {
  customSiteTitle: "Oterofficia API Docs",
  swaggerOptions: {
    docExpansion: "list",
    persistAuthorization: true,
  },
}));
server.use(router);
server.use(errorHandler);

const bootstrap = async () => {
  if (shouldRunMigrations) {
    await runPendingMigrations();
  }

  await ensureAdminAccount();

  console.log(`Server connected on PORT ${port}`);
  server.listen(port);
};

bootstrap().catch((error) => {
  console.error("Falha ao inicializar a API.", error);
  process.exit(1);
});
