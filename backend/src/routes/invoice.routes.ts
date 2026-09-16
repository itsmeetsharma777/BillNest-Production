import { Router } from "express";

import {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  markInvoiceAsPaid,
  cancelInvoice,
} from "../controllers/invoice.controller";

import { downloadInvoicePdf } from "../controllers/invoice-pdf.controller";

import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(requireAuth);
router.use(requireRole("shopkeeper"));

router.post(
  "/",
  asyncHandler(createInvoice),
);

router.get(
  "/",
  asyncHandler(getInvoices),
);

router.get(
  "/:invoiceId",
  asyncHandler(getInvoice),
);

router.get(
  "/:invoiceId/pdf",
  asyncHandler(downloadInvoicePdf),
);

router.patch(
  "/:invoiceId",
  asyncHandler(updateInvoice),
);

router.post(
  "/:invoiceId/pay",
  asyncHandler(markInvoiceAsPaid),
);

router.post(
  "/:invoiceId/cancel",
  asyncHandler(cancelInvoice),
);

export default router;