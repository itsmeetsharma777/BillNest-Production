import { Router } from "express";

import {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  markInvoiceAsPaid,
  cancelInvoice,
} from "../controllers/invoice.controller";

import {
  recordInvoicePayment,
  getInvoicePayments,
} from "../controllers/invoice-payment.controller";

import {
  downloadInvoicePdf,
} from "../controllers/invoice-pdf.controller";

import {
  requireAuth,
} from "../middleware/auth.middleware";

import {
  requireRole,
} from "../middleware/role.middleware";

import {
  asyncHandler,
} from "../utils/async-handler";

const router = Router();

router.use(requireAuth);

router.use(
  requireRole("shopkeeper"),
);

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

/*
 * ============================================================
 * PAYMENT HISTORY
 * ============================================================
 */

router.get(
  "/:invoiceId/payments",
  asyncHandler(getInvoicePayments),
);

/*
 * ============================================================
 * RECEIVE PAYMENT
 * ============================================================
 */

router.post(
  "/:invoiceId/payments",
  asyncHandler(recordInvoicePayment),
);

/*
 * ============================================================
 * GENERAL INVOICE UPDATE
 * ============================================================
 */

router.patch(
  "/:invoiceId",
  asyncHandler(updateInvoice),
);

/*
 * ============================================================
 * MARK COMPLETELY PAID
 * ============================================================
 */

router.post(
  "/:invoiceId/pay",
  asyncHandler(markInvoiceAsPaid),
);

/*
 * ============================================================
 * CANCEL
 * ============================================================
 */

router.post(
  "/:invoiceId/cancel",
  asyncHandler(cancelInvoice),
);

export default router;