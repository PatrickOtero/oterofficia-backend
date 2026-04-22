import "reflect-metadata";
import dotenv from "dotenv";
import { DataSource } from "typeorm";
import { AboutPageEntity } from "./entities/AboutPageEntity";
import { InteractionEventEntity } from "./entities/InteractionEventEntity";
import { NotificationEntity } from "./entities/NotificationEntity";
import { ProjectEntity } from "./entities/ProjectEntity";
import { SiteVisitEventEntity } from "./entities/SiteVisitEventEntity";
import { SiteVisitorEntity } from "./entities/SiteVisitorEntity";
import { StudyCommentLikeEntity } from "./entities/StudyCommentLikeEntity";
import { StudyPostBlockEntity } from "./entities/StudyPostBlockEntity";
import { StudyPostCommentEntity } from "./entities/StudyPostCommentEntity";
import { StudyPostEntity } from "./entities/StudyPostEntity";
import { StudyPostLikeEntity } from "./entities/StudyPostLikeEntity";
import { UserEntity } from "./entities/UserEntity";
import { UserActionTokenEntity } from "./entities/UserActionTokenEntity";
import { UserSessionEntity } from "./entities/UserSessionEntity";
import { InitAppSchema1713480000000 } from "./migrations/1713480000000-InitAppSchema";
import { CreateAboutPage1713660000000 } from "./migrations/1713660000000-CreateAboutPage";
import { ExpandProjectsPortfolio1713750000000 } from "./migrations/1713750000000-ExpandProjectsPortfolio";
import { ExtendUserAuthAndComments1713570000000 } from "./migrations/1713570000000-ExtendUserAuthAndComments";
import { CreateEngagementInfrastructure1713840000000 } from "./migrations/1713840000000-CreateEngagementInfrastructure";
import { CreateSiteVisitEvents1713860000000 } from "./migrations/1713860000000-CreateSiteVisitEvents";
import { CreateSiteVisitors1713850000000 } from "./migrations/1713850000000-CreateSiteVisitors";

dotenv.config();

const LOCAL_DATABASE_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "postgres",
  "db",
  "host.docker.internal",
]);

const shouldUseSsl = () => {
  const sslValue = process.env.DATABASE_SSL?.trim().toLowerCase();

  if (sslValue === "false") {
    return false;
  }

  if (sslValue === "true") {
    return true;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return false;
  }

  try {
    const parsedUrl = new URL(databaseUrl);
    const sslMode = parsedUrl.searchParams.get("sslmode")?.trim().toLowerCase();
    const sslParam = parsedUrl.searchParams.get("ssl")?.trim().toLowerCase();

    if (sslMode === "disable" || sslParam === "false") {
      return false;
    }

    if (
      sslMode === "require" ||
      sslMode === "verify-ca" ||
      sslMode === "verify-full" ||
      sslParam === "true"
    ) {
      return true;
    }

    return !LOCAL_DATABASE_HOSTS.has(parsedUrl.hostname.toLowerCase());
  } catch {
    return !databaseUrl.includes("localhost");
  }
};

const buildDataSource = () =>
  new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    ssl: shouldUseSsl() ? { rejectUnauthorized: false } : false,
    synchronize: false,
    logging: false,
    entities: [
      AboutPageEntity,
      InteractionEventEntity,
      NotificationEntity,
      ProjectEntity,
      SiteVisitEventEntity,
      SiteVisitorEntity,
      StudyPostEntity,
      StudyPostBlockEntity,
      StudyCommentLikeEntity,
      StudyPostLikeEntity,
      StudyPostCommentEntity,
      UserEntity,
      UserActionTokenEntity,
      UserSessionEntity,
    ],
    migrations: [
      InitAppSchema1713480000000,
      ExtendUserAuthAndComments1713570000000,
      CreateAboutPage1713660000000,
      ExpandProjectsPortfolio1713750000000,
      CreateEngagementInfrastructure1713840000000,
      CreateSiteVisitors1713850000000,
      CreateSiteVisitEvents1713860000000,
    ],
  });

class TypeOrmSingleton {
  private static dataSource: DataSource | null = null;

  static async getDataSource() {
    if (!TypeOrmSingleton.dataSource) {
      TypeOrmSingleton.dataSource = buildDataSource();
    }

    if (!TypeOrmSingleton.dataSource.isInitialized) {
      await TypeOrmSingleton.dataSource.initialize();
    }

    return TypeOrmSingleton.dataSource;
  }

  static getRawDataSource() {
    if (!TypeOrmSingleton.dataSource) {
      TypeOrmSingleton.dataSource = buildDataSource();
    }

    return TypeOrmSingleton.dataSource;
  }
}

export const getDataSource = () => TypeOrmSingleton.getDataSource();
export default TypeOrmSingleton.getRawDataSource();
