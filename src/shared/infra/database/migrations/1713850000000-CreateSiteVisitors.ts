import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSiteVisitors1713850000000 implements MigrationInterface {
  name = "CreateSiteVisitors1713850000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS site_visitors (
        id uuid PRIMARY KEY,
        visitor_key varchar NOT NULL,
        first_seen_at timestamptz NOT NULL DEFAULT now(),
        last_seen_at timestamptz NOT NULL DEFAULT now(),
        entry_count integer NOT NULL DEFAULT 1,
        last_path varchar NULL,
        user_agent varchar NULL,
        referrer varchar NULL
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_site_visitors_visitor_key_unique
      ON site_visitors(visitor_key)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_site_visitors_last_seen_at
      ON site_visitors(last_seen_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_site_visitors_last_seen_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_site_visitors_visitor_key_unique`);
    await queryRunner.query(`DROP TABLE IF EXISTS site_visitors`);
  }
}
