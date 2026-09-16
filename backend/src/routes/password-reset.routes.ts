import { Router } from "express";

import {
  forgotPassword,
  resetUserPassword,
  validateResetToken,
} from "../controllers/password-reset.controller";

import {
  forgotPasswordRateLimit,
  resetPasswordRateLimit,
  validateResetTokenRateLimit,
} from "../middleware/rate-limit.middleware";

const router = Router();

router.post(
  "/forgot-password",
  forgotPasswordRateLimit,
  forgotPassword,
);

router.post(
  "/validate-reset-token",
  validateResetTokenRateLimit,
  validateResetToken,
);

router.post(
  "/reset-password",
  resetPasswordRateLimit,
  resetUserPassword,
);

export default router;