import { z } from "zod";

const paymentMethodSchema =
  z.enum([
    "cash",
    "upi",
    "card",
    "bank_transfer",
    "credit",
  ]);

export const recordInvoicePaymentSchema =
  z.object({
    amount: z
      .number()
      .positive(
        "Payment amount must be greater than zero.",
      )
      .finite(
        "Payment amount must be a valid number.",
      ),

    paymentMethod:
      paymentMethodSchema.default(
        "cash",
      ),

    notes: z
      .string()
      .trim()
      .max(
        1000,
        "Payment notes cannot exceed 1000 characters.",
      )
      .optional(),
  });

export type RecordInvoicePaymentInput =
  z.infer<
    typeof recordInvoicePaymentSchema
  >;