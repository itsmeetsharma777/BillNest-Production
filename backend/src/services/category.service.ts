import mongoose from "mongoose";

import {
  createCategory,
  deactivateCategoryByIdForShop,
  findCategoriesByShopId,
  findCategoryByIdForShop,
  findCategoryByNameForShop,
  updateCategoryByIdForShop,
} from "../repositories/category.repository";

import {
  getShopForOwner,
} from "./shop.service";

import {
  ApiError,
} from "../utils/api-error";

function normalizeCategoryName(
  name: string,
) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function cleanOptionalText(
  value?: string,
) {
  const trimmed =
    value?.trim();

  return trimmed || undefined;
}

function isDuplicateKeyError(
  error: unknown,
) {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    (
      error as {
        code?: unknown;
      }
    ).code === 11000
  );
}

/**
 * ============================================================
 * CREATE CATEGORY
 * ============================================================
 */

export async function createCategoryForOwner(
  ownerId: string,
  input: {
    name: string;
    description?: string;
  },
) {
  const shop =
    await getShopForOwner(
      ownerId,
    );

  const name =
    input.name
      .trim()
      .replace(/\s+/g, " ");

  if (!name) {
    throw new ApiError(
      400,
      "Category name is required.",
      "INVALID_CATEGORY_NAME",
    );
  }

  const normalizedName =
    normalizeCategoryName(
      name,
    );

  const existing =
    await findCategoryByNameForShop(
      normalizedName,
      shop._id.toString(),
    );

  if (existing) {
    throw new ApiError(
      409,
      "A category with this name already exists in your shop.",
      "CATEGORY_ALREADY_EXISTS",
    );
  }

  try {
    return await createCategory({
      shopId:
        shop._id.toString(),

      name,

      normalizedName,

      ...(cleanOptionalText(
        input.description,
      ) && {
        description:
          cleanOptionalText(
            input.description,
          ),
      }),
    });
  } catch (error) {
    if (
      isDuplicateKeyError(
        error,
      )
    ) {
      throw new ApiError(
        409,
        "A category with this name already exists in your shop.",
        "CATEGORY_ALREADY_EXISTS",
      );
    }

    throw error;
  }
}

/**
 * ============================================================
 * GET CATEGORIES
 * ============================================================
 */

export async function getCategoriesForOwner(
  ownerId: string,
  options?: {
    search?: string;
    isActive?: boolean;
  },
) {
  const shop =
    await getShopForOwner(
      ownerId,
    );

  return findCategoriesByShopId(
    shop._id.toString(),
    {
      search:
        options?.search,

      isActive:
        options?.isActive,
    },
  );
}

/**
 * ============================================================
 * GET ONE CATEGORY
 * ============================================================
 */

export async function getCategoryForOwner(
  ownerId: string,
  categoryId: string,
) {
  const shop =
    await getShopForOwner(
      ownerId,
    );

  const category =
    await findCategoryByIdForShop(
      categoryId,
      shop._id.toString(),
    );

  if (
    !category ||
    !category.isActive
  ) {
    throw new ApiError(
      404,
      "Category not found.",
      "CATEGORY_NOT_FOUND",
    );
  }

  return category;
}

/**
 * ============================================================
 * UPDATE CATEGORY
 * ============================================================
 */

export async function updateCategoryForOwner(
  ownerId: string,
  categoryId: string,
  input: {
    name?: string;
    description?: string;
    isActive?: boolean;
  },
) {
  const shop =
    await getShopForOwner(
      ownerId,
    );

  const existing =
    await findCategoryByIdForShop(
      categoryId,
      shop._id.toString(),
    );

  if (!existing) {
    throw new ApiError(
      404,
      "Category not found.",
      "CATEGORY_NOT_FOUND",
    );
  }

  const updateData: {
    name?: string;
    normalizedName?: string;
    description?: string;
    isActive?: boolean;
  } = {};

  if (
    input.name !==
    undefined
  ) {
    const name =
      input.name
        .trim()
        .replace(/\s+/g, " ");

    if (!name) {
      throw new ApiError(
        400,
        "Category name cannot be empty.",
        "INVALID_CATEGORY_NAME",
      );
    }

    const normalizedName =
      normalizeCategoryName(
        name,
      );

    const duplicate =
      await findCategoryByNameForShop(
        normalizedName,
        shop._id.toString(),
      );

    if (
      duplicate &&
      duplicate._id.toString() !==
        categoryId
    ) {
      throw new ApiError(
        409,
        "A category with this name already exists in your shop.",
        "CATEGORY_ALREADY_EXISTS",
      );
    }

    updateData.name =
      name;

    updateData.normalizedName =
      normalizedName;
  }

  if (
    input.description !==
    undefined
  ) {
    updateData.description =
      input.description.trim();
  }

  if (
    input.isActive !==
    undefined
  ) {
    updateData.isActive =
      input.isActive;
  }

  try {
    const updated =
      await updateCategoryByIdForShop(
        categoryId,
        shop._id.toString(),
        updateData,
      );

    if (!updated) {
      throw new ApiError(
        404,
        "Category not found.",
        "CATEGORY_NOT_FOUND",
      );
    }

    return updated;
  } catch (error) {
    if (
      isDuplicateKeyError(
        error,
      )
    ) {
      throw new ApiError(
        409,
        "A category with this name already exists in your shop.",
        "CATEGORY_ALREADY_EXISTS",
      );
    }

    throw error;
  }
}

/**
 * ============================================================
 * DEACTIVATE CATEGORY
 * ============================================================
 */

export async function deactivateCategoryForOwner(
  ownerId: string,
  categoryId: string,
) {
  const shop =
    await getShopForOwner(
      ownerId,
    );

  const existing =
    await findCategoryByIdForShop(
      categoryId,
      shop._id.toString(),
    );

  if (
    !existing ||
    !existing.isActive
  ) {
    throw new ApiError(
      404,
      "Category not found.",
      "CATEGORY_NOT_FOUND",
    );
  }

  const category =
    await deactivateCategoryByIdForShop(
      categoryId,
      shop._id.toString(),
    );

  if (!category) {
    throw new ApiError(
      404,
      "Category not found.",
      "CATEGORY_NOT_FOUND",
    );
  }

  return category;
}