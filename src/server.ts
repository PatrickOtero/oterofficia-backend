import "reflect-metadata";
import "./shared/container/index";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { ensureAdminAccount } from "./core/boot/ensureAdminAccount";
import { errorHandler } from "./core/http/errorHandler";
import { router } from "./routes/index";

dotenv.config();

const server = express();
const port = Number(process.env.PORT || 3002);

server.use(express.json());
server.use(cors());
server.use(router);
server.use(errorHandler);

ensureAdminAccount()
  .catch((error) => {
    console.error("Falha ao garantir a conta administrativa inicial.", error);
  })
  .finally(() => {
    console.log(`Server connected on PORT ${port}`);
    server.listen(port);
  });
