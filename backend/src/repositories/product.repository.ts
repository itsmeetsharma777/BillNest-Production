import { Types, type ClientSession } from "mongoose";
import { ProductModel } from "../models/product.model";

export interface ProductFilters {
  search?: string;
  category?: string;
  brand?: string;
  isActive?: boolean;
  stockStatus?: "all" | "in_stock" | "low_stock" | "out_of_stock";
  minPrice?: number;
  maxPrice?: number;
  hasBarcode?: "true" | "false" | "all";
  hasVariants?: "true" | "false" | "all";
  sortBy?: "createdAt" | "name" | "sellingPrice" | "purchasePrice" | "stockQuantity";
  sortOrder?: "asc" | "desc";
}

function buildProductFilter(shopId: string, options?: ProductFilters) {
  const filter: Record<string, unknown> = { shopId };
  const andConditions: Record<string, unknown>[] = [];
  const search = options?.search?.trim();

  if (search) {
    const escapedSearch = search.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
    andConditions.push({
      $or: [
        { name: { $regex: escapedSearch, $options: "i" } },
        { sku: { $regex: escapedSearch, $options: "i" } },
        { category: { $regex: escapedSearch, $options: "i" } },
        { brand: { $regex: escapedSearch, $options: "i" } },
        { barcode: { $regex: escapedSearch, $options: "i" } },
      ],
    });
  }

  if (options?.category) filter.category = options.category;
  if (options?.brand) filter.brand = options.brand;

  if (options?.minPrice !== undefined || options?.maxPrice !== undefined) {
    filter.sellingPrice = {
      ...(options.minPrice !== undefined ? { $gte: options.minPrice } : {}),
      ...(options.maxPrice !== undefined ? { $lte: options.maxPrice } : {}),
    };
  }

  if (options?.stockStatus === "in_stock") filter.stockQuantity = { $gt: 0 };
  if (options?.stockStatus === "out_of_stock") filter.stockQuantity = 0;
  if (options?.stockStatus === "low_stock") {
    filter.$expr = { $lte: ["$stockQuantity", "$lowStockThreshold"] };
  }

  if (options?.hasBarcode === "true") {
    filter.barcode = { $exists: true, $nin: ["", null] };
  } else if (options?.hasBarcode === "false") {
    andConditions.push({
      $or: [{ barcode: { $exists: false } }, { barcode: "" }, { barcode: null }],
    });
  }

  if (options?.hasVariants === "true") filter.hasVariants = true;
  if (options?.hasVariants === "false") filter.hasVariants = { $ne: true };

  if (options?.isActive !== undefined) filter.isActive = options.isActive;
  if (andConditions.length) filter.$and = andConditions;

  return filter;
}

export async function createProduct(
  data: {
    shopId: string;
    name: string;
    sku?: string;
    category?: string;
    brand?: string;
    barcode?: string;
    unit?: string;
    purchasePrice: number;
    sellingPrice: number;
    stockQuantity: number;
    lowStockThreshold: number;
    warrantyPeriodMonths: number;
    description?: string;
    hasVariants?: boolean;
  },
  session?: ClientSession,
) {
  if (!session) return ProductModel.create(data);
  const [product] = await ProductModel.create([data], { session });
  return product;
}

export async function findProductsByShopId(
  shopId: string,
  options?: ProductFilters & { skip?: number; limit?: number },
) {
  const filter = buildProductFilter(shopId, options);
  const sortField = options?.sortBy ?? "createdAt";
  const sortDirection = options?.sortOrder === "asc" ? 1 : -1;

  return ProductModel.find(filter)
    .sort({ isActive: -1, [sortField]: sortDirection, _id: -1 })
    .skip(options?.skip ?? 0)
    .limit(options?.limit ?? 20);
}

export async function countProductsByShopId(
  shopId: string,
  options?: ProductFilters,
) {
  return ProductModel.countDocuments(buildProductFilter(shopId, options));
}

export async function findAllProductsByShopId(
  shopId: string,
  options?: ProductFilters,
) {
  const filter = buildProductFilter(shopId, options);
  return ProductModel.find(filter).sort({ name: 1, _id: 1 });
}

export async function findProductByIdForShop(productId: string, shopId: string) {
  return ProductModel.findOne({ _id: productId, shopId });
}

export async function findProductsByIdsForShop(productIds: string[], shopId: string) {
  return ProductModel.find({ _id: { $in: productIds }, shopId });
}

export async function findProductByBarcodeForShop(barcode: string, shopId: string) {
  return ProductModel.findOne({ shopId, barcode });
}

export async function bulkUpdateProductStatusForShop(
  productIds: string[],
  shopId: string,
  isActive: boolean,
) {
  return ProductModel.updateMany(
    { _id: { $in: productIds }, shopId },
    { $set: { isActive } },
  );
}

export async function updateProductByIdForShop(
  productId: string,
  shopId: string,
  data: Partial<{
    name: string;
    sku: string;
    category: string;
    brand: string;
    barcode: string;
    unit: string;
    purchasePrice: number;
    sellingPrice: number;
    stockQuantity: number;
    lowStockThreshold: number;
    warrantyPeriodMonths: number;
    description: string;
    hasVariants: boolean;
    isActive: boolean;
  }>,
) {
  return ProductModel.findOneAndUpdate(
    { _id: productId, shopId },
    { $set: data },
    { new: true, runValidators: true },
  );
}

export async function deleteProductByIdForShop(productId: string, shopId: string) {
  return ProductModel.findOneAndUpdate(
    { _id: productId, shopId },
    { $set: { isActive: false } },
    { new: true, runValidators: true },
  );
}

export async function getCatalogAnalyticsByShopId(shopId: string) {
  const [summary] = await ProductModel.aggregate([
    { $match: { shopId: new Types.ObjectId(shopId) } },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        activeProducts: { $sum: { $cond: ["$isActive", 1, 0] } },
        inactiveProducts: { $sum: { $cond: ["$isActive", 0, 1] } },
        totalStockUnits: { $sum: "$stockQuantity" },
        inventoryCostValue: { $sum: { $multiply: ["$purchasePrice", "$stockQuantity"] } },
        inventoryRetailValue: { $sum: { $multiply: ["$sellingPrice", "$stockQuantity"] } },
        potentialGrossProfit: {
          $sum: {
            $multiply: [
              { $subtract: ["$sellingPrice", "$purchasePrice"] },
              "$stockQuantity",
            ],
          },
        },
        barcodedProducts: {
          $sum: { $cond: [{ $and: [{ $ne: ["$barcode", null] }, { $ne: ["$barcode", ""] }] }, 1, 0] },
        },
        variantProducts: { $sum: { $cond: ["$hasVariants", 1, 0] } },
        lowStockProducts: {
          $sum: {
            $cond: [
              { $and: ["$isActive", { $lte: ["$stockQuantity", "$lowStockThreshold"] }] },
              1,
              0,
            ],
          },
        },
        outOfStockProducts: {
          $sum: {
            $cond: [{ $and: ["$isActive", { $eq: ["$stockQuantity", 0] }] }, 1, 0],
          },
        },
      },
    },
  ]);

  return summary ?? {
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    totalStockUnits: 0,
    inventoryCostValue: 0,
    inventoryRetailValue: 0,
    potentialGrossProfit: 0,
    barcodedProducts: 0,
    variantProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
  };
}
