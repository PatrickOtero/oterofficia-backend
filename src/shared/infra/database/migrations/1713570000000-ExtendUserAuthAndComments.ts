import { MigrationInterface, QueryRunner } from "typeorm";

export class ExtendUserAuthAndComments1713570000000 implements MigrationInterface {
  name = "ExtendUserAuthAndComments1713570000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS avatar_url TEXT NULL,
      ADD COLUMN IF NOT EXISTS birth_date DATE NULL,
      ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ NULL
    `);

    await queryRunner.query(`
      UPDATE users
      SET email_verified_at = COALESCE(email_verified_at, created_at)
      WHERE role = 'admin'
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_action_tokens (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(40) NOT NULL,
        token_hash VARCHAR(64) NOT NULL UNIQUE,
        payload JSONB NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        consumed_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_action_tokens_user_id ON user_action_tokens(user_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_action_tokens_type ON user_action_tokens(type)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_action_tokens_expires_at ON user_action_tokens(expires_at)
    `);

    await queryRunner.query(`
      ALTER TABLE study_post_comments
      ADD COLUMN IF NOT EXISTS parent_comment_id VARCHAR(36) NULL
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'fk_study_post_comments_parent_comment'
        ) THEN
          ALTER TABLE study_post_comments
          ADD CONSTRAINT fk_study_post_comments_parent_comment
          FOREIGN KEY (parent_comment_id)
          REFERENCES study_post_comments(id)
          ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_study_post_comments_parent_comment_id
      ON study_post_comments(parent_comment_id)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS study_comment_likes (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        comment_id VARCHAR(36) NOT NULL REFERENCES study_post_comments(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_study_comment_likes_user_comment
      ON study_comment_likes(user_id, comment_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_study_comment_likes_comment_id
      ON study_comment_likes(comment_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS study_comment_likes`);
    await queryRunner.query(`
      ALTER TABLE study_post_comments
      DROP CONSTRAINT IF EXISTS fk_study_post_comments_parent_comment
    `);
    await queryRunner.query(`
      ALTER TABLE study_post_comments
      DROP COLUMN IF EXISTS parent_comment_id
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS user_action_tokens`);
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS avatar_url,
      DROP COLUMN IF EXISTS birth_date,
      DROP COLUMN IF EXISTS email_verified_at
    `);
  }
}
