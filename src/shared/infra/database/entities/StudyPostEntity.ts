import {
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { StudyPostBlockEntity } from "./StudyPostBlockEntity";
import { StudyPostCommentEntity } from "./StudyPostCommentEntity";
import { StudyPostLikeEntity } from "./StudyPostLikeEntity";

@Entity({ name: "study_posts" })
export class StudyPostEntity {
  @PrimaryColumn("varchar", { length: 36 })
  id!: string;

  @Column("varchar", { length: 180 })
  title!: string;

  @Column("varchar", { length: 190, unique: true })
  slug!: string;

  @Column("text")
  excerpt!: string;

  @Column("text", { name: "cover_image", nullable: true })
  coverImage!: string | null;

  @Column("varchar", { length: 20, default: "draft" })
  status!: "draft" | "published";

  @Column("varchar", { length: 120 })
  category!: string;

  @Column("jsonb", { default: () => "'[]'::jsonb" })
  tags!: string[];

  @Column("int", { name: "reading_time", default: 1 })
  readingTime!: number;

  @Column("varchar", { name: "seo_title", length: 180, nullable: true })
  seoTitle!: string | null;

  @Column("text", { name: "seo_description", nullable: true })
  seoDescription!: string | null;

  @Column("timestamptz", { name: "created_at", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @Column("timestamptz", { name: "updated_at", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;

  @Column("timestamptz", { name: "published_at", nullable: true })
  publishedAt!: Date | null;

  @OneToMany(() => StudyPostBlockEntity, (block) => block.post)
  blocks?: StudyPostBlockEntity[];

  @OneToMany(() => StudyPostLikeEntity, (like) => like.post)
  likes?: StudyPostLikeEntity[];

  @OneToMany(() => StudyPostCommentEntity, (comment) => comment.post)
  comments?: StudyPostCommentEntity[];
}
