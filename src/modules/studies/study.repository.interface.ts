import { AdminStudyFilters, StudyDashboardData, StudyDetail, StudyListFilters, StudyStatus, StudySummary, UpsertStudyInput } from "./study.types";

export type StudyPersistenceInput = {
  category: string;
  content: UpsertStudyInput["content"];
  coverImage: string | null;
  excerpt: string;
  id: string;
  publishedAt: Date | null;
  readingTime: number;
  seoDescription: string | null;
  seoTitle: string | null;
  slug: string;
  status: StudyStatus;
  tags: string[];
  title: string;
};

export type StudyReference = {
  id: string;
  slug: string;
  status: StudyStatus;
};

export interface IStudyRepository {
  countCommentsByPostId(postId: string): Promise<number>;
  countLikesByPostId(postId: string): Promise<number>;
  createStudy(input: StudyPersistenceInput): Promise<void>;
  deleteStudy(postId: string): Promise<number>;
  findById(postId: string): Promise<StudyReference | null>;
  findBySlug(slug: string): Promise<StudyReference | null>;
  getDashboardData(currentUserId?: string): Promise<StudyDashboardData>;
  getFilterOptions(): Promise<{ categories: string[]; tags: string[] }>;
  getPublishedStudyDetailBySlug(slug: string, currentUserId?: string): Promise<StudyDetail | null>;
  getStudyDetailById(postId: string, currentUserId?: string): Promise<StudyDetail | null>;
  isSlugTaken(slug: string, ignorePostId?: string): Promise<boolean>;
  listAdminStudies(filters: AdminStudyFilters, currentUserId?: string): Promise<StudySummary[]>;
  listPublishedStudies(filters: StudyListFilters, currentUserId?: string): Promise<StudySummary[]>;
  updateStudy(postId: string, input: Omit<StudyPersistenceInput, "id">): Promise<void>;
}
