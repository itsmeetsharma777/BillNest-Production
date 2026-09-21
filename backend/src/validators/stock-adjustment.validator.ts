import { z } from "zod";

export const stockAdjustmentSchema =
  z.object({
    type: z.enum(
      ["in", "out"],
      {
        message:
          "Adjustment type must be either in or out.",
      },
    ),

    quantity: z
      .number()
      .finite(
        "Quantity must be a valid number.",
      )
      .positive(
        "Quantity must be greater than zero.",
      ),

    reason: z
      .string()
      .trim()
      .min(
        1,
        "Adjustment reason is required.",
      )
      .max(
        500,
        "Adjustment reason cannot exceed 500 characters.",
      ),
  });

export type StockAdjustmentInput =
  z.infer<
    typeof stockAdjustmentSchema
  >;