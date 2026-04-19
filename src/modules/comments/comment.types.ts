export interface StudyComment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  postId: string;
  author: {
    id: string;
    name: string;
  };
  canDelete: boolean;
}

export interface AdminCommentFilters {
  postId?: string;
  search?: string;
}
