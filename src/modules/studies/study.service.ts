import { randomUUID } from "crypto";
import { inject, injectable } from "tsyringe";
import { AppError } from "../../core/errors/AppError";
import { TOKENS } from "../../shared/container/tokens";
import { slugify } from "../../core/utils/slug";
import { estimateReadingTime } from "./study.utils";
import { IStudyRepository } from "./study.repository.interface";
import { AdminStudyFilters, StudyListFilters, StudyStatus, UpsertStudyInput } from "./study.types";

const resolveUniqueSlug = async (
  repository: IStudyRepository,
  title: string,
  incomingSlug?: string,
  ignorePostId?: string
) => {
  const baseSlug = slugify(incomingSlug || title);

  if (!baseSlug) {
    throw new AppError("NÃ£o foi possÃ­vel gerar um slug vÃ¡lido para esta postagem.", 400, "invalid_slug");
  }

  let candidate = baseSlug;
  let suffix = 2;

  while (await repository.isSlugTaken(candidate, ignorePostId)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

const resolvePublishedAt = (status: StudyStatus, previousPublishedAt?: string | null) => {
  if (status === "draft") {
    return null;
  }

  if (previousPublishedAt) {
    return new Date(previousPublishedAt);
  }

  return new Date();
};

const resolveReadingTime = (input: UpsertStudyInput) =>
  input.readingTime ??
  estimateReadingTime({
    content: input.content,
    excerpt: input.excerpt,
    title: input.title,
  });

@injectable()
export class StudyService {
  constructor(
    @inject(TOKENS.StudyRepository)
    private readonly repository: IStudyRepository
  ) {}

  public async createStudy(input: UpsertStudyInput) {
    const studyId = randomUUID();
    const slug = await resolveUniqueSlug(this.repository, input.title, input.slug);

    await this.repository.createStudy({
      category: input.category,
      content: input.content,
      coverImage: input.coverImage,
      excerpt: input.excerpt,
      id: studyId,
      publishedAt: resolvePublishedAt(input.status),
      readingTime: resolveReadingTime(input),
      seoDescription: input.seoDescription,
      seoTitle: input.seoTitle,
      slug,
      status: input.status,
      tags: input.tags,
      title: input.title,
    });

    return this.repository.getStudyDetailById(studyId);
  }

  public async deleteStudy(postId: string) {
    const deletedRows = await this.repository.deleteStudy(postId);

    if (!deletedRows) {
      throw new AppError("Estudo nÃ£o encontrado.", 404, "study_not_found");
    }
  }

  public async getAdminDashboard(currentUserId?: string) {
    return this.repository.getDashboardData(currentUserId);
  }

  public async getAdminStudy(postId: string, currentUserId?: string) {
    const study = await this.repository.getStudyDetailById(postId, currentUserId);

    if (!study) {
      throw new AppError("Estudo nÃ£o encontrado.", 404, "study_not_found");
    }

    return study;
  }

  public async getPublicStudy(slug: string, currentUserId?: string) {
    const study = await this.repository.getPublishedStudyDetailBySlug(slug, currentUserId);

    if (!study) {
      throw new AppError("Estudo nÃ£o encontrado.", 404, "study_not_found");
    }

    return study;
  }

  public async listAdminStudies(filters: AdminStudyFilters, currentUserId?: string) {
    return this.repository.listAdminStudies(filters, currentUserId);
  }

  public async listPublishedStudies(filters: StudyListFilters, currentUserId?: string) {
    const [filterOptions, posts] = await Promise.all([
      this.repository.getFilterOptions(),
      this.repository.listPublishedStudies(filters, currentUserId),
    ]);

    return {
      filters: filterOptions,
      posts,
    };
  }

  public async setStudyStatus(postId: string, status: StudyStatus, currentUserId?: string) {
    const existingStudy = await this.repository.getStudyDetailById(postId, currentUserId);

    if (!existingStudy) {
      throw new AppError("Estudo nÃ£o encontrado.", 404, "study_not_found");
    }

    await this.repository.updateStudy(postId, {
      category: existingStudy.category,
      content: existingStudy.content.map((block) => ({ data: block.data, type: block.type })),
      coverImage: existingStudy.coverImage,
      excerpt: existingStudy.excerpt,
      publishedAt: resolvePublishedAt(status, existingStudy.publishedAt),
      readingTime: existingStudy.readingTime,
      seoDescription: existingStudy.seoDescription,
      seoTitle: existingStudy.seoTitle,
      slug: existingStudy.slug,
      status,
      tags: existingStudy.tags,
      title: existingStudy.title,
    });

    return this.getAdminStudy(postId, currentUserId);
  }

  public async updateStudy(postId: string, input: UpsertStudyInput, currentUserId?: string) {
    const existingStudy = await this.repository.getStudyDetailById(postId, currentUserId);

    if (!existingStudy) {
      throw new AppError("Estudo nÃ£o encontrado.", 404, "study_not_found");
    }

    const slug = await resolveUniqueSlug(this.repository, input.title, input.slug, postId);

    await this.repository.updateStudy(postId, {
      category: input.category,
      content: input.content,
      coverImage: input.coverImage,
      excerpt: input.excerpt,
      publishedAt: resolvePublishedAt(input.status, existingStudy.publishedAt),
      readingTime: resolveReadingTime(input),
      seoDescription: input.seoDescription,
      seoTitle: input.seoTitle,
      slug,
      status: input.status,
      tags: input.tags,
      title: input.title,
    });

    return this.getAdminStudy(postId, currentUserId);
  }
}
