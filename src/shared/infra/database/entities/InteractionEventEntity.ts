import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { StudyPostCommentEntity } from "./StudyPostCommentEntity";
import { StudyPostEntity } from "./StudyPostEntity";
import { UserEntity } from "./UserEntity";

@Entity({ name: "interaction_events" })
export class InteractionEventEntity {
  @PrimaryColumn("varchar", { length: 36 })
  id!: string;

  @Column("varchar", { name: "actor_user_id", length: 36, nullable: true })
  actorUserId!: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "actor_user_id" })
  actorUser!: UserEntity | null;

  @Column("varchar", { name: "study_post_id", length: 36, nullable: true })
  studyPostId!: string | null;

  @ManyToOne(() => StudyPostEntity, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "study_post_id" })
  studyPost!: StudyPostEntity | null;

  @Column("varchar", { name: "comment_id", length: 36, nullable: true })
  commentId!: string | null;

  @ManyToOne(() => StudyPostCommentEntity, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "comment_id" })
  comment!: StudyPostCommentEntity | null;

  @Column("varchar", { length: 48 })
  kind!: string;

  @Column("jsonb", { nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column("timestamptz", { name: "created_at", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
