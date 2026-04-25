import { randomUUID } from "crypto";
import { singleton } from "tsyringe";
import { getDataSource } from "../../shared/infra/database/data-source";
import { StudyCommentLikeEntity } from "../../shared/infra/database/entities/StudyCommentLikeEntity";
import { StudyPostCommentEntity } from "../../shared/infra/database/entities/StudyPostCommentEntity";
import { normalizeUploadUrl } from "../uploads/upload-url";
import { AdminComment, CommentPermissionRecord, CreateCommentInput, ICommentRepository } from "./comment.repository.interface";
import { AdminCommentFilters, StudyComment } from "./comment.types";

type CommentRow = {
  author_avatar_url: string | null;
  author_id: string;
  author_name: string;
  content: string;
  created_at: Date | string;
  id: string;
  liked_by_current_user: boolean;
  likes_count: number | string;
  parent_comment_id: string | null;
  post_id: string;
  updated_at: Date | string;
};

type AdminCommentRow = CommentRow & {
  post_title: string;
};

const toIso = (value: Date | string) => new Date(value).toISOString();

const mapCommentRow = (
  row: CommentRow,
  viewerUserId?: string,
  viewerRole?: "admin" | "user"
): StudyComment => ({
  author: {
    avatarUrl: normalizeUploadUrl(row.author_avatar_url),
    id: row.author_id,
    name: row.author_name,
  },
  canDelete: viewerRole === "admin" || viewerUserId === row.author_id,
  content: row.content,
  createdAt: toIso(row.created_at),
  id: row.id,
  likedByCurrentUser: Boolean(row.liked_by_current_user),
  likesCount: Number(row.likes_count || 0),
  parentCommentId: row.parent_comment_id,
  postId: row.post_id,
  replies: [],
  updatedAt: toIso(row.updated_at),
});

const buildCommentTree = (rows: CommentRow[], viewerUserId?: string, viewerRole?: "admin" | "user") => {
  const byId = new Map<string, StudyComment>();
  const roots: StudyComment[] = [];

  rows.forEach((row) => {
    byId.set(row.id, mapCommentRow(row, viewerUserId, viewerRole));
  });

  rows.forEach((row) => {
    const comment = byId.get(row.id);

    if (!comment) {
      return;
    }

    if (row.parent_comment_id && byId.has(row.parent_comment_id)) {
      byId.get(row.parent_comment_id)!.replies.push(comment);
      return;
    }

    roots.push(comment);
  });

  return roots;
};

const buildCommentQuery = (whereClause: string) => `
  select
    comments.id,
    comments.post_id,
    comments.parent_comment_id,
    comments.content,
    comments.created_at,
    comments.updated_at,
    users.id as author_id,
    users.name as author_name,
    users.avatar_url as author_avatar_url,
    coalesce(count(comment_likes.id), 0)::int as likes_count,
    coalesce(max(case when comment_likes.user_id = $2 then 1 else 0 end), 0)::int = 1 as liked_by_current_user
  from study_post_comments comments
  inner join users on users.id = comments.user_id
  left join study_comment_likes comment_likes on comment_likes.comment_id = comments.id
  ${whereClause}
  group by
    comments.id,
    comments.post_id,
    comments.parent_comment_id,
    comments.content,
    comments.created_at,
    comments.updated_at,
    users.id,
    users.name,
    users.avatar_url
  order by comments.created_at asc
`;

@singleton()
export class CommentRepository implements ICommentRepository {
  public async createComment(input: CreateCommentInput, viewerUserId?: string, viewerRole?: "admin" | "user") {
    const dataSource = await getDataSource();
    const id = randomUUID();
    const now = new Date();

    await dataSource.getRepository(StudyPostCommentEntity).save({
      content: input.content,
      createdAt: now,
      id,
      parentCommentId: input.parentCommentId ?? null,
      postId: input.postId,
      updatedAt: now,
      userId: input.userId,
    });

    return this.findCommentById(id, viewerUserId, viewerRole);
  }

