import { Router } from "express";
import {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  markInvoiceAsPaid,
  cancelInvoice,
} from "../controllers/invoice.controller";
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