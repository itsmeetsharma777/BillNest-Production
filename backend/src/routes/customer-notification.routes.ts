import { Router } from "express";

import {
  getCustomerNotifications,
  getCustomerNotification,
  markCustomerNotificationRead,
  markAllCustomerNotificationsRead,
} from "../controllers/customer-notification.controller";

import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(requireAuth);
router.use(requireRole("customer"));

router.get(
  "/",
  asyncHandler(getCustomerNotifications),
);

router.get(
  "/:notificationId",
  asyncHandler(getCustomerNotification),
);

router.patch(
  "/read-all",
  asyncHandler(
    markAllCustomerNotificationsRead,
  ),
);

router.patch(
  "/:notificationId/read",
  asyncHandler(
    markCustomerNotificationRead,
  ),
);

export default router;