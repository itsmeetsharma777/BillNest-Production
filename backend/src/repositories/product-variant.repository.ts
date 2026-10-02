import type { ClientSession } from "mongoose";
import { ProductVariantModel } from "../models/product-variant.model";

export async function createProductVariant(data: Record<string, unknown>, session?: ClientSession) {
  if (!session) return ProductVariantModel.create(data);
  const [variant] = await ProductVariantModel.create([data], { session });
  return variant;
}
export async function findProductVariantsForShop(productId: string, shopId: string, options?: { isActive?: boolean; search?: string }) {
  const filter: Record<string, unknown> = { productId, shopId };
  if (options?.isActive !== undefined) filter.isActive = options.isActive;
  if (options?.search) {
    const search = options.search.trim().replace(/[.*+?^$()|[\]\\]/g, "\\$&");
    filter.$or = [{ sku: { $regex: search, $options: "i" } }, { barcode: { $regex: search, $options: "i" } }];
  }
  return ProductVariantModel.find(filter).sort({ isActive: -1, createdAt: -1 });
}
export async function findProductVariantByIdForShop(variantId: string, productId: string, shopId: string, session?: ClientSession) {
  const query = ProductVariantModel.findOne({ _id: variantId, productId, shopId });
  if (session) query.session(session);
  return query;
}
export async function findProductVariantByBarcodeForShop(barcode: string, shopId: string) {
  return ProductVariantModel.findOne({ barcode, shopId, isActive: true });
}
export async function updateProductVariantByIdForShop(variantId: string, productId: string, shopId: string, data: Record<string, unknown>) {
  return ProductVariantModel.findOneAndUpdate({ _id: variantId, productId, shopId }, { $set: data }, { new: true, runValidators: true });
}
export async function deactivateProductVariantByIdForShop(variantId: string, productId: string, shopId: string) {
  return ProductVariantModel.findOneAndUpdate({ _id: variantId, productId, shopId }, { $set: { isActive: false } }, { new: true });
}
export async function adjustProductVariantStock(variantId: string, productId: string, shopId: string, type: "in" | "out", quantity: number, session: ClientSession) {
  const filter: Record<string, unknown> = { _id: variantId, productId, shopId, isActive: true };
  if (type === "out") filter.stockQuantity = { $gte: quantity };
  return ProductVariantModel.findOneAndUpdate(filter, { $inc: { stockQuantity: type === "in" ? quantity : -quantity } }, { new: true, runValidators: true, session });
}
