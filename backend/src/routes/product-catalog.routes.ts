import { Router } from "express";
import {
  bulkUpdateProductStatus,
  exportProducts,
  getProductCatalogAnalytics,
  importProducts,
} from "../controllers/product-catalog.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();
router.use(requireAuth);
router.use(requireRole("shopkeeper"));

router.get("/analytics", asyncHandler(getProductCatalogAnalytics));
router.get("/export", asyncHandler(exportProducts));
router.post("/import", asyncHandler(importProducts));
router.patch("/bulk-status", asyncHandler(bulkUpdateProductStatus));

export default router;
