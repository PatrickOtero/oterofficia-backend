import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAboutPage1713660000000 implements MigrationInterface {
  name = "CreateAboutPage1713660000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS about_pages (
        id VARCHAR(36) PRIMARY KEY,
        seo_title VARCHAR(180) NULL,
        seo_description TEXT NULL,
        blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS about_pages`);
  }
}
