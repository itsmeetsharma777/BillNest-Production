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

export const createShopSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Shop name must be at least 2 characters.")
    .max(150, "Shop name cannot exceed 150 characters."),

  phone: z
    .string()
    .trim()
    .max(30, "Phone number cannot exceed 30 characters.")
    .optional(),

  email: z
    .string()
    .trim()
    .email("Please provide a valid shop email.")
    .optional(),

  address: addressSchema,

  taxId: z
    .string()
    .trim()
    .max(50, "Tax ID cannot exceed 50 characters.")
    .optional(),

  logoUrl: z
    .string()
    .trim()
    .url("Logo URL must be a valid URL.")
    .optional(),
});

export const updateShopSchema = createShopSchema.partial();

export type CreateShopInput = z.infer<typeof createShopSchema>;
export type UpdateShopInput = z.infer<typeof updateShopSchema>;