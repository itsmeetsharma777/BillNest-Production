import { z } from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid ID.");

export const notificationListQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),

  unreadOnly: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .default(false),
});

export const notificationIdParamSchema = z.object({
  notificationId: objectIdSchema,
});