import { Router } from "express";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../controllers/notification.controller";

import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { asyncHandler } from "../utils/async-handler";

const router = Router();

router.use(requireAuth);
router.use(requireRole("shopkeeper"));

router.get(
  "/",
  asyncHandler(getNotifications),
);

router.patch(
  "/:notificationId/read",
  asyncHandler(markNotificationAsRead),
);

router.patch(
  "/read-all",
  asyncHandler(markAllNotificationsAsRead),
);

router.delete(
  "/:notificationId",
  asyncHandler(deleteNotification),
);

export default router;