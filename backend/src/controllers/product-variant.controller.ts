import type { Response } from "express";
import mongoose from "mongoose";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ApiError } from "../utils/api-error";
import { adjustProductVariantStockForOwner, createProductVariantForOwner, deleteProductVariantForOwner, getProductVariantByBarcodeForOwner, getProductVariantsForOwner, updateProductVariantForOwner } from "../services/product-variant.service";
import { adjustProductVariantStockSchema, createProductVariantSchema, productVariantListQuerySchema, updateProductVariantSchema } from "../validators/product-variant.validator";

function id(value: unknown, message: string) { if (typeof value !== "string" || !mongoose.isValidObjectId(value)) throw new ApiError(400, message, "INVALID_ID"); return value; }
export async function listVariants(req: AuthenticatedRequest, res: Response) {
  const productId = id(req.params.productId, "Invalid product ID.");
  const query = productVariantListQuerySchema.parse(req.query);
  const variants = await getProductVariantsForOwner(req.user.id, productId, { isActive: query.isActive === "all" ? undefined : query.isActive === "true", search: query.search });
  res.json({ success: true, data: { variants } });
}
export async function createVariant(req: AuthenticatedRequest, res: Response) {
  const productId = id(req.params.productId, "Invalid product ID.");
  const variant = await createProductVariantForOwner(req.user.id, productId, createProductVariantSchema.parse(req.body));
  res.status(201).json({ success: true, message: "Product variant created successfully.", data: { variant } });
}
export async function updateVariant(req: AuthenticatedRequest, res: Response) {
  const productId = id(req.params.productId, "Invalid product ID.");
  const variantId = id(req.params.variantId, "Invalid variant ID.");
  const variant = await updateProductVariantForOwner(req.user.id, productId, variantId, updateProductVariantSchema.parse(req.body));
  res.json({ success: true, message: "Product variant updated successfully.", data: { variant } });
}
export async function deleteVariant(req: AuthenticatedRequest, res: Response) {
  const productId = id(req.params.productId, "Invalid product ID.");
  const variantId = id(req.params.variantId, "Invalid variant ID.");
  const variant = await deleteProductVariantForOwner(req.user.id, productId, variantId);
  res.json({ success: true, message: "Product variant deactivated successfully.", data: { variant } });
}
export async function adjustVariantStock(req: AuthenticatedRequest, res: Response) {
  const productId = id(req.params.productId, "Invalid product ID.");
  const variantId = id(req.params.variantId, "Invalid variant ID.");
  const result = await adjustProductVariantStockForOwner(req.user.id, productId, variantId, adjustProductVariantStockSchema.parse(req.body));
  res.json({ success: true, message: "Variant stock updated successfully.", data: result });
}
export async function getVariantByBarcode(req: AuthenticatedRequest, res: Response) {
  const barcode = String(req.params.barcode ?? "").trim();
  if (!barcode) throw new ApiError(400, "Barcode is required.", "BARCODE_REQUIRED");
  const variant = await getProductVariantByBarcodeForOwner(req.user.id, barcode);
  res.json({ success: true, data: { variant } });
}
