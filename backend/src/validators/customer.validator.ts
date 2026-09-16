import { z } from "zod";

const addressSchema = z
  .object({
    line1: z
      .string()
      .trim()
      .max(200, "Address line 1 cannot exceed 200 characters.")
      .optional(),

    line2: z
      .string()
      .trim()
      .max(200, "Address line 2 cannot exceed 200 characters.")
      .optional(),

    city: z
      .string()
      .trim()
      .max(100, "City cannot exceed 100 characters.")
      .optional(),

    state: z
      .string()
      .trim()
      .max(100, "State cannot exceed 100 characters.")
      .optional(),

    postalCode: z
      .string()
      .trim()
      .max(20, "Postal code cannot exceed 20 characters.")
      .optional(),

    country: z
      .string()
      .trim()
      .max(100, "Country cannot exceed 100 characters.")
      .optional(),
  })
  .optional();

export const createCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Customer name must be at least 2 characters.")
    .max(150, "Customer name cannot exceed 150 characters."),

  email: z
    .string()
    .trim()
    .email("Please provide a valid customer email.")
    .optional(),

  phone: z
    .string()
    .trim()
    .max(30, "Phone number cannot exceed 30 characters.")
    .optional(),

  address: addressSchema,

  notes: z
    .string()
    .trim()
    .max(2000, "Notes cannot exceed 2000 characters.")
    .optional(),
});

export const updateCustomerSchema =
  createCustomerSchema.partial();

export const customerListQuerySchema = z.object({
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
});

export type CreateCustomerInput =
  z.infer<typeof createCustomerSchema>;

export type UpdateCustomerInput =
  z.infer<typeof updateCustomerSchema>;

export type CustomerListQuery =
  z.infer<typeof customerListQuerySchema>;