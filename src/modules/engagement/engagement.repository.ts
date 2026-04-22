import { randomUUID } from "crypto";
import { injectable } from "tsyringe";
import { getDataSource } from "../../shared/infra/database/data-source";
import { InteractionEventEntity } from "../../shared/infra/database/entities/InteractionEventEntity";
import { NotificationEntity } from "../../shared/infra/database/entities/NotificationEntity";
import { StudyPostCommentEntity } from "../../shared/infra/database/entities/StudyPostCommentEntity";
import { UserEntity } from "../../shared/infra/database/entities/UserEntity";
import { normalizeUploadUrl } from "../uploads/upload-url";
import { IEngagementRepository } from "./engagement.repository.interface";
import {
  CreateInteractionEventInput,
  CreateNotificationInput,
  EngagementInteractionKind,
  EngagementRecipient,
  InteractionAnalyticsData,
  InteractionAnalyticsMixItem,
  InteractionAnalyticsRecentActivityItem,
  InteractionAnalyticsSeriesPoint,
  InteractionAnalyticsUserRow,
  NotificationFeed,
  NotificationItem,
  SiteVisitorSummary,
  SiteVisitorTrackInput,
} from "./engagement.types";

type ActorRow = {
  avatar_url: string | null;
  id: string;
  name: string;
  role: "admin" | "user";
};

