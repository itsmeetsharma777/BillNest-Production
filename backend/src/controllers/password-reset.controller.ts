import type { Request, Response } from "express";

import {
  requestPasswordReset,
  resetPassword,
  validatePasswordResetToken,
} from "../services/password-reset.service";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  validateResetTokenSchema,
} from "../validators/password-reset.validator";
import { asyncHandler } from "../utils/async-handler";

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = forgotPasswordSchema.parse(req.body);

    const result = await requestPasswordReset(email);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  },
);

export const validateResetToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { token } = validateResetTokenSchema.parse(
      req.body,
    );

    const result =
      await validatePasswordResetToken(token);

    res.status(200).json({
      success: true,
      message: "Password reset token is valid.",
      data: result,
    });
  },
);

export const resetUserPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const input = resetPasswordSchema.parse(req.body);

    const result = await resetPassword(
      input.token,
      input.password,
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  },
);