import { AdminCommentFilters, StudyComment } from "./comment.types";

export type CreateCommentInput = {
  content: string;
  postId: string;
  userId: string;
};

export type CreatedCommentRecord = {
  author_id: string;
  author_name: string;
  content: string;
  created_at: Date | string;
  id: string;
  post_id: string;
  updated_at: Date | string;
};

export type CommentPermissionRecord = {
  id: string;
  post_id: string;
  user_id: string;
};

export type AdminComment = StudyComment & {
  postTitle: string;
};

export interface ICommentRepository {
  createComment(input: CreateCommentInput): Promise<CreatedCommentRecord | null>;
  deleteComment(commentId: string): Promise<void>;
  findCommentById(commentId: string): Promise<CreatedCommentRecord | null>;
  findCommentPermissionData(commentId: string): Promise<CommentPermissionRecord | null>;
  listAdminComments(filters: AdminCommentFilters): Promise<AdminComment[]>;
  listCommentsByPostId(postId: string, viewerUserId?: string, viewerRole?: "admin" | "user"): Promise<StudyComment[]>;
}
