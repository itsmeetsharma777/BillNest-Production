import { Router } from "express";

import { downloadInvoicePdf } from "../controllers/invoice-pdf.controller";

import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(requireAuth);
router.use(requireRole("shopkeeper"));

router.get(
  "/:invoiceId/pdf",
  asyncHandler(downloadInvoicePdf),
);

export default router;