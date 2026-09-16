import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum([
      "development",
      "test",
      "production",
    ])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(5000),

  MONGODB_URI: z.string().min(
    1,
    "MONGODB_URI is required",
  ),

  FRONTEND_URL: z
    .string()
    .url()
    .default(
      "http://localhost:5173",
    ),

  COOKIE_DOMAIN:
    z.string().optional(),

  SESSION_SECRET: z
    .string()
    .min(
      32,
      "SESSION_SECRET must be at least 32 characters",
    ),

  RESEND_API_KEY:
    z.string().optional(),

  EMAIL_FROM:
    z.string().optional(),

  CLOUDINARY_CLOUD_NAME:
    z.string().optional(),

  CLOUDINARY_API_KEY:
    z.string().optional(),

  CLOUDINARY_API_SECRET:
    z.string().optional(),
});

const parsedEnv =
  envSchema.safeParse(
    process.env,
  );

if (!parsedEnv.success) {
  console.error(
    "Invalid environment variables:",
  );

  console.error(
    parsedEnv.error.flatten()
      .fieldErrors,
  );

  process.exit(1);
}

export const env =
  parsedEnv.data;