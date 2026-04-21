require("dotenv").config();
const fs = require("fs");
const nodemailer = require("nodemailer");
const path = require("path");

const REQUIRED_ENV_VARS = [
  "NODEMAILER_HOST",
  "NODEMAILER_USER",
  "NODEMAILER_PASS",
];

const MAIL_VIEW_PATH_CANDIDATES = [
  path.resolve(process.cwd(), "views"),
  path.resolve(process.cwd(), "src/views"),
];

const readBoolean = (value, fallback) => {
  if (!value) {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return fallback;
};

const missingVariables = REQUIRED_ENV_VARS.filter(
  (envName) => !String(process.env[envName] || "").trim()
);
const port = Number(process.env.NODEMAILER_PORT || 587);
const secure = readBoolean(process.env.NODEMAILER_SECURE, port === 465);
const requireTLS = readBoolean(process.env.NODEMAILER_REQUIRE_TLS, false);
const resolvedViewPath = MAIL_VIEW_PATH_CANDIDATES.find((candidate) => fs.existsSync(candidate));

if (missingVariables.length) {
  console.error("MAIL_CONFIG_INVALID");
  console.error(`missing=${missingVariables.join(",")}`);
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  auth: {
    pass: process.env.NODEMAILER_PASS,
    user: process.env.NODEMAILER_USER,
  },
  host: process.env.NODEMAILER_HOST,
  port,
  requireTLS,
  secure,
});

(async () => {
  if (resolvedViewPath) {
    console.log(`MAIL_VIEWS_OK path=${resolvedViewPath}`);
  } else {
    console.warn(`MAIL_VIEWS_MISSING searched=${MAIL_VIEW_PATH_CANDIDATES.join(";")}`);
  }

  await transporter.verify();
  console.log("SMTP_OK");
})().catch((error) => {
  console.error("SMTP_VERIFY_FAILED");
  console.error(`code=${error.code || "unknown"}`);
  console.error(`responseCode=${error.responseCode || "unknown"}`);
  console.error(`message=${error.message}`);
  process.exit(1);
});
