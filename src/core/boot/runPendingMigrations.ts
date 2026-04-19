import { getDataSource } from "../../shared/infra/database/data-source";

export const runPendingMigrations = async () => {
  const dataSource = await getDataSource();
  const migrations = await dataSource.runMigrations();

  return migrations;
};
