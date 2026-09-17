import { Router } from "express";

import {
  getAccount,
  updateAccount,
} from "../controllers/customer-account.controller";

import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(requireAuth);
router.use(requireRole("customer"));

router.get(
  "/",
  asyncHandler(getAccount),
);

router.patch(
  "/",
  asyncHandler(updateAccount),
);

export default router;