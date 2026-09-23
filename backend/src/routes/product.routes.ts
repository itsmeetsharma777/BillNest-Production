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
  deleteProductImage,
  setPrimaryProductImage,
  uploadProductImage,
} from "../controllers/product-image.controller";

import {
  requireAuth,
} from "../middleware/auth.middleware";

import {
  requireRole,
} from "../middleware/role.middleware";

import {
  uploadProductImage as uploadProductImageMiddleware,
} from "../middleware/upload.middleware";

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
 * PRODUCT IMAGES
 * ============================================================
 *
 * POST
 * /api/products/:productId/images
 *
 * DELETE
 * /api/products/:productId/images/:imageId
 *
 * PATCH
 * /api/products/:productId/images/:imageId/primary
 *
 * These routes are intentionally before the generic
 * /:productId routes.
 */

/*
 * UPLOAD IMAGE
 */

router.post(
  "/:productId/images",
  uploadProductImageMiddleware,
  asyncHandler(
    uploadProductImage,
  ),
);

/*
 * DELETE IMAGE
 */

router.delete(
  "/:productId/images/:imageId",
  asyncHandler(
    deleteProductImage,
  ),
);

/*
 * SET PRIMARY IMAGE
 */

router.patch(
  "/:productId/images/:imageId/primary",
  asyncHandler(
    setPrimaryProductImage,
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