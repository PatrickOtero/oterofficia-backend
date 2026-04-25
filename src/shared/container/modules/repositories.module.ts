import type { DependencyContainer } from "tsyringe";
import { AboutRepository } from "../../../modules/about/about.repository";
import { AuthRepository } from "../../../modules/auth/auth.repository";
import { CommentRepository } from "../../../modules/comments/comment.repository";
import { EngagementRepository } from "../../../modules/engagement/engagement.repository";
import { LikeRepository } from "../../../modules/likes/like.repository";
import { ProjectRepository } from "../../../modules/projects/project.repository";
import { RobotAssistantRepository } from "../../../modules/robot-assistant/robot-assistant.repository";
import { StudyRepository } from "../../../modules/studies/study.repository";
import { UploadRepository } from "../../../modules/uploads/upload.repository";
import { registerSingletonBindings } from "../registerSingletonBindings";
import { TOKENS } from "../tokens";

const repositoryBindings = [
  [TOKENS.AboutRepository, AboutRepository],
  [TOKENS.AuthRepository, AuthRepository],
  [TOKENS.StudyRepository, StudyRepository],
  [TOKENS.CommentRepository, CommentRepository],
  [TOKENS.EngagementRepository, EngagementRepository],
  [TOKENS.LikeRepository, LikeRepository],
  [TOKENS.ProjectRepository, ProjectRepository],
  [TOKENS.RobotAssistantRepository, RobotAssistantRepository],
  [TOKENS.UploadRepository, UploadRepository],
] as const;

export const registerRepositoryBindings = (container: DependencyContainer) => {
  registerSingletonBindings(container, repositoryBindings);
};
