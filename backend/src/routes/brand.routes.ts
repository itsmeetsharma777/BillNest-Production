import {
  Router,
} from "express";

import {
  createBrand,
  deleteBrand,
  getBrand,
  getBrands,
  updateBrand,
} from "../controllers/brand.controller";

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
    createBrand,
  ),
);

router.get(
  "/",
  asyncHandler(
    getBrands,
  ),
);

router.get(
  "/:brandId",
  asyncHandler(
    getBrand,
  ),
);

router.patch(
  "/:brandId",
  asyncHandler(
    updateBrand,
  ),
);

router.delete(
  "/:brandId",
  asyncHandler(
    deleteBrand,
  ),
);

export default router;