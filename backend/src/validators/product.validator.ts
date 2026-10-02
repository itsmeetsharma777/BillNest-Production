
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

/*
 * ============================================================
 * GTIN VALIDATION
 * ============================================================
 *
 * Supported standard GTIN lengths:
 *
 * GTIN-8
 * GTIN-12 / UPC-A
 * GTIN-13 / EAN-13
 * GTIN-14
 *
 * We validate the check digit using the GS1 algorithm.
 *
 * Non-numeric barcode values are also allowed because many
 * businesses use Code 128 / Code 39 / internal barcode formats.
 */

function isValidGtin(
  value: string,
) {
  if (!/^\d+$/.test(value)) {
    return true;
  }

  if (
    ![8, 12, 13, 14].includes(
      value.length,
    )
  ) {
    return false;
  }

  const digits =
    value.split("").map(Number);

  const checkDigit =
    digits.pop();

  if (
    checkDigit === undefined
  ) {
    return false;
  }

  let sum = 0;
  let multiplier = 3;

  for (
    let index =
      digits.length - 1;
    index >= 0;
    index--
  ) {
    sum +=
      digits[index] *
      multiplier;

    multiplier =
      multiplier === 3
        ? 1
        : 3;
  }

  const calculatedCheckDigit =
    (10 - (sum % 10)) % 10;

  return (
    calculatedCheckDigit ===
    checkDigit
  );
}

/*
 * ============================================================
 * BARCODE / GTIN
 * ============================================================
 *
 * Empty strings are allowed internally because barcode is
 * optional.
 *
 * Numeric values that look like GTINs are validated.
 *
 * Non-numeric barcode formats remain supported.
 */

const barcodeField = z
  .string()
  .trim()
  .max(
    100,
    "Barcode cannot exceed 100 characters.",
  )
  .refine(
    (value) => {
      if (!value) {
        return true;
      }

      return isValidGtin(value);
    },
    {
      message:
        "Invalid GTIN. Use a valid GTIN-8, GTIN-12, GTIN-13, or GTIN-14 barcode, or use a supported non-numeric barcode format.",
    },
  )
  .optional();

/*
 * ============================================================
 * ADVANCED CATALOG FOUNDATION FIELDS
 * ============================================================
 */

const productCatalogFields = {
  brand: optionalText(
    100,
    "Brand cannot exceed 100 characters.",
  ),

  barcode: barcodeField,

  unit: optionalText(
    30,
    "Unit cannot exceed 30 characters.",
  ),
};

/*
 * ============================================================
 * CREATE PRODUCT
 * ============================================================
 */

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

    ...productCatalogFields,

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

/*
 * ============================================================
 * PRODUCT UPDATE
 * ============================================================
 *
 * stockQuantity is intentionally NOT included.
 *
 * Stock changes must go through:
 *
 * /api/inventory/products/:productId/adjust
 */

export const updateProductSchema =
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
      )
      .optional(),

    sku: optionalText(
      100,
      "SKU cannot exceed 100 characters.",
    ),

    category: optionalText(
      100,
      "Category cannot exceed 100 characters.",
    ),

    ...productCatalogFields,

    purchasePrice:
      nonNegativeNumber(
        "Purchase price cannot be negative.",
      ).optional(),

    sellingPrice:
      nonNegativeNumber(
        "Selling price cannot be negative.",
      ).optional(),

    lowStockThreshold:
      nonNegativeNumber(
        "Low-stock threshold cannot be negative.",
      ).optional(),

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
        )
        .optional(),

    description: optionalText(
      2000,
      "Description cannot exceed 2000 characters.",
    ),

    isActive:
      z
        .boolean()
        .optional(),
  });

/*
 * ============================================================
 * PRODUCT LIST QUERY
 * ============================================================
 */

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

    isActive: z.enum(["true", "false"]).transform((value) => value === "true").optional(),

    brand: z.string().trim().max(100).optional(),

    stockStatus: z
      .enum(["all", "in_stock", "low_stock", "out_of_stock"])
      .default("all"),

    minPrice: z.coerce.number().nonnegative().finite().optional(),
    maxPrice: z.coerce.number().nonnegative().finite().optional(),

    hasBarcode: z.enum(["true", "false", "all"]).default("all"),

    hasVariants: z.enum(["true", "false", "all"]).default("all"),

    sortBy: z
      .enum(["createdAt", "name", "sellingPrice", "purchasePrice", "stockQuantity"])
      .default("createdAt"),

    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }).superRefine((value, context) => {
    if (value.minPrice !== undefined && value.maxPrice !== undefined && value.minPrice > value.maxPrice) {
      context.addIssue({
        code: "custom",
        path: ["maxPrice"],
        message: "Maximum price cannot be lower than minimum price.",
      });
    }
  });
  });

/*
 * ============================================================
 * BARCODE LOOKUP
 * ============================================================
 */

export const barcodeLookupSchema =
  z.object({
    barcode: z
      .string()
      .trim()
      .min(
        1,
        "Barcode is required.",
      )
      .max(
        100,
        "Barcode cannot exceed 100 characters.",
      ),
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

export type BarcodeLookupInput =
  z.infer<
    typeof barcodeLookupSchema
  >;

