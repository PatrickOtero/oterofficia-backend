import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";

@Entity({ name: "site_visit_events" })
export class SiteVisitEventEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Index("idx_site_visit_events_visitor_key")
  @Column({ name: "visitor_key", type: "varchar" })
  visitorKey!: string;

  @Index("idx_site_visit_events_visited_at")
  @CreateDateColumn({ name: "visited_at", type: "timestamp with time zone" })
  visitedAt!: Date;

  @Column({ name: "path", type: "varchar", nullable: true })
  path!: string | null;

  @Column({ name: "user_agent", type: "varchar", nullable: true })
  userAgent!: string | null;

  @Column({ name: "referrer", type: "varchar", nullable: true })
  referrer!: string | null;
}
