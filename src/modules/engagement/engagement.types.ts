import { UserRole } from "../auth/auth.types";

export type EngagementNotificationKind =
  | "thread-comment"
  | "comment-reply"
  | "comment-like"
  | "admin-comment"
  | "admin-reply"
  | "admin-comment-like"
  | "admin-study-like";

export type EngagementInteractionKind =
  | "study_view"
  | "study_like"
  | "comment_created"
  | "comment_reply"
  | "comment_like";

export type EngagementRecipient = {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl: string | null;
};

export type NotificationActor = {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl: string | null;
};

export type CreateNotificationInput = {
  recipientUserId: string;
  actorUserId?: string | null;
  kind: EngagementNotificationKind;
  title: string;
  body: string;
  targetPath?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type CreateInteractionEventInput = {
  actorUserId?: string | null;
  studyPostId?: string | null;
  commentId?: string | null;
  kind: EngagementInteractionKind;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
};

export type NotificationItem = {
  id: string;
  kind: EngagementNotificationKind;
  title: string;
  body: string;
  targetPath: string | null;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
  actor: NotificationActor | null;
};

export type NotificationFeed = {
  items: NotificationItem[];
  unreadCount: number;
};

export type InteractionAnalyticsOverview = {
  totalEvents: number;
  trackedUsers: number;
  totalReads: number;
  totalStudyLikes: number;
  totalComments: number;
  totalReplies: number;
  totalCommentLikes: number;
};

export type InteractionAnalyticsUserRow = {
  userId: string;
  name: string;
  role: UserRole;
  avatarUrl: string | null;
  reads: number;
  comments: number;
  replies: number;
  studyLikes: number;
  commentLikes: number;
  totalInteractions: number;
  lastInteractionAt: string | null;
};

export type InteractionAnalyticsSeriesPoint = {
  label: string;
  reads: number;
  comments: number;
  likes: number;
};

export type InteractionAnalyticsMixItem = {
  kind: EngagementInteractionKind;
  label: string;
  count: number;
};

export type InteractionAnalyticsRecentActivityItem = {
  id: string;
  kind: EngagementInteractionKind;
  actorName: string;
  actorRole: UserRole;
  postTitle: string | null;
  createdAt: string;
};

export type InteractionAnalyticsData = {
  overview: InteractionAnalyticsOverview;
  topUsers: InteractionAnalyticsUserRow[];
  topReaders: InteractionAnalyticsUserRow[];
  topCommenters: InteractionAnalyticsUserRow[];
  topLikers: InteractionAnalyticsUserRow[];
  interactionMix: InteractionAnalyticsMixItem[];
  activitySeries: InteractionAnalyticsSeriesPoint[];
  recentActivity: InteractionAnalyticsRecentActivityItem[];
};
