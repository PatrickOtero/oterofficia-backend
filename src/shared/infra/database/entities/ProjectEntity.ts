import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "projects" })
export class ProjectEntity {
  @PrimaryGeneratedColumn({ type: "int" })
  id!: number;

  @Column("text", { name: "image_url" })
  imageUrl!: string;

  @Column("varchar", { name: "project_name", length: 255 })
  projectName!: string;

  @Column("text", { name: "project_desc" })
  projectDescription!: string;

  @Column("varchar", { name: "project_status", length: 20, default: "completed" })
  projectStatus!: "completed" | "in_progress";

  @Column("varchar", { name: "project_track", length: 20, default: "personal" })
  projectTrack!: "personal" | "soujunior";

  @Column("varchar", { name: "organization_name", length: 120, nullable: true })
  organizationName!: string | null;

  @Column("varchar", { name: "project_role", length: 140, nullable: true })
  projectRole!: string | null;

  @Column("varchar", { name: "project_highlight", length: 220, nullable: true })
  projectHighlight!: string | null;

  @Column("jsonb", { name: "project_tags", default: () => "'[]'::jsonb" })
  projectTags!: string[];

  @Column("text", { name: "frontend_url", nullable: true })
  frontendUrl!: string | null;

  @Column("text", { name: "backend_url", nullable: true })
  backendUrl!: string | null;

  @Column("text", { name: "video_url", nullable: true })
  videoUrl!: string | null;
}
