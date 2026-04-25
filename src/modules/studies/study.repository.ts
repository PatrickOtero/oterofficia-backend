import { randomUUID } from "crypto";
import { getDataSource } from "../../shared/infra/database/data-source";
import { StudyPostBlockEntity } from "../../shared/infra/database/entities/StudyPostBlockEntity";
import { StudyPostEntity } from "../../shared/infra/database/entities/StudyPostEntity";
import { singleton } from "tsyringe";
import { normalizeUploadPayload, normalizeUploadUrl } from "../uploads/upload-url";
import {
  AdminStudyFilters,
  StudyBlock,
  StudyDashboardComment,
  StudyDetail,
  StudyInputBlock,
  StudyListFilters,
  StudyStatus,
  StudySummary,
} from "./study.types";
import { IStudyRepository, StudyPersistenceInput } from "./study.repository.interface";

type StudyPostRow = {
  category: string;
  comments_count?: number | string;
  cover_image: string | null;
  created_at: Date | string;
  excerpt: string;
  id: string;
  liked_by_current_user?: boolean | string | number;
  likes_count?: number | string;
  published_at: Date | string | null;
  reading_time: number | string;
  seo_description: string | null;
  seo_title: string | null;
  slug: string;
  status: StudyStatus;
  tags: unknown;
  title: string;
  updated_at: Date | string;
};

type StudyBlockRow = {
  created_at: Date | string;
  data: unknown;
  id: string;
  position: number;
  type: StudyBlock["type"];
  updated_at: Date | string;
};

type StudyDashboardMetricsRow = {
  total_comments: number | string;
  total_draft_posts: number | string;
  total_likes: number | string;
  total_posts: number | string;
  total_published_posts: number | string;
};

type StudyCommentRow = {
  author_name: string;
  content: string;
  created_at: Date | string;
  id: string;
  post_id: string;
  post_title: string;
};

const toIso = (value: Date | string | null) => (value ? new Date(value).toISOString() : null);
const toNumber = (value: number | string | undefined) => Number(value ?? 0);
const toBoolean = (value: boolean | number | string | undefined) =>
  value === true || value === 1 || value === "1" || value === "true" || value === "t";

const toTags = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const mapStudySummary = (row: StudyPostRow): StudySummary => ({
  category: row.category,
  commentsCount: toNumber(row.comments_count),
  coverImage: normalizeUploadUrl(row.cover_image),
  createdAt: toIso(row.created_at) as string,
  excerpt: row.excerpt,
  id: row.id,
  likedByCurrentUser: toBoolean(row.liked_by_current_user),
  likesCount: toNumber(row.likes_count),
  publishedAt: toIso(row.published_at),
  readingTime: toNumber(row.reading_time),
  seoDescription: row.seo_description,
  seoTitle: row.seo_title,
  slug: row.slug,
  status: row.status,
  tags: toTags(row.tags),
  title: row.title,
  updatedAt: toIso(row.updated_at) as string,
});

const mapStudyBlock = (row: StudyBlockRow): StudyBlock => ({
  createdAt: toIso(row.created_at) as string,
  data:
    row.data && typeof row.data === "object" && !Array.isArray(row.data)
      ? normalizeUploadPayload(row.data as Record<string, unknown>)
      : {},
  id: row.id,
  position: row.position,
  type: row.type,
  updatedAt: toIso(row.updated_at) as string,
});

const buildSummarySelect = (currentUserId?: string) => {
  const params: unknown[] = [];
  const likedByCurrentUserSql = currentUserId
    ? `exists (
        select 1
        from study_post_likes likes
        where likes.post_id = posts.id and likes.user_id = $1
      ) as liked_by_current_user`
    : `false as liked_by_current_user`;

  if (currentUserId) {
    params.push(currentUserId);
  }

  return {
    params,
    sql: `
      select
        posts.id,
        posts.title,
        posts.slug,
        posts.excerpt,
        posts.cover_image,
        posts.status,
        posts.category,
        posts.tags,
        posts.reading_time,
        posts.created_at,
        posts.updated_at,
        posts.published_at,
        posts.seo_title,
        posts.seo_description,
        (select count(*) from study_post_likes likes where likes.post_id = posts.id) as likes_count,
        (select count(*) from study_post_comments comments where comments.post_id = posts.id) as comments_count,
        ${likedByCurrentUserSql}
      from study_posts posts
    `,
  };
};

const applyStudyFilters = (
  filters: StudyListFilters,
  params: unknown[],
  conditions: string[]
) => {
  if (filters.search) {
    params.push(`%${filters.search}%`);
    const searchParam = `$${params.length}`;
    conditions.push(
      `(posts.title ILIKE ${searchParam} OR posts.slug ILIKE ${searchParam} OR posts.excerpt ILIKE ${searchParam})`
    );
  }

  if (filters.category) {
    params.push(filters.category);
    conditions.push(`posts.category = $${params.length}`);
  }

  if (filters.tag) {
    params.push(filters.tag);
    conditions.push(
      `exists (select 1 from jsonb_array_elements_text(posts.tags) as tag where tag = $${params.length})`
    );
  }
};

