import {
  Router,
} from "express";

import {
  getInventoryMovements,
  getProductInventoryMovements,
} from "../controllers/inventory-movement.controller";

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

/*
 * ============================================================
 * AUTHENTICATION
 * ============================================================
 */

router.use(
  requireAuth,
);

/*
 * ============================================================
 * SHOPKEEPER ONLY
 * ============================================================
 */

router.use(
  requireRole(
    "shopkeeper",
  ),
);

/*
 * ============================================================
 * INVENTORY MOVEMENT HISTORY
 * ============================================================
 *
 * GET /api/inventory/movements
 */
router.get(
  "/movements",
  asyncHandler(
    getInventoryMovements,
  ),
);

/*
 * ============================================================
 * PRODUCT-SPECIFIC HISTORY
 * ============================================================
 *
 * GET /api/inventory/products/:productId/movements
 */
router.get(
  "/products/:productId/movements",
  asyncHandler(
    getProductInventoryMovements,
  ),
);

export default router;