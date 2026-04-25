import type { DependencyContainer } from "tsyringe";
import { CloudflareR2StorageProvider } from "../../../modules/uploads/storage/cloudflare-r2-storage.provider";
import { LocalStorageProvider } from "../../../modules/uploads/storage/local-storage.provider";
import { NodemailerService } from "../../../services/nodemailer";
import { registerSingletonBindings } from "../registerSingletonBindings";
import { TOKENS } from "../tokens";

const providerBindings = [
  [TOKENS.MailService, NodemailerService],
  [TOKENS.LocalStorageProvider, LocalStorageProvider],
  [TOKENS.CloudflareR2StorageProvider, CloudflareR2StorageProvider],
] as const;

export const registerProviderBindings = (container: DependencyContainer) => {
  registerSingletonBindings(container, providerBindings);
};
