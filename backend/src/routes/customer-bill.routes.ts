import { Router } from "express";

import {
  uploadCustomerBill,
  getCustomerBills,
  getCustomerBill,
} from "../controllers/customer-bill.controller";

import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { uploadOcrImage } from "../middleware/upload.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(requireAuth);
router.use(requireRole("customer"));

router.get(
  "/",
  asyncHandler(getCustomerBills),
);

router.get(
  "/:billId",
  asyncHandler(getCustomerBill),
);

router.post(
  "/upload",
  uploadOcrImage,
  asyncHandler(uploadCustomerBill),
);

export default router;
