import { z } from "zod";

/**
 * ============================================================
 * BRAND ID
 * ============================================================
 */

export const brandIdSchema = z
  .string()
  .trim()
  .regex(
    /^[a-f\d]{24}$/i,
    "Invalid brand ID.",
  );

/**
 * ============================================================
 * OPTIONAL TEXT
 * ============================================================
 */

const optionalText = (
  max: number,
  message: string,
) =>
  z
    .string()
    .trim()
    .max(
      max,
      message,
    )
    .optional();

/**
 * ============================================================
 * CREATE BRAND
 * ============================================================
 */

export const createBrandSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(
        1,
        "Brand name is required.",
      )
      .max(
        100,
        "Brand name cannot exceed 100 characters.",
      ),

    description:
      optionalText(
        500,
        "Description cannot exceed 500 characters.",
      ),

    manufacturer:
      optionalText(
        150,
        "Manufacturer cannot exceed 150 characters.",
      ),

    website:
      optionalText(
        300,
        "Website cannot exceed 300 characters.",
      ),
  });

/**
 * ============================================================
 * UPDATE BRAND
 * ============================================================
 */

export const updateBrandSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(
        1,
        "Brand name is required.",
      )
      .max(
        100,
        "Brand name cannot exceed 100 characters.",
      )
      .optional(),

    description:
      optionalText(
        500,
        "Description cannot exceed 500 characters.",
      ),

    manufacturer:
      optionalText(
        150,
        "Manufacturer cannot exceed 150 characters.",
      ),

    website:
      optionalText(
        300,
        "Website cannot exceed 300 characters.",
      ),

    isActive:
      z
        .boolean()
        .optional(),
  });

/**
 * ============================================================
 * BRAND LIST QUERY
 * ============================================================
 */

export const brandListQuerySchema =
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
      .default("all"),
  });

/**
 * ============================================================
 * EXPORTED TYPES
 * ============================================================
 */

export type CreateBrandInput =
  z.infer<
    typeof createBrandSchema
  >;

export type UpdateBrandInput =
  z.infer<
    typeof updateBrandSchema
  >;

export type BrandListQuery =
  z.infer<
    typeof brandListQuerySchema
  >;