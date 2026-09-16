import { Router } from "express";

import {
  register,
  login,
  logout,
  getCurrentUser,
} from "../controllers/auth.controller";

import { requireAuth } from "../middleware/auth.middleware";

import {
  loginRateLimit,
  registerRateLimit,
} from "../middleware/rate-limit.middleware";

import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.post(
  "/register",
  registerRateLimit,
  asyncHandler(register),
);

router.post(
  "/login",
  loginRateLimit,
  asyncHandler(login),
);

router.post(
  "/logout",
  asyncHandler(logout),
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(getCurrentUser),
);

export default router;