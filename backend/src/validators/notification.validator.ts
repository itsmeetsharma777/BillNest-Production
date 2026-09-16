import { z } from "zod";

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
  notificationId: z.string().min(1),
});