import { z } from "zod";

export const bulkProductStatusSchema = z.object({
  productIds: z.array(z.string().regex(/^[a-f\d]{24}$/i, "Invalid product ID.")).min(1).max(500),
  action: z.enum(["activate", "deactivate"]),
});

export const productImportSchema = z.object({
  csv: z.string().min(1).max(2 * 1024 * 1024),
});
