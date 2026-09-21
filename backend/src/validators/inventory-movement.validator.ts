import {
  z,
} from "zod";

const objectIdSchema =
  z
    .string()
    .trim()
    .regex(
      /^[a-f\d]{24}$/i,
      "Invalid ID.",
    );

const movementTypeSchema =
  z.enum([
    "initial_stock",
    "purchase",
    "sale",
    "sale_reversal",
    "adjustment_in",
    "adjustment_out",
    "correction",
  ]);

const referenceTypeSchema =
  z.enum([
    "invoice",
    "invoice_cancellation",
    "product_creation",
    "stock_adjustment",
    "manual_correction",
  ]);

export const inventoryMovementListQuerySchema =
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

    productId:
      objectIdSchema.optional(),

    movementType:
      movementTypeSchema.optional(),

    referenceType:
      referenceTypeSchema.optional(),

    startDate:
      z.coerce
        .date()
        .optional(),

    endDate:
      z.coerce
        .date()
        .optional(),
  })
  .superRefine(
    (
      data,
      ctx,
    ) => {
      if (
        data.startDate &&
        data.endDate &&
        data.startDate >
          data.endDate
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode
              .custom,

          path: [
            "endDate",
          ],

          message:
            "End date cannot be before start date.",
        });
      }
    },
  );

export type InventoryMovementListQuery =
  z.infer<
    typeof inventoryMovementListQuerySchema
  >;