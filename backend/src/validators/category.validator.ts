import { z } from "zod";

/**
 * ============================================================
 * CREATE CATEGORY
 * ============================================================
 */

export const createCategorySchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(
        1,
        "Category name is required.",
      )
      .max(
        100,
        "Category name cannot exceed 100 characters.",
      ),

    description: z
      .string()
      .trim()
      .max(
        500,
        "Category description cannot exceed 500 characters.",
      )
      .optional(),
  });

/**
 * ============================================================
 * UPDATE CATEGORY
 * ============================================================
 */

export const updateCategorySchema =
  createCategorySchema.partial().extend({
    isActive: z
      .boolean()
      .optional(),
  });

/**
 * ============================================================
 * CATEGORY LIST QUERY
 * ============================================================
 */

export const categoryListQuerySchema =
  z.object({
    search: z
      .string()
      .trim()
      .max(
        100,
        "Search cannot exceed 100 characters.",
      )
      .optional(),

    isActive: z
      .enum([
        "true",
        "false",
        "all",
      ])
      .default("true"),
  });

export type CreateCategoryInput =
  z.infer<
    typeof createCategorySchema
  >;

export type UpdateCategoryInput =
  z.infer<
    typeof updateCategorySchema
  >;

export type CategoryListQuery =
  z.infer<
    typeof categoryListQuerySchema
  >;