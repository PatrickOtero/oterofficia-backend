import {
  CreateInteractionEventInput,
  CreateNotificationInput,
  EngagementInteractionKind,
  EngagementRecipient,
  InteractionAnalyticsData,
  NotificationFeed,
  SiteVisitorSummary,
  SiteVisitorTrackInput,
} from "./engagement.types";

export interface IEngagementRepository {
  createInteractionEvent(input: CreateInteractionEventInput): Promise<void>;
  createNotifications(inputs: CreateNotificationInput[]): Promise<void>;
  findRecentInteraction(input: {
    actorUserId: string;
    kind: EngagementInteractionKind;
    since: Date;
    studyPostId?: string | null;
  }): Promise<boolean>;
  findRecipientById(userId: string): Promise<EngagementRecipient | null>;
  getAdminInteractionAnalytics(): Promise<InteractionAnalyticsData>;
  listAdminRecipients(excludedUserId?: string): Promise<EngagementRecipient[]>;
  listNotificationFeed(recipientUserId: string, limit?: number): Promise<NotificationFeed>;
  listPostParticipantRecipients(postId: string, excludedUserIds: string[]): Promise<EngagementRecipient[]>;
  markAllNotificationsRead(recipientUserId: string): Promise<void>;
  markNotificationRead(notificationId: string, recipientUserId: string): Promise<boolean>;
  recordSiteVisit(input: SiteVisitorTrackInput): Promise<void>;
  getSiteVisitorSummary(input?: { since?: Date | null; until?: Date | null }): Promise<SiteVisitorSummary>;
}
