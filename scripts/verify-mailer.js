require("dotenv").config();
const nodemailer = require("nodemailer");

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

const port = Number(process.env.NODEMAILER_PORT || 587);
const secure = readBoolean(process.env.NODEMAILER_SECURE, port === 465);
const requireTLS = readBoolean(process.env.NODEMAILER_REQUIRE_TLS, false);

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
  await transporter.verify();
  console.log("SMTP_OK");
})().catch((error) => {
  console.error("SMTP_VERIFY_FAILED");
  console.error(`code=${error.code || "unknown"}`);
  console.error(`responseCode=${error.responseCode || "unknown"}`);
  console.error(`message=${error.message}`);
  process.exit(1);
});
