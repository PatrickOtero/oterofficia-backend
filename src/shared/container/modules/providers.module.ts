import type { DependencyContainer } from "tsyringe";
import { CloudflareR2StorageProvider } from "../../../modules/uploads/storage/cloudflare-r2-storage.provider";
import { LocalStorageProvider } from "../../../modules/uploads/storage/local-storage.provider";
import { IMailService } from "../../../services/mail.service.interface";
import { NodemailerService } from "../../../services/nodemailer";
import { TOKENS } from "../tokens";

export const registerProviderBindings = (container: DependencyContainer) => {
  container.registerSingleton<IMailService>(TOKENS.MailService, NodemailerService);
  container.registerSingleton(TOKENS.LocalStorageProvider, LocalStorageProvider);
  container.registerSingleton(TOKENS.CloudflareR2StorageProvider, CloudflareR2StorageProvider);
};
