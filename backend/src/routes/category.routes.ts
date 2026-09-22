import {
  Router,
} from "express";

import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategory,
  updateCategory,
} from "../controllers/category.controller";

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
    createCategory,
  ),
);

router.get(
  "/",
  asyncHandler(
    getCategories,
  ),
);

router.get(
  "/:categoryId",
  asyncHandler(
    getCategory,
  ),
);

router.patch(
  "/:categoryId",
  asyncHandler(
    updateCategory,
  ),
);

router.delete(
  "/:categoryId",
  asyncHandler(
    deleteCategory,
  ),
);

export default router;