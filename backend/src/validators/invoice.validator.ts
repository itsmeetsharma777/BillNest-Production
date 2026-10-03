import { z } from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .regex(
    /^[a-f\d]{24}$/i,
    "Invalid ID format.",
  );

const invoiceItemSchema = z.object({
  productId: objectIdSchema.optional(),

  variantId: objectIdSchema.optional(),

  productName: z
    .string()
    .trim()
    .min(1, "Product name is required.")
    .max(
      200,
      "Product name cannot exceed 200 characters.",
    ),

  sku: z
    .string()
    .trim()
    .max(
      100,
      "SKU cannot exceed 100 characters.",
    )
    .optional(),

  serialNumber: z
    .string()
    .trim()
    .max(
      150,
      "Serial number cannot exceed 150 characters.",
    )
    .optional(),

  quantity: z
    .number()
    .positive(
      "Quantity must be greater than 0.",
    )
    .finite(
      "Quantity must be a valid number.",
    ),

  unitPrice: z
    .number()
    .nonnegative(
      "Unit price cannot be negative.",
    )
    .finite(
      "Unit price must be a valid number.",
    ),

  discount: z
    .number()
    .nonnegative(
      "Discount cannot be negative.",
    )
    .finite(
      "Discount must be a valid number.",
    )
    .default(0),

  barcode: z.string().trim().max(100).optional(),

  variantName: z.string().trim().max(500).optional(),

  variantAttributes: z.record(z.string(), z.string()).optional(),

  taxRate: z
    .number()
    .min(
      0,
      "Tax rate cannot be negative.",
    )
    .max(
      100,
      "Tax rate cannot exceed 100%.",
    )
    .finite(
      "Tax rate must be a valid number.",
    )
    .default(0),
});

const amountPaidSchema = z
  .number()
  .nonnegative(
    "Amount paid cannot be negative.",
  )
  .finite(
    "Amount paid must be a valid number.",
  );

const invoiceStatusSchema = z.enum([
  "draft",
  "paid",
  "partially_paid",
  "cancelled",
]);

const paymentMethodSchema = z.enum([
  "cash",
  "online",
  "cheque",
]);

export const createInvoiceSchema = z.object({
  customerId: objectIdSchema,

  invoiceDate: z.coerce.date().optional(),

  dueDate: z.coerce.date().optional(),

  paymentMethod:
    paymentMethodSchema.default("cash"),

  status:
    invoiceStatusSchema.default("draft"),

  amountPaid:
    amountPaidSchema.optional(),

  notes: z
    .string()
    .trim()
    .max(
      2000,
      "Notes cannot exceed 2000 characters.",
    )
    .optional(),

  items: z
    .array(invoiceItemSchema)
    .min(
      1,
      "Invoice must contain at least one item.",
    )
    .max(
      100,
      "Invoice cannot contain more than 100 items.",
    ),
})
.superRefine((data, ctx) => {
  if (
    data.dueDate &&
    data.invoiceDate &&
    data.dueDate < data.invoiceDate
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dueDate"],
      message:
        "Due date cannot be before invoice date.",
    });
  }

  if (
    data.status === "draft" &&
    data.amountPaid !== undefined &&
    data.amountPaid > 0
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["amountPaid"],
      message:
        "A draft invoice cannot have a payment amount.",
    });
  }

  if (
    data.status === "paid" &&
    data.amountPaid !== undefined &&
    data.amountPaid < 0
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["amountPaid"],
      message:
        "Paid invoice amount cannot be negative.",
    });
  }
});

export const updateInvoiceSchema =
  z.object({
    paymentMethod:
      paymentMethodSchema.optional(),

    status:
      invoiceStatusSchema.optional(),

    dueDate:
      z.coerce.date().optional(),

    amountPaid:
      amountPaidSchema.optional(),

    notes: z
      .string()
      .trim()
      .max(
        2000,
        "Notes cannot exceed 2000 characters.",
      )
      .optional(),
  });

export const invoiceListQuerySchema =
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

    status:
      invoiceStatusSchema.optional(),

    customerId:
      objectIdSchema.optional(),
  });

export type CreateInvoiceInput =
  z.infer<typeof createInvoiceSchema>;

export type UpdateInvoiceInput =
  z.infer<typeof updateInvoiceSchema>;

export type InvoiceListQuery =
  z.infer<typeof invoiceListQuerySchema>;