import { Types } from "mongoose";
import { ProductModel } from "../models/product.model";
import { ProductVariantModel } from "../models/product-variant.model";

export interface InventoryValuationResult {
  totalProducts: number;
  totalStockUnits: number;
  inventoryCostValue: number;
  inventoryRetailValue: number;
  potentialProfit: number;
}

export async function getInventoryValuationByShopId(shopId: string): Promise<InventoryValuationResult> {
  const shopObjectId = new Types.ObjectId(shopId);

  const [products, variants] = await Promise.all([
    ProductModel.aggregate([
      { $match: { shopId: shopObjectId, isActive: true, hasVariants: { $ne: true } } },
      { $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalStockUnits: { $sum: { $max: [{ $ifNull: ["$stockQuantity", 0] }, 0] } },
        inventoryCostValue: { $sum: { $multiply: [{ $max: [{ $ifNull: ["$stockQuantity", 0] }, 0] }, { $max: [{ $ifNull: ["$purchasePrice", 0] }, 0] }] } },
        inventoryRetailValue: { $sum: { $multiply: [{ $max: [{ $ifNull: ["$stockQuantity", 0] }, 0] }, { $max: [{ $ifNull: ["$sellingPrice", 0] }, 0] }] } },
      } },
    ]),
    ProductVariantModel.aggregate([
      { $match: { shopId: shopObjectId, isActive: true } },
      { $group: {
        _id: null,
        totalStockUnits: { $sum: { $max: [{ $ifNull: ["$stockQuantity", 0] }, 0] } },
        inventoryCostValue: { $sum: { $multiply: [{ $max: [{ $ifNull: ["$stockQuantity", 0] }, 0] }, { $max: [{ $ifNull: ["$purchasePrice", 0] }, 0] }] } },
        inventoryRetailValue: { $sum: { $multiply: [{ $max: [{ $ifNull: ["$stockQuantity", 0] }, 0] }, { $max: [{ $ifNull: ["$sellingPrice", 0] }, 0] }] } },
      } },
    ]),
  ]);

  const product = products[0] ?? {};
  const variant = variants[0] ?? {};
  const totalProducts = Number(product.totalProducts ?? 0);

  const inventoryCostValue = Number(product.inventoryCostValue ?? 0) + Number(variant.inventoryCostValue ?? 0);
  const inventoryRetailValue = Number(product.inventoryRetailValue ?? 0) + Number(variant.inventoryRetailValue ?? 0);

  return {
    totalProducts,
    totalStockUnits: Number(product.totalStockUnits ?? 0) + Number(variant.totalStockUnits ?? 0),
    inventoryCostValue,
    inventoryRetailValue,
    potentialProfit: inventoryRetailValue - inventoryCostValue,
  };
}
