import { Router } from "express";

import {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customer.controller";

import {
  getCustomerLedger,
} from "../controllers/customer-ledger.controller";

import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(requireAuth);
router.use(requireRole("shopkeeper"));

router.post(
  "/",
  asyncHandler(createCustomer),
);

router.get(
  "/",
  asyncHandler(getCustomers),
);

/*
 * Customer financial ledger.
 *
 * This must come before /:customerId
 * so the route is explicit and predictable.
 */
router.get(
  "/:customerId/ledger",
  asyncHandler(getCustomerLedger),
);

router.get(
  "/:customerId",
  asyncHandler(getCustomer),
);

router.patch(
  "/:customerId",
  asyncHandler(updateCustomer),
);

router.delete(
  "/:customerId",
  asyncHandler(deleteCustomer),
);

export default router;