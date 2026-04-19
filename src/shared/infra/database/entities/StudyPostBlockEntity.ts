import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { StudyPostEntity } from "./StudyPostEntity";

@Entity({ name: "study_post_blocks" })
export class StudyPostBlockEntity {
  @PrimaryColumn("varchar", { length: 36 })
  id!: string;

  @Column("varchar", { name: "post_id", length: 36 })
  postId!: string;

  @ManyToOne(() => StudyPostEntity, (post) => post.blocks, { onDelete: "CASCADE" })
  @JoinColumn({ name: "post_id" })
  post!: StudyPostEntity;

  @Column("varchar", { length: 30 })
  type!: string;

  @Column("int")
  position!: number;

  @Column("jsonb")
  data!: Record<string, unknown>;

  @Column("timestamptz", { name: "created_at", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @Column("timestamptz", { name: "updated_at", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
