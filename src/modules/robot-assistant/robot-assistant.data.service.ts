import { inject, injectable } from "tsyringe";
import { TOKENS } from "../../shared/container/tokens";
import { getDataSource } from "../../shared/infra/database/data-source";
import { IAboutRepository } from "../about/about.repository.interface";
import { UserRole } from "../auth/auth.types";
import { IEngagementRepository } from "../engagement/engagement.repository.interface";
import { IProjectRepository } from "../projects/project.repository.interface";
import { ProjectResponse } from "../projects/project.types";
import { normalizeUploadUrl } from "../uploads/upload-url";
import { IStudyRepository } from "../studies/study.repository.interface";
import {
  RobotAssistantAdminSnapshot,
  RobotAssistantAuthFriction,
  RobotAssistantContentPerformance,
  RobotAssistantReadingContext,
  RobotAssistantRequest,
  RobotAssistantRouteExit,
  RobotAssistantRouteTransition,
  RobotAssistantRouteUsage,
  RobotAssistantUserSnapshot,
  RobotAssistantWindowComparison,
} from "./robot-assistant.types";

type RouteUsageRow = {
  hits: number | string;
  path: string;
  visitors: number | string;
};

type RouteTransitionRow = {
  count: number | string;
  from_path: string;
  to_path: string;
};

type RouteExitRow = {
  exits: number | string;
  path: string;
};

type AuthFrictionRow = {
  attempts: number | string;
  completions: number | string;
  path: string;
};

type ContentPerformanceRow = {
  category: string;
  comments: number | string;
  likes: number | string;
  reading_time: number | string;
  slug: string;
  title: string;
  views: number | string;
};

type WindowMetricRow = {
  comments: number | string;
  likes: number | string;
  reads: number | string;
  unique_visitors: number | string;
  visits: number | string;
};

const toNumber = (value: number | string | null | undefined) => Number(value ?? 0);

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

const routeOrder = [
  "home",
  "studies",
  "study-post",
  "portfolio",
  "about",
  "login",
  "register",
  "profile",
  "admin",
];

const sortRouteUsage = (items: RobotAssistantRouteUsage[]) =>
  [...items].sort((left, right) => {
    const orderDelta = routeOrder.indexOf(left.path) - routeOrder.indexOf(right.path);

    if (routeOrder.includes(left.path) && routeOrder.includes(right.path) && orderDelta !== 0) {
      return orderDelta;
    }

    if (right.visitors !== left.visitors) {
      return right.visitors - left.visitors;
    }

    return right.hits - left.hits;
  });

const mapProject = (project: {
  backendUrl: string | null;
  frontendUrl: string | null;
  id: number;
  imageUrl: string;
  organizationName: string | null;
  projectDescription: string;
  projectHighlight: string | null;
  projectName: string;
  projectRole: string | null;
  projectStatus: "completed" | "in_progress";
  projectTags: string[];
  projectTrack: "personal" | "soujunior";
  videoUrl: string | null;
}): ProjectResponse => ({
  backend_url: project.backendUrl,
  frontend_url: project.frontendUrl,
  id: project.id,
  image_url: normalizeUploadUrl(project.imageUrl),
  organization_name: project.organizationName,
  project_desc: project.projectDescription,
  project_highlight: project.projectHighlight,
  project_name: project.projectName,
  project_role: project.projectRole,
  project_status: project.projectStatus,
  project_tags: Array.isArray(project.projectTags) ? project.projectTags : [],
  project_track: project.projectTrack,
  video_url: project.videoUrl,
});

const classifyCurrentPage = (path: string | null) => {
  if (!path || path === "/") {
    return "home";
  }

  if (path.startsWith("/studies/")) {
    return "study-post";
  }

  if (path === "/studies") {
    return "studies";
  }

  if (path === "/portfolio") {
    return "portfolio";
  }

  if (path === "/aboutme") {
    return "about";
  }

  if (path === "/login") {
    return "login";
  }

  if (path === "/register") {
    return "register";
  }

  if (path === "/profile") {
    return "profile";
  }

  if (path.startsWith("/admin/")) {
    return "admin";
  }

  return "unknown";
};

const normalizeReadingContext = (
  context: RobotAssistantReadingContext | null | undefined
): RobotAssistantReadingContext | null => {
  if (!context?.slug || !context.path || !context.lastSeenAt) {
    return null;
  }

  return {
    category: context.category ?? null,
    excerpt: context.excerpt ?? null,
    lastSeenAt: context.lastSeenAt,
    path: context.path,
    progress: typeof context.progress === "number" ? context.progress : null,
    readingTime: typeof context.readingTime === "number" ? context.readingTime : null,
    slug: context.slug,
    tags: Array.isArray(context.tags) ? context.tags : [],
    title: context.title ?? null,
  };
};

