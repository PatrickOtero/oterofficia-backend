import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { UserEntity } from "./UserEntity";

@Entity({ name: "user_action_tokens" })
export class UserActionTokenEntity {
  @PrimaryColumn("varchar", { length: 36 })
  id!: string;

  @Column("varchar", { name: "user_id", length: 36 })
  userId!: string;

  @ManyToOne(() => UserEntity, (user) => user.actionTokens, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: UserEntity;

  @Column("varchar", { length: 40 })
  type!: string;

  @Column("varchar", { name: "token_hash", length: 64, unique: true })
  tokenHash!: string;

  @Column("jsonb", { nullable: true })
  payload!: Record<string, unknown> | null;

  @Column("timestamptz", { name: "expires_at" })
  expiresAt!: Date;

  @Column("timestamptz", { name: "consumed_at", nullable: true })
  consumedAt!: Date | null;

  @Column("timestamptz", { name: "created_at", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
