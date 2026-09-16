import { z } from "zod";

export const dashboardQuerySchema = z.object({
  recentLimit: z.coerce
    .number()
    .int()
    .min(1)
    .max(10)
    .default(5),
});