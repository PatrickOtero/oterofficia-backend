type TopUsersSort = "comments" | "likes" | "reads" | "total_interactions";

const topUsersOrderColumn: Record<TopUsersSort, string> = {
  comments: "comments_and_replies",
  likes: "all_likes",
  reads: "reads",
  total_interactions: "total_interactions",
};

export const adminInteractionOverviewQuery = `
  select
    count(*)::int as total_events,
    count(distinct actor_user_id)::int as tracked_users,
    coalesce(sum(case when kind = 'study_view' then 1 else 0 end), 0)::int as total_reads,
    coalesce(sum(case when kind = 'study_like' then 1 else 0 end), 0)::int as total_study_likes,
    coalesce(sum(case when kind = 'comment_created' then 1 else 0 end), 0)::int as total_comments,
    coalesce(sum(case when kind = 'comment_reply' then 1 else 0 end), 0)::int as total_replies,
    coalesce(sum(case when kind = 'comment_like' then 1 else 0 end), 0)::int as total_comment_likes
  from interaction_events
`;

export const interactionMixQuery = `
  select
    kind,
    count(*)::int as count
  from interaction_events
  group by kind
  order by count desc, kind asc
`;

export const activitySeriesQuery = `
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
`;

export const recentActivityQuery = `
  select
    events.id,
    events.kind,
    events.created_at,
    coalesce(users.name, 'Usuário removido') as actor_name,
    coalesce(users.role, 'user') as actor_role,
    posts.title as post_title
  from interaction_events events
  left join users on users.id = events.actor_user_id
  left join study_posts posts on posts.id = events.study_post_id
  order by events.created_at desc
  limit 12
`;

export const buildTopUsersQuery = (sortBy: TopUsersSort) => `
  select *
  from (
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
      (
        coalesce(sum(case when events.kind = 'comment_created' then 1 else 0 end), 0) +
        coalesce(sum(case when events.kind = 'comment_reply' then 1 else 0 end), 0)
      )::int as comments_and_replies,
      (
        coalesce(sum(case when events.kind = 'study_like' then 1 else 0 end), 0) +
        coalesce(sum(case when events.kind = 'comment_like' then 1 else 0 end), 0)
      )::int as all_likes,
      count(*)::int as total_interactions,
      max(events.created_at) as last_interaction_at
    from interaction_events events
    inner join users on users.id = events.actor_user_id
    group by users.id, users.name, users.role, users.avatar_url
  ) ranked_users
  order by ${topUsersOrderColumn[sortBy]} desc, last_interaction_at desc
  limit 6
`;