const buildBlocksInsert = (postId: string, blocks: StudyInputBlock[]) => {
  const now = new Date();

  return blocks.map((block, index) => ({
    createdAt: now,
    data: block.data,
    id: randomUUID(),
    position: index,
    postId,
    type: block.type,
    updatedAt: now,
  }));
};

@singleton()
export class StudyRepository implements IStudyRepository {
  public async countCommentsByPostId(postId: string) {
    const dataSource = await getDataSource();
    const result = await dataSource.query(
      `select count(*)::int as count from study_post_comments where post_id = $1`,
      [postId]
    );

    return Number(result[0]?.count ?? 0);
  }

  public async countLikesByPostId(postId: string) {
    const dataSource = await getDataSource();
    const result = await dataSource.query(
      `select count(*)::int as count from study_post_likes where post_id = $1`,
      [postId]
    );

    return Number(result[0]?.count ?? 0);
  }

  public async createStudy(input: StudyPersistenceInput) {
    const dataSource = await getDataSource();

    await dataSource.transaction(async (manager) => {
      await manager.getRepository(StudyPostEntity).save({
        category: input.category,
        coverImage: input.coverImage,
        createdAt: new Date(),
        excerpt: input.excerpt,
        id: input.id,
        publishedAt: input.publishedAt,
        readingTime: input.readingTime,
        seoDescription: input.seoDescription,
        seoTitle: input.seoTitle,
        slug: input.slug,
        status: input.status,
        tags: input.tags,
        title: input.title,
        updatedAt: new Date(),
      });

      await manager.getRepository(StudyPostBlockEntity).save(buildBlocksInsert(input.id, input.content));
    });
  }

  public async deleteStudy(postId: string) {
    const dataSource = await getDataSource();
    const result = await dataSource.getRepository(StudyPostEntity).delete({ id: postId });

    return result.affected ?? 0;
  }

  public async findById(postId: string) {
    const dataSource = await getDataSource();

    return dataSource.getRepository(StudyPostEntity).findOne({
      where: {
        id: postId,
      },
    });
  }

  public async findBySlug(slug: string) {
    const dataSource = await getDataSource();

    return dataSource.getRepository(StudyPostEntity).findOne({
      where: {
        slug,
      },
    });
  }

  public async getDashboardData(currentUserId?: string) {
    const dataSource = await getDataSource();
    const metricsRows = await dataSource.query(`
      select
        (select count(*) from study_posts)::int as total_posts,
        (select count(*) from study_posts where status = 'published')::int as total_published_posts,
        (select count(*) from study_posts where status = 'draft')::int as total_draft_posts,
        (select count(*) from study_post_likes)::int as total_likes,
        (select count(*) from study_post_comments)::int as total_comments
    `);

    const metricsRow = metricsRows[0] as StudyDashboardMetricsRow | undefined;
    const recentPostsRows = await dataSource.query(
      `${buildSummarySelect(currentUserId).sql}
       order by posts.updated_at desc
       limit 5`,
      buildSummarySelect(currentUserId).params
    );

    const recentCommentsRows = await dataSource.query(`
      select
        comments.id,
        comments.content,
        comments.created_at,
        posts.id as post_id,
        posts.title as post_title,
        users.name as author_name
      from study_post_comments comments
      inner join users on users.id = comments.user_id
      inner join study_posts posts on posts.id = comments.post_id
      order by comments.created_at desc
      limit 6
    `);

    return {
      metrics: {
        totalComments: toNumber(metricsRow?.total_comments),
        totalDraftPosts: toNumber(metricsRow?.total_draft_posts),
        totalLikes: toNumber(metricsRow?.total_likes),
        totalPosts: toNumber(metricsRow?.total_posts),
        totalPublishedPosts: toNumber(metricsRow?.total_published_posts),
      },
      recentComments: recentCommentsRows.map(
        (row: StudyCommentRow): StudyDashboardComment => ({
          authorName: row.author_name,
          content: row.content,
          createdAt: toIso(row.created_at) as string,
          id: row.id,
          postId: row.post_id,
          postTitle: row.post_title,
        })
      ),
      recentPosts: recentPostsRows.map((row: StudyPostRow) => mapStudySummary(row)),
    };
  }

  public async getFilterOptions() {
    const dataSource = await getDataSource();
    const categoriesRows = await dataSource.query(`
      select distinct category
      from study_posts
      where status = 'published'
      order by category asc
    `);

    const tagsRows = await dataSource.query(`
      select distinct jsonb_array_elements_text(tags) as tag
      from study_posts
      where status = 'published'
      order by tag asc
    `);

    return {
      categories: categoriesRows.map((row: { category: string }) => row.category),
      tags: tagsRows.map((row: { tag: string }) => row.tag),
    };
  }

