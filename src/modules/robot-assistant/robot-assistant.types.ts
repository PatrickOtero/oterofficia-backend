import { UserRole } from "../auth/auth.types";
import { ProjectResponse } from "../projects/project.types";
import { AboutPage } from "../about/about.types";
import { StudyDetail, StudySummary } from "../studies/study.types";
import { InteractionAnalyticsData, SiteVisitorSummary } from "../engagement/engagement.types";

export type RobotAssistantProfile = UserRole;

export type RobotAssistantAction =
  | {
      id: string;
      kind: "prompt";
      label: string;
      prompt: string;
    }
  | {
      id: string;
      kind: "navigate";
      label: string;
      path: string;
    };

export type RobotAssistantResponse = {
  actions: RobotAssistantAction[];
  intent: string;
  profile: RobotAssistantProfile;
  reply: string;
};

export type RobotAssistantNavigationEntry = {
  path: string;
  title?: string | null;
  visitedAt: string;
};

export type RobotAssistantReadingContext = {
  category?: string | null;
  excerpt?: string | null;
  lastSeenAt: string;
  path: string;
  progress?: number | null;
  readingTime?: number | null;
  slug: string;
  tags?: string[];
  title?: string | null;
};

export type RobotAssistantRequest = {
  currentPath?: string | null;
  currentStudySlug?: string | null;
  navigationContext?: {
    lastStudy?: RobotAssistantReadingContext | null;
    recentRoutes?: RobotAssistantNavigationEntry[];
  } | null;
  prompt?: string | null;
};

export type RobotAssistantRouteUsage = {
  hits: number;
  path: string;
  visitors: number;
};

export type RobotAssistantRouteTransition = {
  count: number;
  fromPath: string;
  toPath: string;
};

export type RobotAssistantRouteExit = {
  exits: number;
  path: string;
};

export type RobotAssistantAuthFriction = {
  attempts: number;
  completionRate: number;
  completions: number;
  path: string;
};

export type RobotAssistantContentPerformance = {
  category: string;
  comments: number;
  engagementRate: number;
  engagementScore: number;
  likes: number;
  readingTime: number;
  slug: string;
  title: string;
  views: number;
};

export type RobotAssistantWindowMetric = {
  comments: number;
  likes: number;
  reads: number;
  uniqueVisitors: number;
  visits: number;
};

export type RobotAssistantWindowComparison = {
  current: RobotAssistantWindowMetric;
  previous: RobotAssistantWindowMetric;
};

export type RobotAssistantAdminSnapshot = {
  analytics: InteractionAnalyticsData;
  authFriction: RobotAssistantAuthFriction[];
  contentPerformance: RobotAssistantContentPerformance[];
  currentPath: string | null;
  dropOffs: RobotAssistantRouteExit[];
  routeTransitions: RobotAssistantRouteTransition[];
  routeUsage: RobotAssistantRouteUsage[];
  studyDashboard: {
    recentComments: Array<{
      authorName: string;
      content: string;
      createdAt: string;
      id: string;
      postId: string;
      postTitle: string;
    }>;
    recentPosts: StudySummary[];
  };
  visitorSummary24h: SiteVisitorSummary;
  visitorSummary7d: SiteVisitorSummary;
  windowComparison24h: RobotAssistantWindowComparison;
};

export type RobotAssistantUserSnapshot = {
  aboutPage: AboutPage | null;
  currentPageKind: string;
  currentPath: string | null;
  currentStudy: StudyDetail | null;
  featuredProjects: ProjectResponse[];
  latestStudies: StudySummary[];
  lastStudy: RobotAssistantReadingContext | null;
  recentRoutes: RobotAssistantNavigationEntry[];
  recommendedStudy: StudySummary | null;
};
