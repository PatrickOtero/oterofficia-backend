import { AdminCommentFilters, StudyComment } from "./comment.types";

export type CreateCommentInput = {
  content: string;
  postId: string;
  userId: string;
  parentCommentId?: string | null;
};

export type CommentPermissionRecord = {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
};

export type AdminComment = StudyComment & {
  postTitle: string;
};

export interface ICommentRepository {
  createComment(input: CreateCommentInput, viewerUserId?: string, viewerRole?: "admin" | "user"): Promise<StudyComment | null>;
  createLike(commentId: string, userId: string): Promise<void>;
  deleteComment(commentId: string): Promise<void>;
  deleteLike(commentId: string, userId: string): Promise<void>;
  findCommentById(commentId: string, viewerUserId?: string, viewerRole?: "admin" | "user"): Promise<StudyComment | null>;
  findCommentPermissionData(commentId: string): Promise<CommentPermissionRecord | null>;
  findLike(commentId: string, userId: string): Promise<boolean>;
  listAdminComments(filters: AdminCommentFilters): Promise<AdminComment[]>;
  listCommentsByPostId(postId: string, viewerUserId?: string, viewerRole?: "admin" | "user"): Promise<StudyComment[]>;
}
