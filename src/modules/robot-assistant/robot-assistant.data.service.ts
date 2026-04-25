import { inject, singleton } from "tsyringe";
import { TOKENS } from "../../shared/container/tokens";
import { IAboutRepository } from "../about/about.repository.interface";
import { IEngagementRepository } from "../engagement/engagement.repository.interface";
import { IProjectRepository } from "../projects/project.repository.interface";
import { ProjectResponse } from "../projects/project.types";
import { IRobotAssistantRepository, RobotAssistantWindowMetricRow } from "./robot-assistant.repository.interface";
import { normalizeUploadUrl } from "../uploads/upload-url";
import { IStudyRepository } from "../studies/study.repository.interface";
import {
  RobotAssistantAdminSnapshot,
  RobotAssistantAuthFriction,
  RobotAssistantContentPerformance,
  RobotAssistantProfile,
  RobotAssistantReadingContext,
  RobotAssistantRequest,
  RobotAssistantRouteExit,
  RobotAssistantRouteTransition,
  RobotAssistantRouteUsage,
  RobotAssistantUserSnapshot,
  RobotAssistantWindowComparison,
} from "./robot-assistant.types";

const toNumber = (value: number | string | null | undefined) => Number(value ?? 0);

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

@singleton()
export class RobotAssistantDataService {
  constructor(
    @inject(TOKENS.EngagementRepository)
    private readonly engagementRepository: IEngagementRepository,
    @inject(TOKENS.StudyRepository)
    private readonly studyRepository: IStudyRepository,
    @inject(TOKENS.ProjectRepository)
    private readonly projectRepository: IProjectRepository,
    @inject(TOKENS.AboutRepository)
    private readonly aboutRepository: IAboutRepository,
    @inject(TOKENS.RobotAssistantRepository)
    private readonly robotAssistantRepository: IRobotAssistantRepository
  ) {}

  public async getAdminSnapshot(input: {
    currentPath?: string | null;
  }): Promise<RobotAssistantAdminSnapshot> {
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
      this.robotAssistantRepository.getRouteUsage(sevenDaysAgo),
      this.robotAssistantRepository.getRouteTransitions(sevenDaysAgo),
      this.robotAssistantRepository.getRouteExits(sevenDaysAgo),
      this.robotAssistantRepository.getAuthFriction(sevenDaysAgo),
      this.robotAssistantRepository.getContentPerformance(sevenDaysAgo),
      this.robotAssistantRepository.getWindowMetrics(twentyFourHoursAgo, now),
      this.robotAssistantRepository.getWindowMetrics(fortyEightHoursAgo, twentyFourHoursAgo),
    ]);

    const routeUsage = sortRouteUsage(
      routeUsageRows.map(
        (row): RobotAssistantRouteUsage => ({
          hits: toNumber(row.hits),
          path: row.path,
          visitors: toNumber(row.visitors),
        })
      )
    );

    const routeTransitions = transitionRows.map(
      (row): RobotAssistantRouteTransition => ({
        count: toNumber(row.count),
        fromPath: row.from_path,
        toPath: row.to_path,
      })
    );

    const dropOffs = dropOffRows.map(
      (row): RobotAssistantRouteExit => ({
        exits: toNumber(row.exits),
        path: row.path,
      })
    );

    const authFriction = authFrictionRows.map(
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

    const contentPerformance = contentPerformanceRows.map(
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
      currentRow: RobotAssistantWindowMetricRow | null,
      previousRow: RobotAssistantWindowMetricRow | null
    ): RobotAssistantWindowComparison => {
      return {
        current: {
          comments: toNumber(currentRow?.comments ?? 0),
          likes: toNumber(currentRow?.likes ?? 0),
          reads: toNumber(currentRow?.reads ?? 0),
          uniqueVisitors: toNumber(currentRow?.unique_visitors ?? 0),
          visits: toNumber(currentRow?.visits ?? 0),
        },
        previous: {
          comments: toNumber(previousRow?.comments ?? 0),
          likes: toNumber(previousRow?.likes ?? 0),
          reads: toNumber(previousRow?.reads ?? 0),
          uniqueVisitors: toNumber(previousRow?.unique_visitors ?? 0),
          visits: toNumber(previousRow?.visits ?? 0),
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
