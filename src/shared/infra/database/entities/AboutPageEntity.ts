import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "about_pages" })
export class AboutPageEntity {
  @PrimaryColumn("varchar", { length: 36 })
  id!: string;

  @Column("varchar", { name: "seo_title", length: 180, nullable: true })
  seoTitle!: string | null;

  @Column("text", { name: "seo_description", nullable: true })
  seoDescription!: string | null;

  @Column("jsonb", { default: () => "'[]'::jsonb" })
  blocks!: Array<Record<string, unknown>>;

  @Column("timestamptz", { name: "created_at", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @Column("timestamptz", { name: "updated_at", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
