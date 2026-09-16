import { Router } from "express";

import { getDashboard } from "../controllers/dashboard.controller";

import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(requireAuth);

router.use(requireRole("shopkeeper"));

router.get(
  "/",
  asyncHandler(getDashboard),
);

export default router;