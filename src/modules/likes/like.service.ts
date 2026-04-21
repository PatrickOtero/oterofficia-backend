import { inject, injectable } from "tsyringe";
import { AppError } from "../../core/errors/AppError";
import { TOKENS } from "../../shared/container/tokens";
import { AuthenticatedSessionUser } from "../auth/auth.types";
import { EngagementService } from "../engagement/engagement.service";
import { IStudyRepository } from "../studies/study.repository.interface";
import { ILikeRepository } from "./like.repository.interface";

@injectable()
export class LikeService {
  constructor(
    @inject(TOKENS.LikeRepository)
    private readonly likes: ILikeRepository,
    @inject(TOKENS.StudyRepository)
    private readonly studies: IStudyRepository,
    private readonly engagement: EngagementService
  ) {}

  public async createLike(postId: string, user: AuthenticatedSessionUser) {
    const post = await this.studies.findById(postId);

    if (!post || post.status !== "published") {
      throw new AppError("NÃƒÂ£o foi possÃƒÂ­vel curtir este estudo.", 404, "study_not_found");
    }

    const existingLike = await this.likes.findLike(postId, user.id);

    if (!existingLike) {
      await this.likes.createLike(postId, user.id);
      await this.engagement.registerStudyLike(user, post);
    }

    const likesCount = await this.studies.countLikesByPostId(postId);

    return {
      likedByCurrentUser: true,
      likesCount,
      postId,
    };
  }

  public async deleteLike(postId: string, user: AuthenticatedSessionUser) {
    const post = await this.studies.findById(postId);

    if (!post || post.status !== "published") {
      throw new AppError("NÃƒÂ£o foi possÃƒÂ­vel remover a curtida deste estudo.", 404, "study_not_found");
    }

    await this.likes.deleteLike(postId, user.id);

    const likesCount = await this.studies.countLikesByPostId(postId);

    return {
      likedByCurrentUser: false,
      likesCount,
      postId,
    };
  }
}
