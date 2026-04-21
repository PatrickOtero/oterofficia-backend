import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEngagementInfrastructure1713840000000 implements MigrationInterface {
  name = "CreateEngagementInfrastructure1713840000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY,
        recipient_user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        actor_user_id VARCHAR(36) NULL REFERENCES users(id) ON DELETE SET NULL,
        kind VARCHAR(48) NOT NULL,
        title VARCHAR(180) NOT NULL,
        body TEXT NOT NULL,
        target_path TEXT NULL,
        metadata JSONB NULL,
        read_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created_at
      ON notifications(recipient_user_id, created_at DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_unread
      ON notifications(recipient_user_id, read_at)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_actor_user_id
      ON notifications(actor_user_id)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS interaction_events (
        id VARCHAR(36) PRIMARY KEY,
        actor_user_id VARCHAR(36) NULL REFERENCES users(id) ON DELETE SET NULL,
        study_post_id VARCHAR(36) NULL REFERENCES study_posts(id) ON DELETE SET NULL,
        comment_id VARCHAR(36) NULL REFERENCES study_post_comments(id) ON DELETE SET NULL,
        kind VARCHAR(48) NOT NULL,
        metadata JSONB NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_interaction_events_actor_kind_created_at
      ON interaction_events(actor_user_id, kind, created_at DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_interaction_events_study_post_id
      ON interaction_events(study_post_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_interaction_events_comment_id
      ON interaction_events(comment_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_interaction_events_kind_created_at
      ON interaction_events(kind, created_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_interaction_events_kind_created_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_interaction_events_comment_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_interaction_events_study_post_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_interaction_events_actor_kind_created_at`);
    await queryRunner.query(`DROP TABLE IF EXISTS interaction_events`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notifications_actor_user_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notifications_unread`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notifications_recipient_created_at`);
    await queryRunner.query(`DROP TABLE IF EXISTS notifications`);
  }
}
