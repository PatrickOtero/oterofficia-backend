import { randomUUID } from "crypto";
import { getDataSource } from "../../shared/infra/database/data-source";
import { StudyPostLikeEntity } from "../../shared/infra/database/entities/StudyPostLikeEntity";
import { singleton } from "tsyringe";
import { ILikeRepository, LikeRecord } from "./like.repository.interface";

@singleton()
export class LikeRepository implements ILikeRepository {
  public async createLike(postId: string, userId: string) {
    const dataSource = await getDataSource();

    await dataSource.getRepository(StudyPostLikeEntity).save({
      createdAt: new Date(),
      id: randomUUID(),
      postId,
      userId,
    });
  }

  public async deleteLike(postId: string, userId: string) {
    const dataSource = await getDataSource();

    await dataSource.getRepository(StudyPostLikeEntity).delete({
      postId,
      userId,
    });
  }

  public async findLike(postId: string, userId: string) {
    const dataSource = await getDataSource();
    const like = await dataSource.getRepository(StudyPostLikeEntity).findOne({
      where: {
        postId,
        userId,
      },
    });

    if (!like) {
      return null;
    }

    return {
      createdAt: like.createdAt,
      id: like.id,
      postId: like.postId,
      userId: like.userId,
    } as LikeRecord;
  }
}
