import type { NotificationEntity } from "../../shared/infra/database/entities/NotificationEntity";
import type { UserEntity } from "../../shared/infra/database/entities/UserEntity";
import { normalizeUploadUrl } from "../uploads/upload-url";
import type {
  MixRow,
  OverviewRow,
  RecentActivityRow,
  SeriesRow,
  UserAggregateRow,
  VisitorSummaryRow,
} from "./engagement.repository.rows";
import type {
  EngagementInteractionKind,
  EngagementRecipient,
  InteractionAnalyticsData,
  InteractionAnalyticsMixItem,
  InteractionAnalyticsRecentActivityItem,
  InteractionAnalyticsSeriesPoint,
  InteractionAnalyticsUserRow,
  NotificationItem,
  SiteVisitorSummary,
} from "./engagement.types";

export const toIso = (value: Date | string | null) => (value ? new Date(value).toISOString() : null);
const toNumber = (value: number | string | null | undefined) => Number(value ?? 0);

export const mapRecipient = (user: UserEntity): EngagementRecipient => ({
  avatarUrl: normalizeUploadUrl(user.avatarUrl ?? null),
  id: user.id,
  name: user.name,
  role: user.role,
});

const mapUserAggregateRow = (row: UserAggregateRow): InteractionAnalyticsUserRow => ({
  avatarUrl: normalizeUploadUrl(row.avatar_url),
  commentLikes: toNumber(row.comment_likes),
  comments: toNumber(row.comments),
  lastInteractionAt: toIso(row.last_interaction_at),
  name: row.name,
  reads: toNumber(row.reads),
  replies: toNumber(row.replies),
  role: row.role,
  studyLikes: toNumber(row.study_likes),
  totalInteractions: toNumber(row.total_interactions),
  userId: row.user_id,
});

const interactionMixLabelMap: Record<EngagementInteractionKind, string> = {
  comment_created: "Comentários",
  comment_like: "Curtidas em comentários",
  comment_reply: "Respostas",
  study_like: "Curtidas em publicações",
  study_view: "Leituras",
};

export const mapAdminInteractionAnalytics = (input: {
  mixRows: MixRow[];
  overviewRow?: OverviewRow;
  recentRows: RecentActivityRow[];
  seriesRows: SeriesRow[];
  topCommentersRows: UserAggregateRow[];
  topLikersRows: UserAggregateRow[];
  topReadersRows: UserAggregateRow[];
  topUsersRows: UserAggregateRow[];
}): InteractionAnalyticsData => ({
  activitySeries: input.seriesRows.map(
    (row): InteractionAnalyticsSeriesPoint => ({
      comments: toNumber(row.comments),
      label: row.day_label,
      likes: toNumber(row.likes),
      reads: toNumber(row.reads),
    })
  ),
  interactionMix: input.mixRows.map(
    (row): InteractionAnalyticsMixItem => ({
      count: toNumber(row.count),
      kind: row.kind,
      label: interactionMixLabelMap[row.kind],
    })
  ),
  overview: {
    totalCommentLikes: toNumber(input.overviewRow?.total_comment_likes),
    totalComments: toNumber(input.overviewRow?.total_comments),
    totalEvents: toNumber(input.overviewRow?.total_events),
    totalReads: toNumber(input.overviewRow?.total_reads),
    totalReplies: toNumber(input.overviewRow?.total_replies),
    totalStudyLikes: toNumber(input.overviewRow?.total_study_likes),
    trackedUsers: toNumber(input.overviewRow?.tracked_users),
  },
  recentActivity: input.recentRows.map(
    (row): InteractionAnalyticsRecentActivityItem => ({
      actorName: row.actor_name,
      actorRole: row.actor_role,
      createdAt: new Date(row.created_at).toISOString(),
      id: row.id,
      kind: row.kind,
      postTitle: row.post_title,
    })
  ),
  topCommenters: input.topCommentersRows.map(mapUserAggregateRow),
  topLikers: input.topLikersRows.map(mapUserAggregateRow),
  topReaders: input.topReadersRows.map(mapUserAggregateRow),
  topUsers: input.topUsersRows.map(mapUserAggregateRow),
});

export const mapNotificationItem = (notification: NotificationEntity): NotificationItem => ({
  actor: notification.actorUser
    ? {
        avatarUrl: normalizeUploadUrl(notification.actorUser.avatarUrl ?? null),
        id: notification.actorUser.id,
        name: notification.actorUser.name,
        role: notification.actorUser.role,
      }
    : null,
  body: notification.body,
  createdAt: notification.createdAt.toISOString(),
  id: notification.id,
  kind: notification.kind as NotificationItem["kind"],
  metadata: notification.metadata ?? null,
  readAt: toIso(notification.readAt),
  targetPath: notification.targetPath ?? null,
  title: notification.title,
});

export const mapSiteVisitorSummary = (
  row: VisitorSummaryRow | undefined,
  range: { since: Date | null; until: Date | null }
): SiteVisitorSummary => ({
  entriesSince: toNumber(row?.entries_since),
  lastVisitAt: toIso(row?.last_visit_at ?? null),
  newVisitorsSince: toNumber(row?.new_visitors_since),
  since: toIso(range.since),
  totalEntries: toNumber(row?.total_entries),
  totalVisitors: toNumber(row?.total_visitors),
  until: toIso(range.until),
  visitorsSince: toNumber(row?.visitors_since),
});
