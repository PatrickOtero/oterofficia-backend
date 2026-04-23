export type RobotAssistantRouteUsageRow = {
  hits: number | string;
  path: string;
  visitors: number | string;
};

export type RobotAssistantRouteTransitionRow = {
  count: number | string;
  from_path: string;
  to_path: string;
};

export type RobotAssistantRouteExitRow = {
  exits: number | string;
  path: string;
};

export type RobotAssistantAuthFrictionRow = {
  attempts: number | string;
  completions: number | string;
  path: string;
};

export type RobotAssistantContentPerformanceRow = {
  category: string;
  comments: number | string;
  likes: number | string;
  reading_time: number | string;
  slug: string;
  title: string;
  views: number | string;
};

export type RobotAssistantWindowMetricRow = {
  comments: number | string;
  likes: number | string;
  reads: number | string;
  unique_visitors: number | string;
  visits: number | string;
};

export interface IRobotAssistantRepository {
  getAuthFriction(since: Date): Promise<RobotAssistantAuthFrictionRow[]>;
  getContentPerformance(since: Date): Promise<RobotAssistantContentPerformanceRow[]>;
  getRouteExits(since: Date): Promise<RobotAssistantRouteExitRow[]>;
  getRouteTransitions(since: Date): Promise<RobotAssistantRouteTransitionRow[]>;
  getRouteUsage(since: Date): Promise<RobotAssistantRouteUsageRow[]>;
  getWindowMetrics(since: Date, until: Date): Promise<RobotAssistantWindowMetricRow | null>;
}
