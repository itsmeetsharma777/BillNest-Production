import {
  Router,
} from "express";

import {
  getInventoryMovements,
  getProductInventoryMovements,
  getInventoryValuation,
} from "../controllers/inventory-movement.controller";

import {
  adjustStock,
} from "../controllers/stock-adjustment.controller";

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
  requireRole(
    "shopkeeper",
  ),
);

/**
 * ============================================================
 * INVENTORY VALUATION
 * ============================================================
 *
 * IMPORTANT:
 * This route must come before:
 *
 * /products/:productId/...
 *
 * so "valuation" is never interpreted as a product ID.
 */

/**
 * GET
 * /api/inventory/valuation
 */
router.get(
  "/valuation",
  asyncHandler(
    getInventoryValuation,
  ),
);

/**
 * ============================================================
 * INVENTORY MOVEMENTS
 * ============================================================
 */

/**
 * GET
 * /api/inventory/movements
 */
router.get(
  "/movements",
  asyncHandler(
    getInventoryMovements,
  ),
);

/**
 * GET
 * /api/inventory/products/:productId/movements
 */
router.get(
  "/products/:productId/movements",
  asyncHandler(
    getProductInventoryMovements,
  ),
);

/**
 * ============================================================
 * STOCK ADJUSTMENT
 * ============================================================
 */

/**
 * POST
 * /api/inventory/products/:productId/adjust
 *
 * Add or remove stock manually.
 */
router.post(
  "/products/:productId/adjust",
  asyncHandler(
    adjustStock,
  ),
);

export default router;