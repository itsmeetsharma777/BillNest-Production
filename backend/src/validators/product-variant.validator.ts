import { z } from "zod";

const attributes = z.record(
  z.string().trim().min(1).max(60),
  z.string().trim().min(1).max(120),
).refine((value) => Object.keys(value).length > 0, "At least one variant attribute is required.");
const optionalText = (max: number) => z.string().trim().max(max).optional();
const money = z.number().nonnegative().finite();
const quantity = z.number().nonnegative().finite();

export const createProductVariantSchema = z.object({
  attributes,
  sku: optionalText(100),
  barcode: optionalText(100),
  purchasePrice: money,
  sellingPrice: money,
  stockQuantity: quantity.default(0),
  lowStockThreshold: quantity.default(5),
  warrantyPeriodMonths: z.number().int().min(0).max(1200).default(0),
  imageUrl: optionalText(2000),
});
export const updateProductVariantSchema = z.object({
  attributes: attributes.optional(),
  sku: optionalText(100),
  barcode: optionalText(100),
  purchasePrice: money.optional(),
  sellingPrice: money.optional(),
  lowStockThreshold: quantity.optional(),
  warrantyPeriodMonths: z.number().int().min(0).max(1200).optional(),
  imageUrl: optionalText(2000),
  isActive: z.boolean().optional(),
});
export const adjustProductVariantStockSchema = z.object({
  type: z.enum(["in", "out"]),
  quantity: z.number().positive().finite(),
  reason: z.string().trim().max(500).optional(),
});
export const productVariantListQuerySchema = z.object({
  isActive: z.enum(["true", "false", "all"]).default("true"),
  search: z.string().trim().max(100).optional(),
});
export type CreateProductVariantInput = z.infer<typeof createProductVariantSchema>;
export type UpdateProductVariantInput = z.infer<typeof updateProductVariantSchema>;
export type AdjustProductVariantStockInput = z.infer<typeof adjustProductVariantStockSchema>;
