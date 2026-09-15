import { Router } from "express";

import {
  forgotPassword,
  resetUserPassword,
  validateResetToken,
} from "../controllers/password-reset.controller";

const router = Router();

router.post("/forgot-password", forgotPassword);

router.post(
  "/validate-reset-token",
  validateResetToken,
);

router.post(
  "/reset-password",
  resetUserPassword,
);

export default router;