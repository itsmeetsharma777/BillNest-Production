import { ProductModel } from "../models/product.model";

interface ProductFilters {
  search?: string;
  category?: string;
  isActive?: boolean;
}

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

  const search =
    options?.search?.trim();

  if (search) {
    filter.$or = [
      {
        name: {
          $regex: search,
          $options: "i",
        },
      },
      {
        sku: {
          $regex: search,
          $options: "i",
        },
      },
      {
        category: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  if (options?.category) {
    filter.category =
      options.category;
  }

  if (
    options?.isActive !== undefined
  ) {
    filter.isActive =
      options.isActive;
  }

  return filter;
}

export async function createProduct(
  data: {
    shopId: string;
    name: string;
    sku?: string;
    category?: string;
    purchasePrice: number;
    sellingPrice: number;
    stockQuantity: number;
    lowStockThreshold: number;
    warrantyPeriodMonths: number;
    description?: string;
  },
) {
  return ProductModel.create(data);
}

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

  return ProductModel.find(filter)
    .sort({
      isActive: -1,
      createdAt: -1,
    })
    .skip(options?.skip ?? 0)
    .limit(options?.limit ?? 20);
}

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

export async function findProductByIdForShop(
  productId: string,
  shopId: string,
) {
  return ProductModel.findOne({
    _id: productId,
    shopId,
  });
}

export async function updateProductByIdForShop(
  productId: string,
  shopId: string,
  data: Partial<{
    name: string;
    sku: string;
    category: string;
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