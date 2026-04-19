import { AppError } from "../../core/errors/AppError";
import { inject, injectable } from "tsyringe";
import { TOKENS } from "../../shared/container/tokens";
import { AuthenticatedSessionUser } from "../auth/auth.types";
import { IStudyRepository } from "../studies/study.repository.interface";
import { ICommentRepository } from "./comment.repository.interface";
import { AdminCommentFilters } from "./comment.types";

@injectable()
export class CommentService {
  constructor(
    @inject(TOKENS.CommentRepository)
    private readonly comments: ICommentRepository,
    @inject(TOKENS.StudyRepository)
    private readonly studies: IStudyRepository
  ) {}

  public async createComment(postId: string, content: string, user: AuthenticatedSessionUser) {
    const post = await this.studies.findById(postId);

    if (!post || post.status !== "published") {
      throw new AppError("NÃ£o foi possÃ­vel comentar neste estudo.", 404, "study_not_found");
    }

    const createdComment = await this.comments.createComment({
      content,
      postId,
      userId: user.id,
    });

    if (!createdComment) {
      throw new AppError("NÃ£o foi possÃ­vel publicar o comentÃ¡rio.", 500, "comment_creation_failed");
    }

    const commentsCount = await this.studies.countCommentsByPostId(postId);

    return {
      comment: {
        author: {
          id: user.id,
          name: user.name,
        },
        canDelete: true,
        content: createdComment.content,
        createdAt: new Date(createdComment.created_at).toISOString(),
        id: createdComment.id,
        postId: createdComment.post_id,
        updatedAt: new Date(createdComment.updated_at).toISOString(),
      },
      commentsCount,
    };
  }

  public async deleteComment(commentId: string, user: AuthenticatedSessionUser) {
    const existingComment = await this.comments.findCommentPermissionData(commentId);

    if (!existingComment) {
      throw new AppError("ComentÃ¡rio nÃ£o encontrado.", 404, "comment_not_found");
    }

    const isOwner = existingComment.user_id === user.id;
    const isAdmin = user.role === "admin";

    if (!isOwner && !isAdmin) {
      throw new AppError("VocÃª nÃ£o pode remover este comentÃ¡rio.", 403, "comment_delete_forbidden");
    }

    await this.comments.deleteComment(commentId);

    const commentsCount = await this.studies.countCommentsByPostId(existingComment.post_id);

    return {
      commentsCount,
      postId: existingComment.post_id,
    };
  }

  public async listAdminComments(filters: AdminCommentFilters) {
    return this.comments.listAdminComments(filters);
  }

  public async listComments(postId: string, user?: AuthenticatedSessionUser) {
    const post = await this.studies.findById(postId);

    if (!post || post.status !== "published") {
      throw new AppError("Estudo nÃ£o encontrado.", 404, "study_not_found");
    }

    return this.comments.listCommentsByPostId(postId, user?.id, user?.role);
  }
}
