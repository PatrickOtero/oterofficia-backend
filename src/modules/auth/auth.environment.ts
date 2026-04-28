export const isConfiguredAdminEmail = (email: string) =>
  email.toLowerCase() === process.env.ADMIN_EMAIL?.trim().toLowerCase();

export const resolveAuthSiteUrl = () =>
  (process.env.FRONTEND_APP_URL || process.env.PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

export const resolveAuthSenderAddress = () =>
  process.env.NODEMAILER_FROM || process.env.NODEMAILER_USER || "no-reply@oterofficia.local";
