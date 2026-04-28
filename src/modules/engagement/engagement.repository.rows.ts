import type { EngagementInteractionKind } from "./engagement.types";

export type UserAggregateRow = {
  avatar_url: string | null;
  comment_likes: number | string;
  comments: number | string;
  last_interaction_at: Date | string | null;
  name: string;
  reads: number | string;
  replies: number | string;
  role: "admin" | "user";
  study_likes: number | string;
  total_interactions: number | string;
  user_id: string;
};

export type MixRow = {
  count: number | string;
  kind: EngagementInteractionKind;
};

export type OverviewRow = {
  total_comment_likes: number | string;
  total_comments: number | string;
  total_events: number | string;
  total_reads: number | string;
  total_replies: number | string;
  total_study_likes: number | string;
  tracked_users: number | string;
};

export type RecentActivityRow = {
  actor_name: string;
  actor_role: "admin" | "user";
  created_at: Date | string;
  id: string;
  kind: EngagementInteractionKind;
  post_title: string | null;
};

export type SeriesRow = {
  comments: number | string;
  day_label: string;
  likes: number | string;
  reads: number | string;
};

export type VisitorSummaryRow = {
  entries_since: number | string;
  last_visit_at: Date | string | null;
  new_visitors_since: number | string;
  total_entries: number | string;
  total_visitors: number | string;
  visitors_since: number | string;
};
