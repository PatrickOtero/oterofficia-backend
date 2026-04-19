import { container } from "tsyringe";
import { AuthRepository } from "../../modules/auth/auth.repository";
import { CommentRepository } from "../../modules/comments/comment.repository";
import { LikeRepository } from "../../modules/likes/like.repository";
import { ProjectRepository } from "../../modules/projects/project.repository";
import { StudyRepository } from "../../modules/studies/study.repository";
import { CloudflareR2StorageProvider } from "../../modules/uploads/storage/cloudflare-r2-storage.provider";
import { LocalStorageProvider } from "../../modules/uploads/storage/local-storage.provider";
import { NodemailerService } from "../../services/nodemailer";
import { IAuthRepository } from "../../modules/auth/auth.repository.interface";
import { ICommentRepository } from "../../modules/comments/comment.repository.interface";
import { ILikeRepository } from "../../modules/likes/like.repository.interface";
import { IProjectRepository } from "../../modules/projects/project.repository.interface";
import { IStudyRepository } from "../../modules/studies/study.repository.interface";
import { IMailService } from "../../services/mail.service.interface";
import { TOKENS } from "./tokens";

container.registerSingleton<IAuthRepository>(TOKENS.AuthRepository, AuthRepository);
container.registerSingleton<IStudyRepository>(TOKENS.StudyRepository, StudyRepository);
container.registerSingleton<ICommentRepository>(TOKENS.CommentRepository, CommentRepository);
container.registerSingleton<ILikeRepository>(TOKENS.LikeRepository, LikeRepository);
container.registerSingleton<IProjectRepository>(TOKENS.ProjectRepository, ProjectRepository);
container.registerSingleton<IMailService>(TOKENS.MailService, NodemailerService);
container.registerSingleton(TOKENS.LocalStorageProvider, LocalStorageProvider);
container.registerSingleton(TOKENS.CloudflareR2StorageProvider, CloudflareR2StorageProvider);

export { container };
