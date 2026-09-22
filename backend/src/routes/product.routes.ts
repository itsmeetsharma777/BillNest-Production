
import {
  Router,
} from "express";

import {
  createProduct,
  deleteProduct,
  getProduct,
  getProductByBarcode,
  getProducts,
  updateProduct,
} from "../controllers/product.controller";

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

/*
 * ============================================================
 * CREATE
 * ============================================================
 */

router.post(
  "/",
  asyncHandler(
    createProduct,
  ),
);

/*
 * ============================================================
 * LIST
 * ============================================================
 */

router.get(
  "/",
  asyncHandler(
    getProducts,
  ),
);

/*
 * ============================================================
 * BARCODE LOOKUP
 * ============================================================
 *
 * Keep this BEFORE /:productId.
 */

router.get(
  "/barcode/:barcode",
  asyncHandler(
    getProductByBarcode,
  ),
);

/*
 * ============================================================
 * SINGLE PRODUCT
 * ============================================================
 */

router.get(
  "/:productId",
  asyncHandler(
    getProduct,
  ),
);

router.patch(
  "/:productId",
  asyncHandler(
    updateProduct,
  ),
);

router.delete(
  "/:productId",
  asyncHandler(
    deleteProduct,
  ),
);

export default router;