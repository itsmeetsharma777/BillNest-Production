import type { Response } from "express";
import mongoose from "mongoose";

import type { AuthenticatedRequest } from "../middleware/auth.middleware";

import {
  getNotificationsForCustomer,
  getNotificationForCustomer,
  markCustomerNotificationAsRead,
  markAllCustomerNotificationsAsRead,
} from "../services/customer-notification.service";

import {
  notificationListQuerySchema,
  notificationIdParamSchema,
} from "../validators/notification.validator";

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
  const parsed =
    notificationIdParamSchema.parse(
      req.params,
    );

  return parsed.notificationId;
}

export async function getCustomerNotifications(
  req: AuthenticatedRequest,
  res: Response,
) {
  const query =
    notificationListQuerySchema.parse(
      req.query,
    );

  const result =
    await getNotificationsForCustomer(
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

export async function getCustomerNotification(
  req: AuthenticatedRequest,
  res: Response,
) {
  const notification =
    await getNotificationForCustomer(
      getAuthenticatedUserId(req),
      getNotificationId(req),
    );

  res.status(200).json({
    success: true,
    data: {
      notification,
    },
  });
}

export async function markCustomerNotificationRead(
  req: AuthenticatedRequest,
  res: Response,
) {
  const notification =
    await markCustomerNotificationAsRead(
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

export async function markAllCustomerNotificationsRead(
  req: AuthenticatedRequest,
  res: Response,
) {
  const result =
    await markAllCustomerNotificationsAsRead(
      getAuthenticatedUserId(req),
    );

  res.status(200).json({
    success: true,
    message:
      "All notifications marked as read.",
    data: result,
  });
}