import type { Response } from "express";
import mongoose from "mongoose";

import {
  getNotificationsForOwner,
  markNotificationAsReadForOwner,
  markAllNotificationsAsReadForOwner,
  deleteNotificationForOwner,
} from "../services/notification.service";

import {
  notificationListQuerySchema,
  notificationIdParamSchema,
} from "../validators/notification.validator";

import type { AuthenticatedRequest } from "../middleware/auth.middleware";

import { ApiError } from "../utils/api-error";

function getAuthenticatedUserId(
  req: AuthenticatedRequest,
): string {
  const userId = req.user?.id;

  if (
    typeof userId !== "string" ||
    !mongoose.isValidObjectId(userId)
  ) {
    throw new ApiError(
      401,
      "Invalid authenticated user.",
      "INVALID_AUTHENTICATED_USER",
    );
  }

  return userId;
}

function getNotificationId(
  req: AuthenticatedRequest,
): string {
  const parsed = notificationIdParamSchema.parse(
    req.params,
  );

  return parsed.notificationId;
}

export async function getNotifications(
  req: AuthenticatedRequest,
  res: Response,
) {
  const query = notificationListQuerySchema.parse(
    req.query,
  );

  const result = await getNotificationsForOwner(
    getAuthenticatedUserId(req),
    {
      page: query.page,
      limit: query.limit,
      unreadOnly: query.unreadOnly,
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
  const notification =
    await markNotificationAsReadForOwner(
      getAuthenticatedUserId(req),
      getNotificationId(req),
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
      getAuthenticatedUserId(req),
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
  await deleteNotificationForOwner(
    getAuthenticatedUserId(req),
    getNotificationId(req),
  );

  res.status(200).json({
    success: true,
    message: "Notification deleted successfully.",
  });
}