import {
  Router,
} from "express";

import {
  createCustomer,
  getCustomers,
  getCustomer,
  getCustomerByPhone,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customer.controller";

import {
  getCustomerLedger,
} from "../controllers/customer-ledger.controller";

import {
  requireAuth,
} from "../middleware/auth.middleware";

import {
  requireRole,
} from "../middleware/role.middleware";

import {
  asyncHandler,
} from "../utils/async-handler";

const router =
  Router();

/*
 * =========================================================
 * AUTHENTICATION
 * =========================================================
 */

router.use(
  requireAuth,
);

router.use(
  requireRole(
    "shopkeeper",
  ),
);

/*
 * =========================================================
 * CREATE
 * =========================================================
 *
 * POST /customers
 */

router.post(
  "/",
  asyncHandler(
    createCustomer,
  ),
);

/*
 * =========================================================
 * LIST
 * =========================================================
 *
 * GET /customers
 *
 * This now returns the GLOBAL customer
 * directory rather than customers belonging
 * only to the current shop.
 */

router.get(
  "/",
  asyncHandler(
    getCustomers,
  ),
);

/*
 * =========================================================
 * PHONE LOOKUP
 * =========================================================
 *
 * GET /customers/by-phone?phone=9876543210
 *
 * IMPORTANT:
 *
 * This must come BEFORE /:customerId.
 */

router.get(
  "/by-phone",
  asyncHandler(
    getCustomerByPhone,
  ),
);

/*
 * =========================================================
 * CUSTOMER LEDGER
 * =========================================================
 *
 * This route remains shop-specific internally.
 *
 * The customer identity is global, but the
 * financial ledger must continue to respect
 * the current shop.
 */

router.get(
  "/:customerId/ledger",
  asyncHandler(
    getCustomerLedger,
  ),
);

/*
 * =========================================================
 * GET CUSTOMER
 * =========================================================
 */

router.get(
  "/:customerId",
  asyncHandler(
    getCustomer,
  ),
);

/*
 * =========================================================
 * UPDATE CUSTOMER
 * =========================================================
 */

router.patch(
  "/:customerId",
  asyncHandler(
    updateCustomer,
  ),
);

/*
 * =========================================================
 * DEACTIVATE CUSTOMER
 * =========================================================
 */

router.delete(
  "/:customerId",
  asyncHandler(
    deleteCustomer,
  ),
);

export default router;