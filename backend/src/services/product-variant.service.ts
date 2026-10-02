import mongoose from "mongoose";
import { ApiError } from "../utils/api-error";
import { createInventoryMovement } from "../repositories/inventory-movement.repository";
import { getShopForOwner } from "./shop.service";
import { updateProductByIdForShop } from "../repositories/product.repository";
import { findProductByIdForShop } from "../repositories/product.repository";
import { adjustProductVariantStock, createProductVariant, deactivateProductVariantByIdForShop, findProductVariantByBarcodeForShop, findProductVariantByIdForShop, findProductVariantsForShop, updateProductVariantByIdForShop } from "../repositories/product-variant.repository";
import type { AdjustProductVariantStockInput, CreateProductVariantInput, UpdateProductVariantInput } from "../validators/product-variant.validator";

function duplicateError(error: unknown) { return error !== null && typeof error === "object" && "code" in error && (error as { code?: number }).code === 11000; }
function cleanAttributes(attributes: Record<string, string>) {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(attributes)) { const k = key.trim(); const v = value.trim(); if (k && v) result[k] = v; }
  return result;
}
function cleanOptional(value?: string) { return value?.trim() || undefined; }

async function syncParentProductStock(productId: string, shopId: string) {
  const variants = await findProductVariantsForShop(productId, shopId, { isActive: true });
  const stockQuantity = variants.reduce((sum, variant) => sum + variant.stockQuantity, 0);
  await updateProductByIdForShop(productId, shopId, { stockQuantity, hasVariants: variants.length > 0 });
}

