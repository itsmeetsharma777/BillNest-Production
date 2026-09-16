import { z } from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid ID.");

const dateSchema = z.coerce.date();

const warrantyStatusSchema = z.enum([
  "active",
  "expiring_soon",
  "expired",
  "no_warranty",
]);

export const createWarrantySchema = z.object({
  customerId: objectIdSchema,

  invoiceId: objectIdSchema.optional(),

  invoiceItemId: objectIdSchema.optional(),

  productName: z
    .string()
    .trim()
    .min(1, "Product name is required.")
    .max(200, "Product name is too long."),

  serialNumber: z
    .string()
    .trim()
    .max(200, "Serial number is too long.")
    .optional(),

  warrantyPeriodMonths: z
    .coerce
    .number()
    .int("Warranty period must be a whole number.")
    .min(0, "Warranty period cannot be negative.")
    .max(1200, "Warranty period is too large."),

  startDate: dateSchema,

  terms: z
    .string()
    .trim()
    .max(5000, "Warranty terms are too long.")
    .optional(),

  notes: z
    .string()
    .trim()
    .max(5000, "Warranty notes are too long.")
    .optional(),
});

export const updateWarrantySchema = z
  .object({
    productName: z
      .string()
      .trim()
      .min(1, "Product name cannot be empty.")
      .max(200, "Product name is too long.")
      .optional(),

    serialNumber: z
      .string()
      .trim()
      .max(200, "Serial number is too long.")
      .optional(),

    warrantyPeriodMonths: z
      .coerce
      .number()
      .int("Warranty period must be a whole number.")
      .min(0, "Warranty period cannot be negative.")
      .max(1200, "Warranty period is too large.")
      .optional(),

    startDate: dateSchema.optional(),

    terms: z
      .string()
      .trim()
      .max(5000, "Warranty terms are too long.")
      .optional(),

    notes: z
      .string()
      .trim()
      .max(5000, "Warranty notes are too long.")
      .optional(),

    isActive: z.boolean().optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    {
      message: "At least one field is required.",
    },
  );

export const warrantyListQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),

  customerId: objectIdSchema.optional(),

  status: warrantyStatusSchema.optional(),
});

export const expiringWarrantyQuerySchema = z.object({
  days: z.coerce
    .number()
    .int()
    .min(1)
    .max(365)
    .default(30),
});