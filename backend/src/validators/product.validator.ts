import { z } from "zod";

export const productIdSchema = z
  .string()
  .trim()
  .regex(
    /^[a-f\d]{24}$/i,
    "Invalid product ID.",
  );

const optionalText = (
  max: number,
  message: string,
) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional();

const nonNegativeNumber = (
  message: string,
) =>
  z
    .number()
    .nonnegative(message)
    .finite(
      "Value must be a valid number.",
    );

export const createProductSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(
        1,
        "Product name is required.",
      )
      .max(
        200,
        "Product name cannot exceed 200 characters.",
      ),

    sku: optionalText(
      100,
      "SKU cannot exceed 100 characters.",
    ),

    category: optionalText(
      100,
      "Category cannot exceed 100 characters.",
    ),

    purchasePrice:
      nonNegativeNumber(
        "Purchase price cannot be negative.",
      ),

    sellingPrice:
      nonNegativeNumber(
        "Selling price cannot be negative.",
      ),

    stockQuantity:
      nonNegativeNumber(
        "Stock quantity cannot be negative.",
      ),

    lowStockThreshold:
      nonNegativeNumber(
        "Low-stock threshold cannot be negative.",
      ),

    warrantyPeriodMonths:
      z
        .number()
        .int(
          "Warranty period must be a whole number of months.",
        )
        .min(
          0,
          "Warranty period cannot be negative.",
        )
        .max(
          1200,
          "Warranty period cannot exceed 1200 months.",
        ),

    description: optionalText(
      2000,
      "Description cannot exceed 2000 characters.",
    ),
  });

export const updateProductSchema =
  createProductSchema.partial();

export const productListQuerySchema =
  z.object({
    page: z.coerce
      .number()
      .int(
        "Page must be a whole number.",
      )
      .min(
        1,
        "Page must be at least 1.",
      )
      .default(1),

    limit: z.coerce
      .number()
      .int(
        "Limit must be a whole number.",
      )
      .min(
        1,
        "Limit must be at least 1.",
      )
      .max(
        100,
        "Limit cannot exceed 100.",
      )
      .default(20),

    search: z
      .string()
      .trim()
      .max(
        100,
        "Search cannot exceed 100 characters.",
      )
      .optional(),

    category: z
      .string()
      .trim()
      .max(
        100,
        "Category cannot exceed 100 characters.",
      )
      .optional(),

    isActive: z
      .enum([
        "true",
        "false",
      ])
      .transform(
        (value) =>
          value === "true",
      )
      .optional(),
  });

export type CreateProductInput =
  z.infer<
    typeof createProductSchema
  >;

export type UpdateProductInput =
  z.infer<
    typeof updateProductSchema
  >;

export type ProductListQuery =
  z.infer<
    typeof productListQuerySchema
  >;