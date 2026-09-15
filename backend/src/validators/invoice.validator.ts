import { z } from "zod";

const invoiceItemSchema = z.object({
  productName: z
    .string()
    .trim()
    .min(1, "Product name is required.")
    .max(200, "Product name cannot exceed 200 characters."),

  sku: z
    .string()
    .trim()
    .max(100, "SKU cannot exceed 100 characters.")
    .optional(),

  quantity: z
    .number()
    .positive("Quantity must be greater than 0.")
    .finite("Quantity must be a valid number."),

  unitPrice: z
    .number()
    .nonnegative("Unit price cannot be negative.")
    .finite("Unit price must be a valid number."),

  discount: z
    .number()
    .nonnegative("Discount cannot be negative.")
    .finite("Discount must be a valid number.")
    .default(0),

  taxRate: z
    .number()
    .min(0, "Tax rate cannot be negative.")
    .max(100, "Tax rate cannot exceed 100%.")
    .finite("Tax rate must be a valid number.")
    .default(0),
});

export const createInvoiceSchema = z.object({
  customerId: z
    .string()
    .trim()
    .min(1, "Customer ID is required."),

  invoiceDate: z.coerce.date().optional(),

  dueDate: z.coerce.date().optional(),

  paymentMethod: z
    .enum([
      "cash",
      "upi",
      "card",
      "bank_transfer",
      "credit",
    ])
    .default("cash"),

  status: z
    .enum([
      "draft",
      "paid",
      "partially_paid",
      "cancelled",
    ])
    .default("draft"),

  notes: z
    .string()
    .trim()
    .max(2000, "Notes cannot exceed 2000 characters.")
    .optional(),

  items: z
    .array(invoiceItemSchema)
    .min(1, "Invoice must contain at least one item.")
    .max(100, "Invoice cannot contain more than 100 items."),
});

export const updateInvoiceSchema = z.object({
  paymentMethod: z
    .enum([
      "cash",
      "upi",
      "card",
      "bank_transfer",
      "credit",
    ])
    .optional(),

  status: z
    .enum([
      "draft",
      "paid",
      "partially_paid",
      "cancelled",
    ])
    .optional(),

  notes: z
    .string()
    .trim()
    .max(2000, "Notes cannot exceed 2000 characters.")
    .optional(),
});

export const invoiceListQuerySchema = z.object({
  page: z.coerce
    .number()
    .int("Page must be a whole number.")
    .min(1, "Page must be at least 1.")
    .default(1),

  limit: z.coerce
    .number()
    .int("Limit must be a whole number.")
    .min(1, "Limit must be at least 1.")
    .max(100, "Limit cannot exceed 100.")
    .default(20),

  status: z
    .enum([
      "draft",
      "paid",
      "partially_paid",
      "cancelled",
    ])
    .optional(),

  customerId: z
    .string()
    .trim()
    .optional(),
});

export type CreateInvoiceInput =
  z.infer<typeof createInvoiceSchema>;

export type UpdateInvoiceInput =
  z.infer<typeof updateInvoiceSchema>;

export type InvoiceListQuery =
  z.infer<typeof invoiceListQuerySchema>;