import type { Response } from "express";

import {
  getNotificationsForOwner,
  markNotificationAsReadForOwner,
  markAllNotificationsAsReadForOwner,
  deleteNotificationForOwner,
} from "../services/notification.service";

import type { AuthenticatedRequest } from "../middleware/auth.middleware";

function getNotificationId(
  req: AuthenticatedRequest,
): string {
  const notificationId =
    req.params.notificationId;

  if (typeof notificationId !== "string") {
    throw new Error("Invalid notification ID.");
  }

  return notificationId;
}

export async function getNotifications(
  req: AuthenticatedRequest,
  res: Response,
) {
  const page = Math.max(
    1,
    Number(req.query.page) || 1,
  );

  const limit = Math.min(
    100,
    Math.max(
      1,
      Number(req.query.limit) || 20,
    ),
  );

  const unreadOnly =
    req.query.unreadOnly === "true";

  const result =
    await getNotificationsForOwner(
      req.user.id,
      {
        page,
        limit,
        unreadOnly,
      },
    );

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function markNotificationAsRead(
  req: AuthenticatedRequest,
  res: Response,
) {
  const notificationId =
    getNotificationId(req);

  const notification =
    await markNotificationAsReadForOwner(
      req.user.id,
      notificationId,
    );

  res.status(200).json({
    success: true,
    message: "Notification marked as read.",
    data: {
      notification,
    },
  });
}

export async function markAllNotificationsAsRead(
  req: AuthenticatedRequest,
  res: Response,
) {
  const result =
    await markAllNotificationsAsReadForOwner(
      req.user.id,
    );

  res.status(200).json({
    success: true,
    message: "All notifications marked as read.",
    data: result,
  });
}

export async function deleteNotification(
  req: AuthenticatedRequest,
  res: Response,
) {
  const notificationId =
    getNotificationId(req);

  await deleteNotificationForOwner(
    req.user.id,
    notificationId,
  );

  res.status(200).json({
    success: true,
    message: "Notification deleted successfully.",
  });
}