type UserAggregateRow = {
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

type MixRow = {
  count: number | string;
  kind: EngagementInteractionKind;
};

type OverviewRow = {
  total_comment_likes: number | string;
  total_comments: number | string;
  total_events: number | string;
  total_reads: number | string;
  total_replies: number | string;
  total_study_likes: number | string;
  tracked_users: number | string;
};

type RecentActivityRow = {
  actor_name: string;
  actor_role: "admin" | "user";
  created_at: Date | string;
  id: string;
  kind: EngagementInteractionKind;
  post_title: string | null;
};

type SeriesRow = {
  comments: number | string;
  day_label: string;
  likes: number | string;
  reads: number | string;
};

type VisitorSummaryRow = {
  entries_since: number | string;
  last_visit_at: Date | string | null;
  new_visitors_since: number | string;
  total_entries: number | string;
  total_visitors: number | string;
  visitors_since: number | string;
};

const toIso = (value: Date | string | null) => (value ? new Date(value).toISOString() : null);
const toNumber = (value: number | string | null | undefined) => Number(value ?? 0);

const mapRecipient = (user: UserEntity): EngagementRecipient => ({
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
  comment_created: "Comentarios",
  comment_like: "Curtidas em comentarios",
  comment_reply: "Respostas",
  study_like: "Curtidas em publicacoes",
  study_view: "Leituras",
};

@injectable()
export class EngagementRepository implements IEngagementRepository {
  public async createInteractionEvent(input: CreateInteractionEventInput) {
    const dataSource = await getDataSource();

    await dataSource.getRepository(InteractionEventEntity).save({
      actorUserId: input.actorUserId ?? null,
      commentId: input.commentId ?? null,
      createdAt: input.createdAt ?? new Date(),
      id: randomUUID(),
      kind: input.kind,
      metadata: input.metadata ?? null,
      studyPostId: input.studyPostId ?? null,
    });
  }

  public async createNotifications(inputs: CreateNotificationInput[]) {
    if (!inputs.length) {
      return;
    }

    const dataSource = await getDataSource();
    const repository = dataSource.getRepository(NotificationEntity);

    await repository.save(
      inputs.map((input) =>
        repository.create({
          actorUserId: input.actorUserId ?? null,
          body: input.body,
          createdAt: new Date(),
          id: randomUUID(),
          kind: input.kind,
          metadata: input.metadata ?? null,
          readAt: null,
          recipientUserId: input.recipientUserId,
          targetPath: input.targetPath ?? null,
          title: input.title,
        })
      )
    );
  }

  public async findRecentInteraction(input: {
    actorUserId: string;
    kind: EngagementInteractionKind;
    since: Date;
    studyPostId?: string | null;
  }) {
    const dataSource = await getDataSource();
    const queryBuilder = dataSource
      .getRepository(InteractionEventEntity)
      .createQueryBuilder("event")
      .where("event.actor_user_id = :actorUserId", { actorUserId: input.actorUserId })
      .andWhere("event.kind = :kind", { kind: input.kind })
      .andWhere("event.created_at >= :since", { since: input.since.toISOString() });

    if (input.studyPostId) {
      queryBuilder.andWhere("event.study_post_id = :studyPostId", { studyPostId: input.studyPostId });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  public async findRecipientById(userId: string) {
    const dataSource = await getDataSource();
    const user = await dataSource.getRepository(UserEntity).findOne({
      where: {
        id: userId,
      },
    });

    return user ? mapRecipient(user) : null;
  }

  public async getAdminInteractionAnalytics(): Promise<InteractionAnalyticsData> {
    const dataSource = await getDataSource();
    const [overviewRows, topUsersRows, topReadersRows, topCommentersRows, topLikersRows, mixRows, seriesRows, recentRows] =
      await Promise.all([
        dataSource.query(`
          select
            count(*)::int as total_events,
            count(distinct actor_user_id)::int as tracked_users,
            coalesce(sum(case when kind = 'study_view' then 1 else 0 end), 0)::int as total_reads,
            coalesce(sum(case when kind = 'study_like' then 1 else 0 end), 0)::int as total_study_likes,
            coalesce(sum(case when kind = 'comment_created' then 1 else 0 end), 0)::int as total_comments,
            coalesce(sum(case when kind = 'comment_reply' then 1 else 0 end), 0)::int as total_replies,
            coalesce(sum(case when kind = 'comment_like' then 1 else 0 end), 0)::int as total_comment_likes
          from interaction_events
        `),
        dataSource.query(this.buildTopUsersQuery("total_interactions")),
        dataSource.query(this.buildTopUsersQuery("reads")),
        dataSource.query(this.buildTopUsersQuery("comments")),
        dataSource.query(this.buildTopUsersQuery("likes")),
        dataSource.query(`
          select
            kind,
            count(*)::int as count
          from interaction_events
          group by kind
          order by count desc, kind asc
        `),
        dataSource.query(`
          with days as (
            select generate_series(current_date - interval '6 days', current_date, interval '1 day')::date as day
          )
          select
            to_char(days.day, 'DD/MM') as day_label,
            coalesce(sum(case when events.kind = 'study_view' then 1 else 0 end), 0)::int as reads,
            coalesce(sum(case when events.kind in ('comment_created', 'comment_reply') then 1 else 0 end), 0)::int as comments,
            coalesce(sum(case when events.kind in ('study_like', 'comment_like') then 1 else 0 end), 0)::int as likes
          from days
          left join interaction_events events on events.created_at::date = days.day
          group by days.day
          order by days.day asc
        `),
        dataSource.query(`
          select
            events.id,
            events.kind,
            events.created_at,
            coalesce(users.name, 'Usuario removido') as actor_name,
            coalesce(users.role, 'user') as actor_role,
            posts.title as post_title
          from interaction_events events
          left join users on users.id = events.actor_user_id
          left join study_posts posts on posts.id = events.study_post_id
          order by events.created_at desc
          limit 12
        `),
      ]);

    const overviewRow = overviewRows[0] as OverviewRow | undefined;

    return {
      activitySeries: (seriesRows as SeriesRow[]).map(
        (row): InteractionAnalyticsSeriesPoint => ({
          comments: toNumber(row.comments),
          label: row.day_label,
          likes: toNumber(row.likes),
          reads: toNumber(row.reads),
        })
      ),
      interactionMix: (mixRows as MixRow[]).map(
        (row): InteractionAnalyticsMixItem => ({
          count: toNumber(row.count),
          kind: row.kind,
          label: interactionMixLabelMap[row.kind],
        })
      ),
      overview: {
        totalCommentLikes: toNumber(overviewRow?.total_comment_likes),
        totalComments: toNumber(overviewRow?.total_comments),
        totalEvents: toNumber(overviewRow?.total_events),
        totalReads: toNumber(overviewRow?.total_reads),
        totalReplies: toNumber(overviewRow?.total_replies),
        totalStudyLikes: toNumber(overviewRow?.total_study_likes),
        trackedUsers: toNumber(overviewRow?.tracked_users),
      },
      recentActivity: (recentRows as RecentActivityRow[]).map(
        (row): InteractionAnalyticsRecentActivityItem => ({
          actorName: row.actor_name,
          actorRole: row.actor_role,
          createdAt: new Date(row.created_at).toISOString(),
          id: row.id,
          kind: row.kind,
          postTitle: row.post_title,
        })
      ),
      topCommenters: (topCommentersRows as UserAggregateRow[]).map(mapUserAggregateRow),
      topLikers: (topLikersRows as UserAggregateRow[]).map(mapUserAggregateRow),
      topReaders: (topReadersRows as UserAggregateRow[]).map(mapUserAggregateRow),
      topUsers: (topUsersRows as UserAggregateRow[]).map(mapUserAggregateRow),
    };
  }

  public async listAdminRecipients(excludedUserId?: string) {
    const dataSource = await getDataSource();
    const queryBuilder = dataSource
      .getRepository(UserEntity)
      .createQueryBuilder("user")
      .where("user.role = :role", { role: "admin" })
      .orderBy("user.createdAt", "ASC");

    if (excludedUserId) {
      queryBuilder.andWhere("user.id != :excludedUserId", { excludedUserId });
    }

    return (await queryBuilder.getMany()).map(mapRecipient);
  }

  public async listNotificationFeed(recipientUserId: string, limit = 18): Promise<NotificationFeed> {
    const dataSource = await getDataSource();
    const repository = dataSource.getRepository(NotificationEntity);
    const notifications = await repository.find({
      order: {
        createdAt: "DESC",
      },
      relations: {
        actorUser: true,
      },
      take: Math.min(Math.max(limit, 1), 50),
      where: {
        recipientUserId,
      },
    });
    const unreadCount = await repository
      .createQueryBuilder("notification")
      .where("notification.recipient_user_id = :recipientUserId", { recipientUserId })
      .andWhere("notification.read_at IS NULL")
      .getCount();

    const items: NotificationItem[] = notifications.map((notification) => ({
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
    }));

    return {
      items,
      unreadCount,
    };
  }

  public async listPostParticipantRecipients(postId: string, excludedUserIds: string[]) {
    const dataSource = await getDataSource();
    const queryBuilder = dataSource
      .getRepository(UserEntity)
      .createQueryBuilder("user")
      .innerJoin(StudyPostCommentEntity, "comment", "comment.user_id = user.id")
      .where("comment.post_id = :postId", { postId })
      .distinct(true)
      .orderBy("user.createdAt", "ASC");

    if (excludedUserIds.length) {
      queryBuilder.andWhere("user.id NOT IN (:...excludedUserIds)", { excludedUserIds });
    }

    return (await queryBuilder.getMany()).map(mapRecipient);
  }

  public async markAllNotificationsRead(recipientUserId: string) {
    const dataSource = await getDataSource();

    await dataSource
      .getRepository(NotificationEntity)
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({
        readAt: new Date(),
      })
      .where("recipient_user_id = :recipientUserId", { recipientUserId })
      .andWhere("read_at IS NULL")
      .execute();
  }

  public async markNotificationRead(notificationId: string, recipientUserId: string) {
    const dataSource = await getDataSource();
    const result = await dataSource
      .getRepository(NotificationEntity)
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({
        readAt: new Date(),
      })
      .where("id = :notificationId", { notificationId })
      .andWhere("recipient_user_id = :recipientUserId", { recipientUserId })
      .andWhere("read_at IS NULL")
      .execute();

    return Boolean(result.affected);
  }

  public async recordSiteVisit(input: SiteVisitorTrackInput) {
    if (input.shouldIgnore) {
      return;
    }

    const dataSource = await getDataSource();

    await dataSource.transaction(async (manager) => {
      await manager.query(
        `
          insert into site_visit_events (
            id,
            visitor_key,
            visited_at,
            path,
            user_agent,
            referrer
          )
          values ($1, $2, now(), $3, $4, $5)
        `,
        [
          randomUUID(),
          input.visitorKey,
          input.lastPath ?? null,
          input.userAgent ?? null,
          input.referrer ?? null,
        ]
      );

      await manager.query(
        `
          insert into site_visitors (
            id,
            visitor_key,
            first_seen_at,
            last_seen_at,
            entry_count,
            last_path,
            user_agent,
            referrer
          )
          values ($1, $2, now(), now(), 1, $3, $4, $5)
          on conflict (visitor_key)
          do update
          set
            last_seen_at = now(),
            entry_count = site_visitors.entry_count + 1,
            last_path = excluded.last_path,
            user_agent = excluded.user_agent,
            referrer = coalesce(excluded.referrer, site_visitors.referrer)
        `,
        [
          randomUUID(),
          input.visitorKey,
          input.lastPath ?? null,
          input.userAgent ?? null,
          input.referrer ?? null,
        ]
      );
    });
  }

  public async getSiteVisitorSummary(input?: {
    since?: Date | null;
    until?: Date | null;
  }): Promise<SiteVisitorSummary> {
    const dataSource = await getDataSource();
    const since = input?.since ?? null;
    const until = input?.until ?? null;
    const rows = await dataSource.query(
      `
        select
          (select count(*)::int from site_visitors) as total_visitors,
          (select coalesce(sum(entry_count), 0)::int from site_visitors) as total_entries,
          (select max(last_seen_at) from site_visitors) as last_visit_at,
          case
            when $1::timestamptz is null then 0
            else (
              select count(distinct visitor_key)::int
              from site_visit_events
              where visited_at >= $1
                and visited_at < coalesce($2::timestamptz, now())
            )
          end as visitors_since,
          case
            when $1::timestamptz is null then 0
            else (
              select count(*)::int
              from site_visit_events
              where visited_at >= $1
                and visited_at < coalesce($2::timestamptz, now())
            )
          end as entries_since,
          case
            when $1::timestamptz is null then 0
            else (
              select count(*)::int
              from site_visitors
              where first_seen_at >= $1
                and first_seen_at < coalesce($2::timestamptz, now())
            )
          end as new_visitors_since
      `,
      [since?.toISOString() ?? null, until?.toISOString() ?? null]
    );

    const row = rows[0] as VisitorSummaryRow | undefined;

    return {
      entriesSince: toNumber(row?.entries_since),
      lastVisitAt: toIso(row?.last_visit_at ?? null),
      newVisitorsSince: toNumber(row?.new_visitors_since),
      since: toIso(since),
      totalEntries: toNumber(row?.total_entries),
      totalVisitors: toNumber(row?.total_visitors),
      until: toIso(until),
      visitorsSince: toNumber(row?.visitors_since),
    };
  }

  private buildTopUsersQuery(sortBy: "comments" | "likes" | "reads" | "total_interactions") {
    const orderColumn =
      sortBy === "comments"
        ? "(comments + replies)"
        : sortBy === "likes"
          ? "(study_likes + comment_likes)"
          : sortBy === "reads"
            ? "reads"
            : "total_interactions";

    return `
      select
        users.id as user_id,
        users.name,
        users.role,
        users.avatar_url,
        coalesce(sum(case when events.kind = 'study_view' then 1 else 0 end), 0)::int as reads,
        coalesce(sum(case when events.kind = 'comment_created' then 1 else 0 end), 0)::int as comments,
        coalesce(sum(case when events.kind = 'comment_reply' then 1 else 0 end), 0)::int as replies,
        coalesce(sum(case when events.kind = 'study_like' then 1 else 0 end), 0)::int as study_likes,
        coalesce(sum(case when events.kind = 'comment_like' then 1 else 0 end), 0)::int as comment_likes,
        count(*)::int as total_interactions,
        max(events.created_at) as last_interaction_at
      from interaction_events events
      inner join users on users.id = events.actor_user_id
      group by users.id, users.name, users.role, users.avatar_url
      order by ${orderColumn} desc, last_interaction_at desc
      limit 6
    `;
  }
}
