import { z } from "zod";

const addressSchema = z
  .object({
    line1: z
      .string()
      .trim()
      .max(
        200,
        "Address line 1 cannot exceed 200 characters.",
      )
      .optional(),

    line2: z
      .string()
      .trim()
      .max(
        200,
        "Address line 2 cannot exceed 200 characters.",
      )
      .optional(),

    city: z
      .string()
      .trim()
      .max(
        100,
        "City cannot exceed 100 characters.",
      )
      .optional(),

    state: z
      .string()
      .trim()
      .max(
        100,
        "State cannot exceed 100 characters.",
      )
      .optional(),

    postalCode: z
      .string()
      .trim()
      .regex(
        /^$|^\d{6}$/,
        "Postal code must contain 6 digits.",
      )
      .optional(),

    country: z
      .string()
      .trim()
      .max(
        100,
        "Country cannot exceed 100 characters.",
      )
      .optional(),
  })
  .optional();

export const updateCustomerAccountSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(
        2,
        "Name must contain at least 2 characters.",
      )
      .max(
        100,
        "Name cannot exceed 100 characters.",
      ),

    email: z
      .string()
      .trim()
      .email(
        "Please provide a valid email address.",
      )
      .max(
        254,
        "Email cannot exceed 254 characters.",
      ),

    phone: z
      .string()
      .trim()
      .max(
        20,
        "Phone number cannot exceed 20 characters.",
      )
      .optional(),

    address: addressSchema,
  });

export type UpdateCustomerAccountInput =
  z.infer<
    typeof updateCustomerAccountSchema
  >;