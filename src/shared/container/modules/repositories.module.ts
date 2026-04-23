import type { DependencyContainer } from "tsyringe";
import { AboutRepository } from "../../../modules/about/about.repository";
import { IAboutRepository } from "../../../modules/about/about.repository.interface";
import { AuthRepository } from "../../../modules/auth/auth.repository";
import { IAuthRepository } from "../../../modules/auth/auth.repository.interface";
import { CommentRepository } from "../../../modules/comments/comment.repository";
import { ICommentRepository } from "../../../modules/comments/comment.repository.interface";
import { EngagementRepository } from "../../../modules/engagement/engagement.repository";
import { IEngagementRepository } from "../../../modules/engagement/engagement.repository.interface";
import { LikeRepository } from "../../../modules/likes/like.repository";
import { ILikeRepository } from "../../../modules/likes/like.repository.interface";
import { ProjectRepository } from "../../../modules/projects/project.repository";
import { IProjectRepository } from "../../../modules/projects/project.repository.interface";
import { RobotAssistantRepository } from "../../../modules/robot-assistant/robot-assistant.repository";
import { IRobotAssistantRepository } from "../../../modules/robot-assistant/robot-assistant.repository.interface";
import { StudyRepository } from "../../../modules/studies/study.repository";
import { IStudyRepository } from "../../../modules/studies/study.repository.interface";
import { UploadRepository } from "../../../modules/uploads/upload.repository";
import { IUploadRepository } from "../../../modules/uploads/upload.repository.interface";
import { TOKENS } from "../tokens";

export const registerRepositoryBindings = (container: DependencyContainer) => {
  container.registerSingleton<IAboutRepository>(TOKENS.AboutRepository, AboutRepository);
  container.registerSingleton<IAuthRepository>(TOKENS.AuthRepository, AuthRepository);
  container.registerSingleton<IStudyRepository>(TOKENS.StudyRepository, StudyRepository);
  container.registerSingleton<ICommentRepository>(TOKENS.CommentRepository, CommentRepository);
  container.registerSingleton<IEngagementRepository>(TOKENS.EngagementRepository, EngagementRepository);
  container.registerSingleton<ILikeRepository>(TOKENS.LikeRepository, LikeRepository);
  container.registerSingleton<IProjectRepository>(TOKENS.ProjectRepository, ProjectRepository);
  container.registerSingleton<IRobotAssistantRepository>(
    TOKENS.RobotAssistantRepository,
    RobotAssistantRepository
  );
  container.registerSingleton<IUploadRepository>(TOKENS.UploadRepository, UploadRepository);
};