  public async getPublishedStudyDetailBySlug(slug: string, currentUserId?: string): Promise<StudyDetail | null> {
    const dataSource = await getDataSource();
    const summarySelect = buildSummarySelect(currentUserId);
    const params = [...summarySelect.params];
    params.push(slug);

    const rows = await dataSource.query(
      `${summarySelect.sql}
       where posts.slug = $${params.length} and posts.status = 'published'
       limit 1`,
      params
    );

    const row = rows[0] as StudyPostRow | undefined;

    if (!row) {
      return null;
    }

    const blocks = await dataSource.getRepository(StudyPostBlockEntity).find({
      order: {
        position: "ASC",
      },
      where: {
        postId: row.id,
      },
    });

    return {
      ...mapStudySummary(row),
      content: blocks.map((block) =>
        mapStudyBlock({
          created_at: block.createdAt,
          data: block.data,
          id: block.id,
          position: block.position,
          type: block.type as StudyBlock["type"],
          updated_at: block.updatedAt,
        })
      ),
    };
  }

  public async getStudyDetailById(postId: string, currentUserId?: string): Promise<StudyDetail | null> {
    const dataSource = await getDataSource();
    const summarySelect = buildSummarySelect(currentUserId);
    const params = [...summarySelect.params, postId];

    const rows = await dataSource.query(
      `${summarySelect.sql}
       where posts.id = $${params.length}
       limit 1`,
      params
    );

    const row = rows[0] as StudyPostRow | undefined;

    if (!row) {
      return null;
    }

    const blocks = await dataSource.getRepository(StudyPostBlockEntity).find({
      order: {
        position: "ASC",
      },
      where: {
        postId: row.id,
      },
    });

    return {
      ...mapStudySummary(row),
      content: blocks.map((block) =>
        mapStudyBlock({
          created_at: block.createdAt,
          data: block.data,
          id: block.id,
          position: block.position,
          type: block.type as StudyBlock["type"],
          updated_at: block.updatedAt,
        })
      ),
    };
  }

  public async isSlugTaken(slug: string, ignorePostId?: string) {
    const dataSource = await getDataSource();
    const queryBuilder = dataSource
      .getRepository(StudyPostEntity)
      .createQueryBuilder("post")
      .where("post.slug = :slug", { slug });

    if (ignorePostId) {
      queryBuilder.andWhere("post.id != :ignorePostId", { ignorePostId });
    }

    const count = await queryBuilder.getCount();

    return count > 0;
  }

  public async listAdminStudies(filters: AdminStudyFilters, currentUserId?: string) {
    const dataSource = await getDataSource();
    const summarySelect = buildSummarySelect(currentUserId);
    const params = [...summarySelect.params];
    const conditions: string[] = [];

    applyStudyFilters(filters, params, conditions);

    if (filters.status && filters.status !== "all") {
      params.push(filters.status);
      conditions.push(`posts.status = $${params.length}`);
    }

    const whereClause = conditions.length ? `where ${conditions.join(" and ")}` : "";
    const rows = await dataSource.query(
      `${summarySelect.sql}
       ${whereClause}
       order by posts.updated_at desc, posts.created_at desc`,
      params
    );

    return rows.map((row: StudyPostRow) => mapStudySummary(row));
  }

  public async listPublishedStudies(filters: StudyListFilters, currentUserId?: string) {
    const dataSource = await getDataSource();
    const summarySelect = buildSummarySelect(currentUserId);
    const params = [...summarySelect.params];
    const conditions: string[] = [`posts.status = 'published'`];

    applyStudyFilters(filters, params, conditions);

    const rows = await dataSource.query(
      `${summarySelect.sql}
       where ${conditions.join(" and ")}
       order by posts.published_at desc nulls last, posts.created_at desc`,
      params
    );

    return rows.map((row: StudyPostRow) => mapStudySummary(row));
  }

  public async updateStudy(postId: string, input: Omit<StudyPersistenceInput, "id">) {
    const dataSource = await getDataSource();

    await dataSource.transaction(async (manager) => {
      await manager.getRepository(StudyPostEntity).update(
        { id: postId },
        {
          category: input.category,
          coverImage: input.coverImage,
          excerpt: input.excerpt,
          publishedAt: input.publishedAt,
          readingTime: input.readingTime,
          seoDescription: input.seoDescription,
          seoTitle: input.seoTitle,
          slug: input.slug,
          status: input.status,
          tags: input.tags,
          title: input.title,
          updatedAt: new Date(),
        }
      );

      await manager.getRepository(StudyPostBlockEntity).delete({ postId });
      await manager.getRepository(StudyPostBlockEntity).save(buildBlocksInsert(postId, input.content));
    });
  }
}
