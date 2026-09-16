import mongoose from "mongoose";

import {
  findNotificationsByUserId,
  countNotificationsByUserId,
  findNotificationByIdForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../repositories/notification.repository";

import { ApiError } from "../utils/api-error";

interface NotificationListOptions {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

function validateUserId(userId: string) {
  if (!mongoose.isValidObjectId(userId)) {
    throw new ApiError(
      401,
      "Invalid authenticated user.",
      "INVALID_AUTHENTICATED_USER",
    );
  }
}

function validateNotificationId(notificationId: string) {
  if (!mongoose.isValidObjectId(notificationId)) {
    throw new ApiError(
      400,
      "Invalid notification ID.",
      "INVALID_NOTIFICATION_ID",
    );
  }
}

export async function getNotificationsForCustomer(
  userId: string,
  options?: NotificationListOptions,
) {
  validateUserId(userId);

  const page = Math.max(
    options?.page ?? 1,
    1,
  );

  const limit = Math.min(
    Math.max(options?.limit ?? 20, 1),
    100,
  );

  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] =
    await Promise.all([
      findNotificationsByUserId(userId, {
        skip,
        limit,
        unreadOnly: options?.unreadOnly,
      }),

      countNotificationsByUserId(userId, {
        unreadOnly: options?.unreadOnly,
      }),

      countNotificationsByUserId(userId, {
        unreadOnly: true,
      }),
    ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      hasMore:
        skip + notifications.length < total,
    },
  };
}

export async function getNotificationForCustomer(
  userId: string,
  notificationId: string,
) {
  validateUserId(userId);
  validateNotificationId(notificationId);

  const notification =
    await findNotificationByIdForUser(
      notificationId,
      userId,
    );

  if (!notification) {
    throw new ApiError(
      404,
      "Notification not found.",
      "NOTIFICATION_NOT_FOUND",
    );
  }

  return notification;
}

export async function markCustomerNotificationAsRead(
  userId: string,
  notificationId: string,
) {
  validateUserId(userId);
  validateNotificationId(notificationId);

  const notification =
    await markNotificationAsRead(
      notificationId,
      userId,
    );

  if (!notification) {
    throw new ApiError(
      404,
      "Notification not found.",
      "NOTIFICATION_NOT_FOUND",
    );
  }

  return notification;
}

export async function markAllCustomerNotificationsAsRead(
  userId: string,
) {
  validateUserId(userId);

  return markAllNotificationsAsRead(userId);
}