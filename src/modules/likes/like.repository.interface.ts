export type LikeRecord = {
  createdAt: Date;
  id: string;
  postId: string;
  userId: string;
};

export interface ILikeRepository {
  createLike(postId: string, userId: string): Promise<void>;
  deleteLike(postId: string, userId: string): Promise<void>;
  findLike(postId: string, userId: string): Promise<LikeRecord | null>;
}