@injectable()
export class RobotAssistantDataService {
  constructor(
    @inject(TOKENS.EngagementRepository)
    private readonly engagementRepository: IEngagementRepository,
    @inject(TOKENS.StudyRepository)
    private readonly studyRepository: IStudyRepository,
    @inject(TOKENS.ProjectRepository)
    private readonly projectRepository: IProjectRepository,
    @inject(TOKENS.AboutRepository)
    private readonly aboutRepository: IAboutRepository
  ) {}

  public async getAdminSnapshot(input: {
    currentPath?: string | null;
  }): Promise<RobotAssistantAdminSnapshot> {
    const dataSource = await getDataSource();
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24);
    const fortyEightHoursAgo = new Date(now.getTime() - 1000 * 60 * 60 * 48);
    const sevenDaysAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7);

    const [
      analytics,
      studyDashboard,
      visitorSummary24h,
      visitorSummary7d,
      routeUsageRows,
      transitionRows,
      dropOffRows,
      authFrictionRows,
      contentPerformanceRows,
      currentWindowRows,
      previousWindowRows,
    ] = await Promise.all([
      this.engagementRepository.getAdminInteractionAnalytics(),
      this.studyRepository.getDashboardData(),
      this.engagementRepository.getSiteVisitorSummary({
        since: twentyFourHoursAgo,
        until: now,
      }),
      this.engagementRepository.getSiteVisitorSummary({
        since: sevenDaysAgo,
        until: now,
      }),
      dataSource.query(
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
        [sevenDaysAgo.toISOString()]
      ),
      dataSource.query(
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
        [sevenDaysAgo.toISOString()]
      ),
      dataSource.query(
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
        [sevenDaysAgo.toISOString()]
      ),
      dataSource.query(
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
        [sevenDaysAgo.toISOString()]
      ),
      dataSource.query(
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
        [sevenDaysAgo.toISOString()]
      ),
      dataSource.query(
        `
          select
            (select count(*)::int from site_visit_events where visited_at >= $1 and visited_at < $2) as visits,
            (select count(distinct visitor_key)::int from site_visit_events where visited_at >= $1 and visited_at < $2) as unique_visitors,
            (select count(*)::int from interaction_events where kind = 'study_view' and created_at >= $1 and created_at < $2) as reads,
            (select count(*)::int from interaction_events where kind in ('study_like', 'comment_like') and created_at >= $1 and created_at < $2) as likes,
            (select count(*)::int from interaction_events where kind in ('comment_created', 'comment_reply') and created_at >= $1 and created_at < $2) as comments
        `,
        [twentyFourHoursAgo.toISOString(), now.toISOString()]
      ),
      dataSource.query(
        `
          select
            (select count(*)::int from site_visit_events where visited_at >= $1 and visited_at < $2) as visits,
            (select count(distinct visitor_key)::int from site_visit_events where visited_at >= $1 and visited_at < $2) as unique_visitors,
            (select count(*)::int from interaction_events where kind = 'study_view' and created_at >= $1 and created_at < $2) as reads,
            (select count(*)::int from interaction_events where kind in ('study_like', 'comment_like') and created_at >= $1 and created_at < $2) as likes,
            (select count(*)::int from interaction_events where kind in ('comment_created', 'comment_reply') and created_at >= $1 and created_at < $2) as comments
        `,
        [fortyEightHoursAgo.toISOString(), twentyFourHoursAgo.toISOString()]
      ),
    ]);

    const routeUsage = sortRouteUsage(
      (routeUsageRows as RouteUsageRow[]).map(
        (row): RobotAssistantRouteUsage => ({
          hits: toNumber(row.hits),
          path: row.path,
          visitors: toNumber(row.visitors),
        })
      )
    );

    const routeTransitions = (transitionRows as RouteTransitionRow[]).map(
      (row): RobotAssistantRouteTransition => ({
        count: toNumber(row.count),
        fromPath: row.from_path,
        toPath: row.to_path,
      })
    );

    const dropOffs = (dropOffRows as RouteExitRow[]).map(
      (row): RobotAssistantRouteExit => ({
        exits: toNumber(row.exits),
        path: row.path,
      })
    );

    const authFriction = (authFrictionRows as AuthFrictionRow[]).map(
      (row): RobotAssistantAuthFriction => {
        const attempts = toNumber(row.attempts);
        const completions = toNumber(row.completions);

        return {
          attempts,
          completionRate: attempts ? completions / attempts : 0,
          completions,
          path: row.path,
        };
      }
    );

    const contentPerformance = (contentPerformanceRows as ContentPerformanceRow[]).map(
      (row): RobotAssistantContentPerformance => {
        const views = toNumber(row.views);
        const likes = toNumber(row.likes);
        const comments = toNumber(row.comments);

        return {
          category: row.category,
          comments,
          engagementRate: views ? (likes + comments * 2) / views : likes + comments * 2,
          engagementScore: views + likes * 4 + comments * 6,
          likes,
          readingTime: toNumber(row.reading_time),
          slug: row.slug,
          title: row.title,
          views,
        };
      }
    );

    const mapWindowComparison = (
      currentRows: unknown[],
      previousRows: unknown[]
    ): RobotAssistantWindowComparison => {
      const currentRow = currentRows[0] as WindowMetricRow | undefined;
      const previousRow = previousRows[0] as WindowMetricRow | undefined;

      return {
        current: {
          comments: toNumber(currentRow?.comments),
          likes: toNumber(currentRow?.likes),
          reads: toNumber(currentRow?.reads),
          uniqueVisitors: toNumber(currentRow?.unique_visitors),
          visits: toNumber(currentRow?.visits),
        },
        previous: {
          comments: toNumber(previousRow?.comments),
          likes: toNumber(previousRow?.likes),
          reads: toNumber(previousRow?.reads),
          uniqueVisitors: toNumber(previousRow?.unique_visitors),
          visits: toNumber(previousRow?.visits),
        },
      };
    };

    return {
      analytics,
      authFriction,
      contentPerformance,
      currentPath: input.currentPath ?? null,
      dropOffs,
      routeTransitions,
      routeUsage,
      studyDashboard: {
        recentComments: studyDashboard.recentComments,
        recentPosts: studyDashboard.recentPosts,
      },
      visitorSummary24h,
      visitorSummary7d,
      windowComparison24h: mapWindowComparison(currentWindowRows, previousWindowRows),
    };
  }

  public async getUserSnapshot(input: {
    currentPath?: string | null;
    currentStudySlug?: string | null;
    navigationContext?: RobotAssistantRequest["navigationContext"];
    userId?: string | null;
    userRole?: RobotAssistantProfile | null;
  }): Promise<RobotAssistantUserSnapshot> {
    const normalizedLastStudy = normalizeReadingContext(input.navigationContext?.lastStudy);
    const recentRoutes = Array.isArray(input.navigationContext?.recentRoutes)
      ? input.navigationContext!.recentRoutes!.filter(
          (route): route is { path: string; title?: string | null; visitedAt: string } =>
            Boolean(route?.path && route?.visitedAt)
        )
      : [];
    const currentPath = input.currentPath ?? null;
    const currentStudySlug =
      input.currentStudySlug ??
      (currentPath?.startsWith("/studies/") ? currentPath.replace("/studies/", "") : null);

    const [publishedStudies, currentStudy, projects, aboutPage] = await Promise.all([
      this.studyRepository.listPublishedStudies({}, input.userId ?? undefined),
      currentStudySlug
        ? this.studyRepository.getPublishedStudyDetailBySlug(currentStudySlug, input.userId ?? undefined)
        : Promise.resolve(null),
      this.projectRepository.findAll(),
      this.aboutRepository.getPage(),
    ]);

    const latestStudies = publishedStudies.slice(0, 6);
    const recommendedStudy = this.resolveRecommendedStudy({
      currentStudySlug,
      lastStudy: normalizedLastStudy,
      publishedStudies,
    });

    return {
      aboutPage,
      currentPageKind: classifyCurrentPage(currentPath),
      currentPath,
      currentStudy,
      featuredProjects: projects.slice(0, 4).map((project) =>
        mapProject({
          backendUrl: project.backendUrl,
          frontendUrl: project.frontendUrl,
          id: project.id,
          imageUrl: project.imageUrl,
          organizationName: project.organizationName,
          projectDescription: project.projectDescription,
          projectHighlight: project.projectHighlight,
          projectName: project.projectName,
          projectRole: project.projectRole,
          projectStatus: project.projectStatus,
          projectTags: Array.isArray(project.projectTags) ? project.projectTags : [],
          projectTrack: project.projectTrack,
          videoUrl: project.videoUrl,
        })
      ),
      latestStudies,
      lastStudy: normalizedLastStudy,
      recentRoutes,
      recommendedStudy,
    };
  }

  private resolveRecommendedStudy(input: {
    currentStudySlug?: string | null;
    lastStudy: RobotAssistantReadingContext | null;
    publishedStudies: Awaited<ReturnType<IStudyRepository["listPublishedStudies"]>>;
  }) {
    const eligibleStudies = input.publishedStudies.filter((study) => study.slug !== input.currentStudySlug);

    const byLastStudyAffinity =
      input.lastStudy &&
      eligibleStudies.find(
        (study) =>
          study.category === input.lastStudy?.category ||
          study.tags.some((tag) => input.lastStudy?.tags?.includes(tag))
      );

    return byLastStudyAffinity || eligibleStudies[0] || null;
  }
}
