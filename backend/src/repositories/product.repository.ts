
import {
  type ClientSession,
} from "mongoose";

import {
  ProductModel,
} from "../models/product.model";

interface ProductFilters {
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

/*
 * ============================================================
 * BUILD PRODUCT FILTER
 * ============================================================
 */

function buildProductFilter(
  shopId: string,
  options?: ProductFilters,
) {
  const filter: Record<
    string,
    unknown
  > = {
    shopId,
  };

  const search = options?.search?.trim();

  if (search) {
    const escapedSearch = search.replace(/[.*+?^$()|[\]\\]/g, "\\  const search =
    options?.search?.trim();

  if (search) {
    filter.$or = [");
    filter.$or = [
      {
        name: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        sku: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        category: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        brand: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        barcode: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
    ];
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

  if (options?.hasBarcode === "true") filter.barcode = { $exists: true, $nin: ["", null] };
  if (options?.hasBarcode === "false") filter.$or = [{ barcode: { $exists: false } }, { barcode: "" }, { barcode: null }];

  if (options?.hasVariants === "true") filter.hasVariants = true;
  if (options?.hasVariants === "false") filter.hasVariants = { $ne: true };

  if (
    options?.isActive !== undefined
  ) {
    filter.isActive =
      options.isActive;
  }

  return filter;
}

/*
 * ============================================================
 * CREATE PRODUCT
 * ============================================================
 */

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
  },
  session?: ClientSession,
) {
  if (!session) {
    return ProductModel.create(
      data,
    );
  }

  const [product] =
    await ProductModel.create(
      [data],
      {
        session,
      },
    );

  return product;
}

/*
 * ============================================================
 * FIND PRODUCTS
 * ============================================================
 */

export async function findProductsByShopId(
  shopId: string,
  options?: ProductFilters & {
    skip?: number;
    limit?: number;
  },
) {
  const filter =
    buildProductFilter(
      shopId,
      options,
    );

  const sortField = options?.sortBy ?? "createdAt";
  const sortDirection = options?.sortOrder === "asc" ? 1 : -1;
  return ProductModel.find(filter)
    .sort({
      isActive: -1,
      [sortField]: sortDirection,
      _id: -1,
    })
    .skip(options?.skip ?? 0)
    .limit(options?.limit ?? 20);
}

/*
 * ============================================================
 * COUNT PRODUCTS
 * ============================================================
 */

export async function countProductsByShopId(
  shopId: string,
  options?: ProductFilters,
) {
  const filter =
    buildProductFilter(
      shopId,
      options,
    );

  return ProductModel.countDocuments(
    filter,
  );
}

/*
 * ============================================================
 * FIND ONE PRODUCT
 * ============================================================
 */

export async function findProductByIdForShop(
  productId: string,
  shopId: string,
) {
  return ProductModel.findOne({
    _id: productId,
    shopId,
  });
}

/*
 * ============================================================
 * FIND PRODUCT BY BARCODE
 * ============================================================
 *
 * Barcode lookup is ALWAYS scoped by shopId.
 *
 * This prevents one shopkeeper from ever resolving a
 * barcode belonging to another shop.
 */

export async function findProductByBarcodeForShop(
  barcode: string,
  shopId: string,
) {
  return ProductModel.findOne({
    shopId,
    barcode,
  });
}

/*
 * ============================================================
 * UPDATE PRODUCT
 * ============================================================
 */

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
    isActive: boolean;
  }>,
) {
  return ProductModel.findOneAndUpdate(
    {
      _id: productId,
      shopId,
    },
    {
      $set: data,
    },
    {
      new: true,
      runValidators: true,
    },
  );
}

/*
 * ============================================================
 * DEACTIVATE PRODUCT
 * ============================================================
 */

export async function deleteProductByIdForShop(
  productId: string,
  shopId: string,
) {
  return ProductModel.findOneAndUpdate(
    {
      _id: productId,
      shopId,
    },
    {
      $set: {
        isActive: false,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );
}