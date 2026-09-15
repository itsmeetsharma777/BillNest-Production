import { Router } from "express";
import {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customer.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(requireAuth);
router.use(requireRole("shopkeeper"));

router.post("/", asyncHandler(createCustomer));

router.get("/", asyncHandler(getCustomers));

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