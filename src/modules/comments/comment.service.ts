import { inject, injectable } from "tsyringe";
import { AppError } from "../../core/errors/AppError";
import { TOKENS } from "../../shared/container/tokens";
import { AuthenticatedSessionUser } from "../auth/auth.types";
import { EngagementService } from "../engagement/engagement.service";
import { IStudyRepository } from "../studies/study.repository.interface";
import { AdminCommentFilters, CommentLikeResponse } from "./comment.types";
import { ICommentRepository } from "./comment.repository.interface";

@injectable()
export class CommentService {
  constructor(
    @inject(TOKENS.CommentRepository)
    private readonly comments: ICommentRepository,
    @inject(TOKENS.StudyRepository)
    private readonly studies: IStudyRepository,
    private readonly engagement: EngagementService
  ) {}

  public async createComment(
    postId: string,
    content: string,
    user: AuthenticatedSessionUser,
    parentCommentId?: string | null
  ) {
    const post = await this.studies.findById(postId);
    let parentCommentOwnerId: string | null = null;

    if (!post || post.status !== "published") {
      throw new AppError("Nao foi possivel comentar neste estudo.", 404, "study_not_found");
    }

    if (parentCommentId) {
      const parentComment = await this.comments.findCommentPermissionData(parentCommentId);

      if (!parentComment || parentComment.post_id !== postId) {
        throw new AppError(
          "Nao foi possivel responder a este comentario.",
          404,
          "parent_comment_not_found"
        );
      }

      parentCommentOwnerId = parentComment.user_id;
    }

    const createdComment = await this.comments.createComment(
      {
        content,
        parentCommentId: parentCommentId ?? null,
        postId,
        userId: user.id,
      },
      user.id,
      user.role
    );

    if (!createdComment) {
      throw new AppError("Nao foi possivel publicar o comentario.", 500, "comment_creation_failed");
    }

    const commentsCount = await this.studies.countCommentsByPostId(postId);

    await this.engagement.registerCommentCreated({
      actor: user,
      comment: createdComment,
      parentCommentOwnerId,
      study: post,
    });

    return {
      comment: createdComment,
      commentsCount,
    };
  }

  public async deleteComment(commentId: string, user: AuthenticatedSessionUser) {
    const existingComment = await this.comments.findCommentPermissionData(commentId);

    if (!existingComment) {
      throw new AppError("Comentario nao encontrado.", 404, "comment_not_found");
    }

    const isOwner = existingComment.user_id === user.id;
    const isAdmin = user.role === "admin";

    if (!isOwner && !isAdmin) {
      throw new AppError("Voce nao pode remover este comentario.", 403, "comment_delete_forbidden");
    }

    await this.comments.deleteComment(commentId);

    const commentsCount = await this.studies.countCommentsByPostId(existingComment.post_id);

    return {
      commentsCount,
      parentCommentId: existingComment.parent_comment_id,
      postId: existingComment.post_id,
    };
  }

  public async likeComment(
    commentId: string,
    user: AuthenticatedSessionUser
  ): Promise<CommentLikeResponse> {
    return this.setCommentLikeState(commentId, user, true);
  }

  public async unlikeComment(
    commentId: string,
    user: AuthenticatedSessionUser
  ): Promise<CommentLikeResponse> {
    return this.setCommentLikeState(commentId, user, false);
  }

  public async toggleLike(
    commentId: string,
    user: AuthenticatedSessionUser
  ): Promise<CommentLikeResponse> {
    const alreadyLiked = await this.comments.findLike(commentId, user.id);
    return this.setCommentLikeState(commentId, user, !alreadyLiked);
  }

  public async listAdminComments(filters: AdminCommentFilters) {
    return this.comments.listAdminComments(filters);
  }

  public async listComments(postId: string, user?: AuthenticatedSessionUser) {
    const post = await this.studies.findById(postId);

    if (!post || post.status !== "published") {
      throw new AppError("Estudo nao encontrado.", 404, "study_not_found");
    }

    return this.comments.listCommentsByPostId(postId, user?.id, user?.role);
  }

  private async setCommentLikeState(
    commentId: string,
    user: AuthenticatedSessionUser,
    shouldBeLiked: boolean
  ): Promise<CommentLikeResponse> {
    const existingComment = await this.comments.findCommentPermissionData(commentId);

    if (!existingComment) {
      throw new AppError("Comentario nao encontrado.", 404, "comment_not_found");
    }

    const alreadyLiked = await this.comments.findLike(commentId, user.id);

    if (shouldBeLiked && !alreadyLiked) {
      await this.comments.createLike(commentId, user.id);
      const post = await this.studies.findById(existingComment.post_id);

      if (post) {
        await this.engagement.registerCommentLike({
          actor: user,
          commentId,
          commentOwnerUserId: existingComment.user_id,
          study: post,
        });
      }
    }

    if (!shouldBeLiked && alreadyLiked) {
      await this.comments.deleteLike(commentId, user.id);
    }

    const updatedComment = await this.comments.findCommentById(commentId, user.id, user.role);

    if (!updatedComment) {
      throw new AppError(
        "Nao foi possivel atualizar a curtida do comentario.",
        500,
        "comment_like_update_failed"
      );
    }

    return {
      commentId: updatedComment.id,
      likedByCurrentUser: updatedComment.likedByCurrentUser,
      likesCount: updatedComment.likesCount,
    };
  }
}
