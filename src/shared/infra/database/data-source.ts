import "reflect-metadata";
import dotenv from "dotenv";
import { DataSource } from "typeorm";
import { ProjectEntity } from "./entities/ProjectEntity";
import { StudyCommentLikeEntity } from "./entities/StudyCommentLikeEntity";
import { StudyPostBlockEntity } from "./entities/StudyPostBlockEntity";
import { StudyPostCommentEntity } from "./entities/StudyPostCommentEntity";
import { StudyPostEntity } from "./entities/StudyPostEntity";
import { StudyPostLikeEntity } from "./entities/StudyPostLikeEntity";
import { UserEntity } from "./entities/UserEntity";
import { UserActionTokenEntity } from "./entities/UserActionTokenEntity";
import { UserSessionEntity } from "./entities/UserSessionEntity";
import { InitAppSchema1713480000000 } from "./migrations/1713480000000-InitAppSchema";
import { ExtendUserAuthAndComments1713570000000 } from "./migrations/1713570000000-ExtendUserAuthAndComments";

dotenv.config();

const shouldUseSsl = () => {
  const sslValue = process.env.DATABASE_SSL?.trim().toLowerCase();

  if (sslValue === "false") {
    return false;
  }

  if (sslValue === "true") {
    return true;
  }

  return !process.env.DATABASE_URL?.includes("localhost");
};

const buildDataSource = () =>
  new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    ssl: shouldUseSsl() ? { rejectUnauthorized: false } : false,
    synchronize: false,
    logging: false,
    entities: [
      ProjectEntity,
      StudyPostEntity,
      StudyPostBlockEntity,
      StudyCommentLikeEntity,
      StudyPostLikeEntity,
      StudyPostCommentEntity,
      UserEntity,
      UserActionTokenEntity,
      UserSessionEntity,
    ],
    migrations: [InitAppSchema1713480000000, ExtendUserAuthAndComments1713570000000],
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
