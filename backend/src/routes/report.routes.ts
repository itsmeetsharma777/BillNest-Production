import { Router } from "express";

import {
  getReports,
} from "../controllers/report.controller";

import {
  requireAuth,
} from "../middleware/auth.middleware";

import {
  requireRole,
} from "../middleware/role.middleware";

import {
  asyncHandler,
} from "../utils/async-handler";

const router = Router();

router.use(requireAuth);
router.use(requireRole("shopkeeper"));

router.get(
  "/",
  asyncHandler(getReports),
);

export default router;