  public async createLike(commentId: string, userId: string) {
    const dataSource = await getDataSource();

    await dataSource.getRepository(StudyCommentLikeEntity).save({
      commentId,
      createdAt: new Date(),
      id: randomUUID(),
      userId,
    });
  }

  public async deleteComment(commentId: string) {
    const dataSource = await getDataSource();
    await dataSource.getRepository(StudyPostCommentEntity).delete({ id: commentId });
  }

  public async deleteLike(commentId: string, userId: string) {
    const dataSource = await getDataSource();
    await dataSource.getRepository(StudyCommentLikeEntity).delete({ commentId, userId });
  }

  public async findCommentById(commentId: string, viewerUserId?: string, viewerRole?: "admin" | "user") {
    const dataSource = await getDataSource();
    const rows = await dataSource.query(buildCommentQuery("where comments.id = $1"), [commentId, viewerUserId ?? ""]);

    const row = rows[0] as CommentRow | undefined;
    return row ? mapCommentRow(row, viewerUserId, viewerRole) : null;
  }

  public async findCommentPermissionData(commentId: string) {
    const dataSource = await getDataSource();
    const comment = await dataSource.getRepository(StudyPostCommentEntity).findOne({
      where: { id: commentId },
    });

    if (!comment) {
      return null;
    }

    return {
      id: comment.id,
      parent_comment_id: comment.parentCommentId,
      post_id: comment.postId,
      user_id: comment.userId,
    } as CommentPermissionRecord;
  }

  public async findLike(commentId: string, userId: string) {
    const dataSource = await getDataSource();
    return dataSource.getRepository(StudyCommentLikeEntity).exist({
      where: {
        commentId,
        userId,
      },
    });
  }

  public async listAdminComments(filters: AdminCommentFilters) {
    const dataSource = await getDataSource();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.postId) {
      params.push(filters.postId);
      conditions.push(`comments.post_id = $${params.length}`);
    }

    if (filters.search) {
      params.push(`%${filters.search}%`);
      const searchParam = `$${params.length}`;
      conditions.push(
        `(comments.content ILIKE ${searchParam} OR users.name ILIKE ${searchParam} OR posts.title ILIKE ${searchParam})`
      );
    }

    params.push("");
    const viewerParam = `$${params.length}`;
    const whereClause = conditions.length ? `where ${conditions.join(" and ")}` : "";
    const rows = await dataSource.query(
      `
      select
        comments.id,
        comments.post_id,
        comments.parent_comment_id,
        comments.content,
        comments.created_at,
        comments.updated_at,
        users.id as author_id,
        users.name as author_name,
        users.avatar_url as author_avatar_url,
        posts.title as post_title,
        coalesce(count(comment_likes.id), 0)::int as likes_count,
        coalesce(max(case when comment_likes.user_id = ${viewerParam} then 1 else 0 end), 0)::int = 1 as liked_by_current_user
      from study_post_comments comments
      inner join users on users.id = comments.user_id
      inner join study_posts posts on posts.id = comments.post_id
      left join study_comment_likes comment_likes on comment_likes.comment_id = comments.id
      ${whereClause}
      group by
        comments.id,
        comments.post_id,
        comments.parent_comment_id,
        comments.content,
        comments.created_at,
        comments.updated_at,
        users.id,
        users.name,
        users.avatar_url,
        posts.title
      order by comments.created_at desc
      `,
      params
    );

    return rows.map((row: AdminCommentRow): AdminComment => ({
      ...mapCommentRow(row, undefined, "admin"),
      postTitle: row.post_title,
    }));
  }

  public async listCommentsByPostId(postId: string, viewerUserId?: string, viewerRole?: "admin" | "user") {
    const dataSource = await getDataSource();
    const rows = await dataSource.query(buildCommentQuery("where comments.post_id = $1"), [postId, viewerUserId ?? ""]);

    return buildCommentTree(rows as CommentRow[], viewerUserId, viewerRole);
  }
}
