import { Router } from "express";

import {
  getDashboard,
  getInvoices,
  getInvoice,
  downloadCustomerInvoicePdf,
  getWarranties,
  getWarranty,
} from "../controllers/customer-portal.controller";

import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(requireAuth);
router.use(requireRole("customer"));

router.get(
  "/dashboard",
  asyncHandler(getDashboard),
);

router.get(
  "/invoices",
  asyncHandler(getInvoices),
);

router.get(
  "/invoices/:invoiceId/pdf",
  asyncHandler(downloadCustomerInvoicePdf),
);

router.get(
  "/invoices/:invoiceId",
  asyncHandler(getInvoice),
);

router.get(
  "/warranties",
  asyncHandler(getWarranties),
);

router.get(
  "/warranties/:warrantyId",
  asyncHandler(getWarranty),
);

export default router;