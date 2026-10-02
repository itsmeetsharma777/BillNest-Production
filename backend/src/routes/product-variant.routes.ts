import { Router } from "express";
import { adjustVariantStock, createVariant, deleteVariant, getVariantByBarcode, listVariants, updateVariant } from "../controllers/product-variant.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();
router.use(requireAuth);
router.use(requireRole("shopkeeper"));
router.get("/barcode/:barcode", asyncHandler(getVariantByBarcode));
router.get("/:productId", asyncHandler(listVariants));
router.post("/:productId", asyncHandler(createVariant));
router.patch("/:productId/:variantId", asyncHandler(updateVariant));
router.delete("/:productId/:variantId", asyncHandler(deleteVariant));
router.post("/:productId/:variantId/adjust-stock", asyncHandler(adjustVariantStock));
export default router;
