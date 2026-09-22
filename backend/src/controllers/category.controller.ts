import type {
  Response,
} from "express";

import mongoose from "mongoose";

import type {
  AuthenticatedRequest,
} from "../middleware/auth.middleware";

import {
  createCategoryForOwner,
  deactivateCategoryForOwner,
  getCategoriesForOwner,
  getCategoryForOwner,
  updateCategoryForOwner,
} from "../services/category.service";

import {
  createCategorySchema,
  categoryListQuerySchema,
  updateCategorySchema,
} from "../validators/category.validator";

import {
  ApiError,
} from "../utils/api-error";

function getCategoryId(
  req: AuthenticatedRequest,
) {
  const categoryId =
    req.params.categoryId;

  if (
    typeof categoryId !==
      "string" ||
    !mongoose.isValidObjectId(
      categoryId,
    )
  ) {
    throw new ApiError(
      400,
      "Invalid category ID.",
      "INVALID_CATEGORY_ID",
    );
  }

  return categoryId;
}

/**
 * ============================================================
 * CREATE
 * ============================================================
 */

export async function createCategory(
  req: AuthenticatedRequest,
  res: Response,
) {
  const input =
    createCategorySchema.parse(
      req.body,
    );

  const category =
    await createCategoryForOwner(
      req.user.id,
      input,
    );

  res.status(201).json({
    success: true,

    message:
      "Category created successfully.",

    data: {
      category,
    },
  });
}

/**
 * ============================================================
 * LIST
 * ============================================================
 */

export async function getCategories(
  req: AuthenticatedRequest,
  res: Response,
) {
  const query =
    categoryListQuerySchema.parse(
      req.query,
    );

  const isActive =
    query.isActive === "all"
      ? undefined
      : query.isActive === "true";

  const categories =
    await getCategoriesForOwner(
      req.user.id,
      {
        search:
          query.search,

        isActive,
      },
    );

  res.status(200).json({
    success: true,

    data: {
      categories,
    },
  });
}

/**
 * ============================================================
 * GET ONE
 * ============================================================
 */

export async function getCategory(
  req: AuthenticatedRequest,
  res: Response,
) {
  const category =
    await getCategoryForOwner(
      req.user.id,
      getCategoryId(req),
    );

  res.status(200).json({
    success: true,

    data: {
      category,
    },
  });
}

/**
 * ============================================================
 * UPDATE
 * ============================================================
 */

export async function updateCategory(
  req: AuthenticatedRequest,
  res: Response,
) {
  const input =
    updateCategorySchema.parse(
      req.body,
    );

  const category =
    await updateCategoryForOwner(
      req.user.id,
      getCategoryId(req),
      input,
    );

  res.status(200).json({
    success: true,

    message:
      "Category updated successfully.",

    data: {
      category,
    },
  });
}

/**
 * ============================================================
 * DEACTIVATE
 * ============================================================
 */

export async function deleteCategory(
  req: AuthenticatedRequest,
  res: Response,
) {
  await deactivateCategoryForOwner(
    req.user.id,
    getCategoryId(req),
  );

  res.status(200).json({
    success: true,

    message:
      "Category deactivated successfully.",
  });
}