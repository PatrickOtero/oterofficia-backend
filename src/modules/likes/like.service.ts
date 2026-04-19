import { AppError } from "../../core/errors/AppError";
import { inject, injectable } from "tsyringe";
import { TOKENS } from "../../shared/container/tokens";
import { ILikeRepository } from "./like.repository.interface";
import { IStudyRepository } from "../studies/study.repository.interface";

@injectable()
export class LikeService {
  constructor(
    @inject(TOKENS.LikeRepository)
    private readonly likes: ILikeRepository,
    @inject(TOKENS.StudyRepository)
    private readonly studies: IStudyRepository
  ) {}

  public async createLike(postId: string, userId: string) {
    const post = await this.studies.findById(postId);

    if (!post || post.status !== "published") {
      throw new AppError("NÃ£o foi possÃ­vel curtir este estudo.", 404, "study_not_found");
    }

    const existingLike = await this.likes.findLike(postId, userId);

    if (!existingLike) {
      await this.likes.createLike(postId, userId);
    }

    const likesCount = await this.studies.countLikesByPostId(postId);

    return {
      likedByCurrentUser: true,
      likesCount,
      postId,
    };
  }

  public async deleteLike(postId: string, userId: string) {
    const post = await this.studies.findById(postId);

    if (!post || post.status !== "published") {
      throw new AppError("NÃ£o foi possÃ­vel remover a curtida deste estudo.", 404, "study_not_found");
    }

    await this.likes.deleteLike(postId, userId);

    const likesCount = await this.studies.countLikesByPostId(postId);

    return {
      likedByCurrentUser: false,
      likesCount,
      postId,
    };
  }
}
