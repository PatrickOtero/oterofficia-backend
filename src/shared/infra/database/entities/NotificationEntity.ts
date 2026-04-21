import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { UserEntity } from "./UserEntity";

@Entity({ name: "notifications" })
export class NotificationEntity {
  @PrimaryColumn("varchar", { length: 36 })
  id!: string;

  @Column("varchar", { name: "recipient_user_id", length: 36 })
  recipientUserId!: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "recipient_user_id" })
  recipientUser!: UserEntity;

  @Column("varchar", { name: "actor_user_id", length: 36, nullable: true })
  actorUserId!: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "actor_user_id" })
  actorUser!: UserEntity | null;

  @Column("varchar", { length: 48 })
  kind!: string;

  @Column("varchar", { length: 180 })
  title!: string;

  @Column("text")
  body!: string;

  @Column("text", { name: "target_path", nullable: true })
  targetPath!: string | null;

  @Column("jsonb", { nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column("timestamptz", { name: "read_at", nullable: true })
  readAt!: Date | null;

  @Column("timestamptz", { name: "created_at", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
