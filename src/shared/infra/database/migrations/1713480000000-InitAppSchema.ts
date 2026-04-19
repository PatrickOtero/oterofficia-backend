import { MigrationInterface, QueryRunner } from "typeorm";

export class InitAppSchema1713480000000 implements MigrationInterface {
  name = "InitAppSchema1713480000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        image_url TEXT NOT NULL,
        project_name VARCHAR(255) NOT NULL,
        project_desc TEXT NOT NULL,
        frontend_url TEXT NULL,
        backend_url TEXT NULL,
        video_url TEXT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(160) NOT NULL,
        email VARCHAR(190) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS study_posts (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(180) NOT NULL,
        slug VARCHAR(190) NOT NULL UNIQUE,
        excerpt TEXT NOT NULL,
        cover_image TEXT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        category VARCHAR(120) NOT NULL,
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        reading_time INT NOT NULL DEFAULT 1,
        seo_title VARCHAR(180) NULL,
        seo_description TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        published_at TIMESTAMPTZ NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_study_posts_status ON study_posts(status)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_study_posts_category ON study_posts(category)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_study_posts_published_at ON study_posts(published_at)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS study_post_blocks (
        id VARCHAR(36) PRIMARY KEY,
        post_id VARCHAR(36) NOT NULL REFERENCES study_posts(id) ON DELETE CASCADE,
        type VARCHAR(30) NOT NULL,
        position INT NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_study_post_blocks_post_position
      ON study_post_blocks(post_id, position)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_study_post_blocks_post_id ON study_post_blocks(post_id)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS study_post_likes (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id VARCHAR(36) NOT NULL REFERENCES study_posts(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_study_post_likes_user_post
      ON study_post_likes(user_id, post_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_study_post_likes_post_id ON study_post_likes(post_id)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS study_post_comments (
        id VARCHAR(36) PRIMARY KEY,
        content TEXT NOT NULL,
        user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id VARCHAR(36) NOT NULL REFERENCES study_posts(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_study_post_comments_post_id ON study_post_comments(post_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_study_post_comments_user_id ON study_post_comments(user_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS study_post_comments`);
    await queryRunner.query(`DROP TABLE IF EXISTS study_post_likes`);
    await queryRunner.query(`DROP TABLE IF EXISTS study_post_blocks`);
    await queryRunner.query(`DROP TABLE IF EXISTS study_posts`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_sessions`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
    await queryRunner.query(`DROP TABLE IF EXISTS projects`);
  }
}
