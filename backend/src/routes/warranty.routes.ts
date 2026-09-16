import { Router } from "express";

import {
  createWarranty,
  getWarranties,
  getWarranty,
  updateWarranty,
  deactivateWarranty,
  getExpiringWarranties,
} from "../controllers/warranty.controller";

import {
  requireAuth,
} from "../middleware/auth.middleware";

import {
  requireRole,
} from "../middleware/role.middleware";

import {
  asyncHandler,
} from "../utils/async-handler";

const router =
  Router();

router.use(
  requireAuth,
);

router.use(
  requireRole("shopkeeper"),
);

/*
 * Keep /expiring before /:warrantyId.
 *
 * Otherwise Express could interpret
 * "expiring" as a warranty ID.
 */
router.get(
  "/expiring",
  asyncHandler(
    getExpiringWarranties,
  ),
);

router.post(
  "/",
  asyncHandler(
    createWarranty,
  ),
);

router.get(
  "/",
  asyncHandler(
    getWarranties,
  ),
);

router.get(
  "/:warrantyId",
  asyncHandler(
    getWarranty,
  ),
);

router.patch(
  "/:warrantyId",
  asyncHandler(
    updateWarranty,
  ),
);

router.post(
  "/:warrantyId/deactivate",
  asyncHandler(
    deactivateWarranty,
  ),
);

export default router;