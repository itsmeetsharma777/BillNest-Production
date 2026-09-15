import { Router } from "express";
import {
  createShop,
  getMyShop,
  updateMyShop,
} from "../controllers/shop.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(requireAuth);
router.use(requireRole("shopkeeper"));

router.post("/", asyncHandler(createShop));
router.get("/me", asyncHandler(getMyShop));
router.patch("/me", asyncHandler(updateMyShop));

export default router;