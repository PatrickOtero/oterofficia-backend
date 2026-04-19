export type StudyStatus = "draft" | "published";

export type StudyBlockType =
  | "callout"
  | "code"
  | "divider"
  | "heading"
  | "image"
  | "list"
  | "paragraph"
  | "quote"
  | "references";

export interface StudyBlock {
  id: string;
  type: StudyBlockType;
  position: number;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface StudySummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  status: StudyStatus;
  category: string;
  tags: string[];
  readingTime: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  likesCount: number;
  commentsCount: number;
  likedByCurrentUser: boolean;
}

export interface StudyDetail extends StudySummary {
  content: StudyBlock[];
}

export interface StudyListFilters {
  search?: string;
  category?: string;
  tag?: string;
}

export interface AdminStudyFilters extends StudyListFilters {
  status?: "all" | StudyStatus;
}

export interface StudyInputBlock {
  type: StudyBlockType;
  data: Record<string, unknown>;
}

export interface UpsertStudyInput {
  title: string;
  slug?: string;
  excerpt: string;
  coverImage: string | null;
  status: StudyStatus;
  category: string;
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  readingTime?: number;
  content: StudyInputBlock[];
}

export interface StudyDashboardMetric {
  totalPosts: number;
  totalPublishedPosts: number;
  totalDraftPosts: number;
  totalLikes: number;
  totalComments: number;
}

export interface StudyDashboardComment {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
  postId: string;
  postTitle: string;
}

export interface StudyDashboardData {
  metrics: StudyDashboardMetric;
  recentComments: StudyDashboardComment[];
  recentPosts: StudySummary[];
}