export async function getProductVariantsForOwner(ownerId: string, productId: string, options?: { isActive?: boolean; search?: string }) {
  const shop = await getShopForOwner(ownerId);
  if (!(await findProductByIdForShop(productId, shop._id.toString()))) throw new ApiError(404, "Product not found.", "PRODUCT_NOT_FOUND");
  return findProductVariantsForShop(productId, shop._id.toString(), options);
}
export async function createProductVariantForOwner(ownerId: string, productId: string, input: CreateProductVariantInput) {
  const shop = await getShopForOwner(ownerId);
  if (!(await findProductByIdForShop(productId, shop._id.toString()))) throw new ApiError(404, "Product not found.", "PRODUCT_NOT_FOUND");
  const attributes = cleanAttributes(input.attributes);
  if (!Object.keys(attributes).length) throw new ApiError(400, "At least one variant attribute is required.", "VARIANT_ATTRIBUTES_REQUIRED");
  try {
    const variant = await createProductVariant({ shopId: shop._id.toString(), productId, attributes, sku: cleanOptional(input.sku), barcode: cleanOptional(input.barcode), purchasePrice: input.purchasePrice, sellingPrice: input.sellingPrice, stockQuantity: input.stockQuantity, lowStockThreshold: input.lowStockThreshold, warrantyPeriodMonths: input.warrantyPeriodMonths, imageUrl: cleanOptional(input.imageUrl) });
    await syncParentProductStock(productId, shop._id.toString());
    return variant;
  } catch (error) {
    if (duplicateError(error)) throw new ApiError(409, "This SKU or barcode is already used by another item in your shop.", "VARIANT_IDENTIFIER_ALREADY_EXISTS");
    throw error;
  }
}
export async function updateProductVariantForOwner(ownerId: string, productId: string, variantId: string, input: UpdateProductVariantInput) {
  const shop = await getShopForOwner(ownerId);
  if (!(await findProductVariantByIdForShop(variantId, productId, shop._id.toString()))) throw new ApiError(404, "Product variant not found.", "VARIANT_NOT_FOUND");
  const data: Record<string, unknown> = {};
  if (input.attributes) data.attributes = cleanAttributes(input.attributes);
  if (input.sku !== undefined) data.sku = cleanOptional(input.sku) ?? "";
  if (input.barcode !== undefined) data.barcode = cleanOptional(input.barcode) ?? "";
  if (input.purchasePrice !== undefined) data.purchasePrice = input.purchasePrice;
  if (input.sellingPrice !== undefined) data.sellingPrice = input.sellingPrice;
  if (input.lowStockThreshold !== undefined) data.lowStockThreshold = input.lowStockThreshold;
  if (input.warrantyPeriodMonths !== undefined) data.warrantyPeriodMonths = input.warrantyPeriodMonths;
  if (input.imageUrl !== undefined) data.imageUrl = cleanOptional(input.imageUrl) ?? "";
  if (input.isActive !== undefined) data.isActive = input.isActive;
  try {
    const updated = await updateProductVariantByIdForShop(variantId, productId, shop._id.toString(), data);
    if (!updated) throw new ApiError(404, "Product variant not found.", "VARIANT_NOT_FOUND");
    return updated;
  } catch (error) {
    if (duplicateError(error)) throw new ApiError(409, "This SKU or barcode is already used by another item in your shop.", "VARIANT_IDENTIFIER_ALREADY_EXISTS");
    throw error;
  }
}
export async function deleteProductVariantForOwner(ownerId: string, productId: string, variantId: string) {
  const shop = await getShopForOwner(ownerId);
  const existing = await findProductVariantByIdForShop(variantId, productId, shop._id.toString());
  if (!existing) throw new ApiError(404, "Product variant not found.", "VARIANT_NOT_FOUND");
  if (existing.stockQuantity > 0) throw new ApiError(400, "A variant with stock cannot be deactivated until its stock is zero.", "VARIANT_HAS_STOCK");
  const deactivated = await deactivateProductVariantByIdForShop(variantId, productId, shop._id.toString());
  if (deactivated) {
    const remaining = await findProductVariantsForShop(productId, shop._id.toString(), { isActive: true });
    await syncParentProductStock(productId, shop._id.toString());
  }
  return deactivated;
}
export async function adjustProductVariantStockForOwner(ownerId: string, productId: string, variantId: string, input: AdjustProductVariantStockInput) {
  const shop = await getShopForOwner(ownerId);
  const existing = await findProductVariantByIdForShop(variantId, productId, shop._id.toString());
  if (!existing) throw new ApiError(404, "Product variant not found.", "VARIANT_NOT_FOUND");
  if (!existing.isActive) throw new ApiError(400, "Inactive variants cannot be adjusted.", "VARIANT_INACTIVE");
  const session = await mongoose.startSession();
  try {
    const result = await session.withTransaction(async () => {
      const current = await findProductVariantByIdForShop(variantId, productId, shop._id.toString(), session);
      if (!current) throw new ApiError(404, "Product variant not found.", "VARIANT_NOT_FOUND");
      if (input.type === "out" && current.stockQuantity < input.quantity) throw new ApiError(400, "Insufficient variant stock.", "VARIANT_INSUFFICIENT_STOCK");
      const updated = await adjustProductVariantStock(variantId, productId, shop._id.toString(), input.type, input.quantity, session);
      if (!updated) throw new ApiError(400, "Variant stock could not be updated.", "VARIANT_STOCK_UPDATE_FAILED");

      await createInventoryMovement({
        shopId: shop._id.toString(),
        productId,
        variantId,
        productName: "Product variant",
        ...(updated.sku ? { sku: updated.sku } : {}),
        movementType: input.type === "in" ? "adjustment_in" : "adjustment_out",
        quantity: input.quantity,
        previousStock: current.stockQuantity,
        newStock: updated.stockQuantity,
        referenceType: "stock_adjustment",
        referenceId: variantId,
        reason: input.reason ?? "Variant stock adjustment.",
        createdBy: ownerId,
      }, session);

      await syncParentProductStock(productId, shop._id.toString());
      return { variant: updated, previousStock: current.stockQuantity };
    });
    if (!result) throw new ApiError(500, "Variant stock transaction failed.", "VARIANT_STOCK_TRANSACTION_FAILED");
    return result;
  } finally { await session.endSession(); }
}
export async function getProductVariantByBarcodeForOwner(ownerId: string, barcode: string) {
  const shop = await getShopForOwner(ownerId);
  const variant = await findProductVariantByBarcodeForShop(barcode.trim(), shop._id.toString());
  if (!variant) throw new ApiError(404, "No active product variant was found with this barcode.", "VARIANT_BARCODE_NOT_FOUND");
  return variant;
}
