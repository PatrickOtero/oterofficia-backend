import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSiteVisitEvents1713860000000 implements MigrationInterface {
  name = "CreateSiteVisitEvents1713860000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS site_visit_events (
        id uuid PRIMARY KEY,
        visitor_key varchar NOT NULL,
        visited_at timestamptz NOT NULL DEFAULT now(),
        path varchar NULL,
        user_agent varchar NULL,
        referrer varchar NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_site_visit_events_visitor_key
      ON site_visit_events(visitor_key)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_site_visit_events_visited_at
      ON site_visit_events(visited_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_site_visit_events_visited_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_site_visit_events_visitor_key`);
    await queryRunner.query(`DROP TABLE IF EXISTS site_visit_events`);
  }
}
