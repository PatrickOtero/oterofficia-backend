import { randomUUID } from "crypto";
import { getDataSource } from "../../shared/infra/database/data-source";
import { StudyPostCommentEntity } from "../../shared/infra/database/entities/StudyPostCommentEntity";
import { injectable } from "tsyringe";
import { AdminComment, CreateCommentInput, ICommentRepository } from "./comment.repository.interface";
import { AdminCommentFilters, StudyComment } from "./comment.types";

type CommentRow = {
  author_id: string;
  author_name: string;
  content: string;
  created_at: Date | string;
  id: string;
  post_id: string;
  updated_at: Date | string;
};

type CommentPermissionRow = {
  id: string;
  post_id: string;
  user_id: string;
};

type AdminCommentRow = CommentRow & {
  post_title: string;
};

const toIso = (value: Date | string) => new Date(value).toISOString();

const mapComment = (row: CommentRow, viewerUserId?: string, viewerRole?: "admin" | "user"): StudyComment => ({
  author: {
    id: row.author_id,
    name: row.author_name,
  },
  canDelete: viewerRole === "admin" || viewerUserId === row.author_id,
  content: row.content,
  createdAt: toIso(row.created_at),
  id: row.id,
  postId: row.post_id,
  updatedAt: toIso(row.updated_at),
});

@injectable()
export class CommentRepository implements ICommentRepository {
  public async createComment(input: CreateCommentInput) {
    const dataSource = await getDataSource();
    const id = randomUUID();
    const now = new Date();

    await dataSource.getRepository(StudyPostCommentEntity).save({
      content: input.content,
      createdAt: now,
      id,
      postId: input.postId,
      updatedAt: now,
      userId: input.userId,
    });

    return this.findCommentById(id);
  }

  public async deleteComment(commentId: string) {
    const dataSource = await getDataSource();

    await dataSource.getRepository(StudyPostCommentEntity).delete({ id: commentId });
  }

  public async findCommentById(commentId: string) {
    const dataSource = await getDataSource();
    const rows = await dataSource.query(
      `
      select
        comments.content,
        comments.created_at,
        comments.id,
        comments.post_id,
        comments.updated_at,
        users.id as author_id,
        users.name as author_name
      from study_post_comments comments
      inner join users on users.id = comments.user_id
      where comments.id = $1
      limit 1
      `,
      [commentId]
    );

    return (rows[0] as CommentRow | undefined) ?? null;
  }

  public async findCommentPermissionData(commentId: string) {
    const dataSource = await getDataSource();
    const comment = await dataSource.getRepository(StudyPostCommentEntity).findOne({
      where: {
        id: commentId,
      },
    });

    if (!comment) {
      return null;
    }

    return {
      id: comment.id,
      post_id: comment.postId,
      user_id: comment.userId,
    } as CommentPermissionRow;
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

    const whereClause = conditions.length ? `where ${conditions.join(" and ")}` : "";
    const rows = await dataSource.query(
      `
      select
        comments.content,
        comments.created_at,
        comments.id,
        comments.post_id,
        comments.updated_at,
        users.id as author_id,
        users.name as author_name,
        posts.title as post_title
      from study_post_comments comments
      inner join users on users.id = comments.user_id
      inner join study_posts posts on posts.id = comments.post_id
      ${whereClause}
      order by comments.created_at desc
      `,
      params
    );

    return rows.map((row: AdminCommentRow): AdminComment => ({
      ...mapComment(row, undefined, "admin"),
      postTitle: row.post_title,
    }));
  }

  public async listCommentsByPostId(postId: string, viewerUserId?: string, viewerRole?: "admin" | "user") {
    const dataSource = await getDataSource();
    const rows = await dataSource.query(
      `
      select
        comments.content,
        comments.created_at,
        comments.id,
        comments.post_id,
        comments.updated_at,
        users.id as author_id,
        users.name as author_name
      from study_post_comments comments
      inner join users on users.id = comments.user_id
      where comments.post_id = $1
      order by comments.created_at asc
      `,
      [postId]
    );

    return rows.map((row: CommentRow) => mapComment(row, viewerUserId, viewerRole));
  }
}
