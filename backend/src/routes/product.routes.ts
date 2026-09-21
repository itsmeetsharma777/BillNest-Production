import {
  Router,
} from "express";

import {
  createProduct,
  deleteProduct,
  getProduct,
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

router.post(
  "/",
  asyncHandler(
    createProduct,
  ),
);

router.get(
  "/",
  asyncHandler(
    getProducts,
  ),
);

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