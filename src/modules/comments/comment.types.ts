export interface StudyCommentAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface StudyComment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  postId: string;
  parentCommentId: string | null;
  author: StudyCommentAuthor;
  canDelete: boolean;
  likesCount: number;
  likedByCurrentUser: boolean;
  replies: StudyComment[];
}

export interface CommentLikeResponse {
  commentId: string;
  likedByCurrentUser: boolean;
  likesCount: number;
}

export interface AdminCommentFilters {
  postId?: string;
  search?: string;
}