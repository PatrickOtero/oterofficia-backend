import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { StudyPostEntity } from "./StudyPostEntity";
import { UserEntity } from "./UserEntity";

@Entity({ name: "study_post_comments" })
export class StudyPostCommentEntity {
  @PrimaryColumn("varchar", { length: 36 })
  id!: string;

  @Column("text")
  content!: string;

  @Column("varchar", { name: "user_id", length: 36 })
  userId!: string;

  @ManyToOne(() => UserEntity, (user) => user.comments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: UserEntity;

  @Column("varchar", { name: "post_id", length: 36 })
  postId!: string;

  @ManyToOne(() => StudyPostEntity, (post) => post.comments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "post_id" })
  post!: StudyPostEntity;

  @Column("timestamptz", { name: "created_at", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @Column("timestamptz", { name: "updated_at", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
