import { MigrationInterface, QueryRunner } from "typeorm";

export class ExpandProjectsPortfolio1713750000000 implements MigrationInterface {
  name = "ExpandProjectsPortfolio1713750000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS project_status VARCHAR(20) NOT NULL DEFAULT 'completed',
      ADD COLUMN IF NOT EXISTS project_track VARCHAR(20) NOT NULL DEFAULT 'personal',
      ADD COLUMN IF NOT EXISTS organization_name VARCHAR(120) NULL,
      ADD COLUMN IF NOT EXISTS project_role VARCHAR(140) NULL,
      ADD COLUMN IF NOT EXISTS project_highlight VARCHAR(220) NULL,
      ADD COLUMN IF NOT EXISTS project_tags JSONB NOT NULL DEFAULT '[]'::jsonb
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_project_status ON projects(project_status)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_project_track ON projects(project_track)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_projects_project_track`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_projects_project_status`);
    await queryRunner.query(`
      ALTER TABLE projects
      DROP COLUMN IF EXISTS project_tags,
      DROP COLUMN IF EXISTS project_highlight,
      DROP COLUMN IF EXISTS project_role,
      DROP COLUMN IF EXISTS organization_name,
      DROP COLUMN IF EXISTS project_track,
      DROP COLUMN IF EXISTS project_status
    `);
  }
}
