import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
});

export const validateResetTokenSchema = z.object({
  token: z.string().trim().min(1, "Reset token is required."),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Reset token is required."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .regex(/[A-Z]/, "Password must contain an uppercase letter.")
    .regex(/[a-z]/, "Password must contain a lowercase letter.")
    .regex(/\d/, "Password must contain a number.")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain a special character.",
    ),
});

export type ForgotPasswordInput = z.infer<
  typeof forgotPasswordSchema
>;

export type ValidateResetTokenInput = z.infer<
  typeof validateResetTokenSchema
>;

export type ResetPasswordInput = z.infer<
  typeof resetPasswordSchema
>;