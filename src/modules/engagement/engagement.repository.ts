import { randomUUID } from "crypto";
import { singleton } from "tsyringe";
import { getDataSource } from "../../shared/infra/database/data-source";
import { InteractionEventEntity } from "../../shared/infra/database/entities/InteractionEventEntity";
import { NotificationEntity } from "../../shared/infra/database/entities/NotificationEntity";
import { StudyPostCommentEntity } from "../../shared/infra/database/entities/StudyPostCommentEntity";
import { UserEntity } from "../../shared/infra/database/entities/UserEntity";
import {
  activitySeriesQuery,
  adminInteractionOverviewQuery,
  buildTopUsersQuery,
  interactionMixQuery,
  recentActivityQuery,
} from "./engagement.analytics.queries";
import {
  mapAdminInteractionAnalytics,
  mapNotificationItem,
  mapRecipient,
  mapSiteVisitorSummary,
} from "./engagement.repository.mappers";
import { IEngagementRepository } from "./engagement.repository.interface";
import type {
  MixRow,
  OverviewRow,
  RecentActivityRow,
  SeriesRow,
  UserAggregateRow,
  VisitorSummaryRow,
} from "./engagement.repository.rows";
import {
  CreateInteractionEventInput,
  CreateNotificationInput,
  EngagementInteractionKind,
  InteractionAnalyticsData,
  NotificationFeed,
  SiteVisitorSummary,
  SiteVisitorTrackInput,
} from "./engagement.types";

@singleton()
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
        dataSource.query(adminInteractionOverviewQuery),
        dataSource.query(buildTopUsersQuery("total_interactions")),
        dataSource.query(buildTopUsersQuery("reads")),
        dataSource.query(buildTopUsersQuery("comments")),
        dataSource.query(buildTopUsersQuery("likes")),
        dataSource.query(interactionMixQuery),
        dataSource.query(activitySeriesQuery),
        dataSource.query(recentActivityQuery),
      ]);

    return mapAdminInteractionAnalytics({
      mixRows: mixRows as MixRow[],
      overviewRow: overviewRows[0] as OverviewRow | undefined,
      recentRows: recentRows as RecentActivityRow[],
      seriesRows: seriesRows as SeriesRow[],
      topCommentersRows: topCommentersRows as UserAggregateRow[],
      topLikersRows: topLikersRows as UserAggregateRow[],
      topReadersRows: topReadersRows as UserAggregateRow[],
      topUsersRows: topUsersRows as UserAggregateRow[],
    });
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

    return {
      items: notifications.map(mapNotificationItem),
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

    return mapSiteVisitorSummary(rows[0] as VisitorSummaryRow | undefined, { since, until });
  }
}
