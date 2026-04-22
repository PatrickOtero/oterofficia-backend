import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "site_visitors" })
export class SiteVisitorEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Index("idx_site_visitors_visitor_key_unique", { unique: true })
  @Column({ name: "visitor_key", type: "varchar" })
  visitorKey!: string;

  @CreateDateColumn({ name: "first_seen_at", type: "timestamp with time zone" })
  firstSeenAt!: Date;

  @UpdateDateColumn({ name: "last_seen_at", type: "timestamp with time zone" })
  lastSeenAt!: Date;

  @Column({ name: "entry_count", type: "integer", default: 1 })
  entryCount!: number;

  @Column({ name: "last_path", type: "varchar", nullable: true })
  lastPath!: string | null;

  @Column({ name: "user_agent", type: "varchar", nullable: true })
  userAgent!: string | null;

  @Column({ name: "referrer", type: "varchar", nullable: true })
  referrer!: string | null;
}
