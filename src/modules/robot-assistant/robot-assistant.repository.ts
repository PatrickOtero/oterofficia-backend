import { injectable } from "tsyringe";
import { getDataSource } from "../../shared/infra/database/data-source";
import type {
  IRobotAssistantRepository,
  RobotAssistantAuthFrictionRow,
  RobotAssistantContentPerformanceRow,
  RobotAssistantRouteExitRow,
  RobotAssistantRouteTransitionRow,
  RobotAssistantRouteUsageRow,
  RobotAssistantWindowMetricRow,
} from "./robot-assistant.repository.interface";

const normalizeRoutePathSql = (fieldName: string) => `
  case
    when ${fieldName} is null or ${fieldName} = '' then 'unknown'
    when ${fieldName} = '/' then 'home'
    when ${fieldName} like '/studies/%' then 'study-post'
    when ${fieldName} = '/studies' then 'studies'
    when ${fieldName} = '/portfolio' then 'portfolio'
    when ${fieldName} = '/aboutme' then 'about'
    when ${fieldName} = '/login' then 'login'
    when ${fieldName} = '/register' then 'register'
    when ${fieldName} = '/forgot-password' then 'forgot-password'
    when ${fieldName} = '/reset-password' then 'reset-password'
    when ${fieldName} = '/profile' then 'profile'
    when ${fieldName} like '/admin/%' then 'admin'
    else ${fieldName}
  end
`;

@injectable()
export class RobotAssistantRepository implements IRobotAssistantRepository {
  public async getAuthFriction(since: Date): Promise<RobotAssistantAuthFrictionRow[]> {
    const dataSource = await getDataSource();

    return dataSource.query(
      `
        with auth_entries as (
          select
            visitor_key,
            visited_at,
            ${normalizeRoutePathSql("path")} as path
          from site_visit_events
          where visited_at >= $1
            and path in ('/login', '/register')
        )
        select
          path,
          count(distinct visitor_key)::int as attempts,
          count(
            distinct case
              when exists (
                select 1
                from site_visit_events future_routes
                where future_routes.visitor_key = auth_entries.visitor_key
                  and future_routes.visited_at > auth_entries.visited_at
                  and future_routes.visited_at <= auth_entries.visited_at + interval '30 minutes'
                  and (
                    future_routes.path = '/profile'
                    or future_routes.path like '/admin/%'
                  )
              ) then visitor_key
            end
          )::int as completions
        from auth_entries
        group by path
        order by attempts desc
      `,
      [since.toISOString()]
    );
  }

  public async getContentPerformance(
    since: Date
  ): Promise<RobotAssistantContentPerformanceRow[]> {
    const dataSource = await getDataSource();

    return dataSource.query(
      `
        select
          posts.title,
          posts.slug,
          posts.category,
          posts.reading_time,
          coalesce(sum(case when events.kind = 'study_view' then 1 else 0 end), 0)::int as views,
          coalesce(sum(case when events.kind = 'study_like' then 1 else 0 end), 0)::int as likes,
          coalesce(sum(case when events.kind in ('comment_created', 'comment_reply') then 1 else 0 end), 0)::int as comments
        from study_posts posts
        left join interaction_events events on events.study_post_id = posts.id
          and events.created_at >= $1
        where posts.status = 'published'
        group by posts.id
        order by views desc, likes desc, comments desc, posts.published_at desc nulls last
        limit 12
      `,
      [since.toISOString()]
    );
  }

  public async getRouteExits(since: Date): Promise<RobotAssistantRouteExitRow[]> {
    const dataSource = await getDataSource();

    return dataSource.query(
      `
        with ordered_routes as (
          select
            visitor_key,
            visited_at,
            ${normalizeRoutePathSql("path")} as path,
            lead(visited_at) over (
              partition by visitor_key
              order by visited_at asc
            ) as next_visited_at
          from site_visit_events
          where visited_at >= $1
        )
        select
          path,
          count(*)::int as exits
        from ordered_routes
        where next_visited_at is null
           or next_visited_at > visited_at + interval '30 minutes'
        group by path
        order by exits desc
        limit 10
      `,
      [since.toISOString()]
    );
  }

  public async getRouteTransitions(
    since: Date
  ): Promise<RobotAssistantRouteTransitionRow[]> {
    const dataSource = await getDataSource();

    return dataSource.query(
      `
        with ordered_routes as (
          select
            visitor_key,
            visited_at,
            ${normalizeRoutePathSql("path")} as from_path,
            lead(${normalizeRoutePathSql("path")}) over (
              partition by visitor_key
              order by visited_at asc
            ) as to_path,
            lead(visited_at) over (
              partition by visitor_key
              order by visited_at asc
            ) as next_visited_at
          from site_visit_events
          where visited_at >= $1
        )
        select
          from_path,
          to_path,
          count(*)::int as count
        from ordered_routes
        where to_path is not null
          and from_path != to_path
          and next_visited_at <= visited_at + interval '30 minutes'
        group by from_path, to_path
        order by count desc
        limit 10
      `,
      [since.toISOString()]
    );
  }

  public async getRouteUsage(since: Date): Promise<RobotAssistantRouteUsageRow[]> {
    const dataSource = await getDataSource();

    return dataSource.query(
      `
        with recent_routes as (
          select
            ${normalizeRoutePathSql("path")} as path,
            visitor_key
          from site_visit_events
          where visited_at >= $1
        )
        select
          path,
          count(*)::int as hits,
          count(distinct visitor_key)::int as visitors
        from recent_routes
        group by path
        order by visitors desc, hits desc
        limit 12
      `,
      [since.toISOString()]
    );
  }

  public async getWindowMetrics(
    since: Date,
    until: Date
  ): Promise<RobotAssistantWindowMetricRow | null> {
    const dataSource = await getDataSource();
    const rows = await dataSource.query(
      `
        select
          (select count(*)::int from site_visit_events where visited_at >= $1 and visited_at < $2) as visits,
          (select count(distinct visitor_key)::int from site_visit_events where visited_at >= $1 and visited_at < $2) as unique_visitors,
          (select count(*)::int from interaction_events where kind = 'study_view' and created_at >= $1 and created_at < $2) as reads,
          (select count(*)::int from interaction_events where kind in ('study_like', 'comment_like') and created_at >= $1 and created_at < $2) as likes,
          (select count(*)::int from interaction_events where kind in ('comment_created', 'comment_reply') and created_at >= $1 and created_at < $2) as comments
      `,
      [since.toISOString(), until.toISOString()]
    );

    return (rows[0] as RobotAssistantWindowMetricRow | undefined) ?? null;
  }
}
