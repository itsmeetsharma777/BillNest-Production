import { Router } from "express";

import {
  register,
  login,
  logout,
  getCurrentUser,
} from "../controllers/auth.controller";

import { requireAuth } from "../middleware/auth.middleware";

import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.post(
  "/register",
  asyncHandler(register),
);

router.post(
  "/login",
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