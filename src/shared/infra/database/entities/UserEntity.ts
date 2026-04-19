import {
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { StudyCommentLikeEntity } from "./StudyCommentLikeEntity";
import { StudyPostCommentEntity } from "./StudyPostCommentEntity";
import { StudyPostLikeEntity } from "./StudyPostLikeEntity";
import { UserActionTokenEntity } from "./UserActionTokenEntity";
import { UserSessionEntity } from "./UserSessionEntity";

@Entity({ name: "users" })
export class UserEntity {
  @PrimaryColumn("varchar", { length: 36 })
  id!: string;

  @Column("varchar", { length: 160 })
  name!: string;

  @Column("varchar", { length: 190, unique: true })
  email!: string;

  @Column("text", { name: "password_hash" })
  passwordHash!: string;

  @Column("varchar", { length: 20, default: "user" })
  role!: "admin" | "user";

  @Column("text", { name: "avatar_url", nullable: true })
  avatarUrl!: string | null;

  @Column("date", { name: "birth_date", nullable: true })
  birthDate!: string | null;

  @Column("timestamptz", { name: "email_verified_at", nullable: true })
  emailVerifiedAt!: Date | null;

  @Column("timestamptz", { name: "created_at", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @Column("timestamptz", { name: "updated_at", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @OneToMany(() => UserSessionEntity, (session) => session.user)
  sessions?: UserSessionEntity[];

  @OneToMany(() => StudyPostLikeEntity, (like) => like.user)
  likes?: StudyPostLikeEntity[];

  @OneToMany(() => StudyPostCommentEntity, (comment) => comment.user)
  comments?: StudyPostCommentEntity[];

  @OneToMany(() => StudyCommentLikeEntity, (commentLike) => commentLike.user)
  commentLikes?: StudyCommentLikeEntity[];

  @OneToMany(() => UserActionTokenEntity, (token) => token.user)
  actionTokens?: UserActionTokenEntity[];
}
