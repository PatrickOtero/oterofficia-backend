import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { StudyPostCommentEntity } from "./StudyPostCommentEntity";
import { UserEntity } from "./UserEntity";

@Entity({ name: "study_comment_likes" })
@Index(["userId", "commentId"], { unique: true })
export class StudyCommentLikeEntity {
  @PrimaryColumn("varchar", { length: 36 })
  id!: string;

  @Column("varchar", { name: "user_id", length: 36 })
  userId!: string;

  @ManyToOne(() => UserEntity, (user) => user.commentLikes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: UserEntity;

  @Column("varchar", { name: "comment_id", length: 36 })
  commentId!: string;

  @ManyToOne(() => StudyPostCommentEntity, (comment) => comment.likes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "comment_id" })
  comment!: StudyPostCommentEntity;

  @Column("timestamptz", { name: "created_at", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
