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

  @Column("text", { name: "frontend_url", nullable: true })
  frontendUrl!: string | null;

  @Column("text", { name: "backend_url", nullable: true })
  backendUrl!: string | null;

  @Column("text", { name: "video_url", nullable: true })
  videoUrl!: string | null;
}
