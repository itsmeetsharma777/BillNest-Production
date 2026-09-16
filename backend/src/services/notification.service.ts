import {
  countNotificationsByUserId,
  createNotification,
  deleteNotification,
  findNotificationByIdForUser,
  findNotificationsByUserId,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../repositories/notification.repository";

import type { NotificationType } from "../models/notification.model";

import { getShopForOwner } from "./shop.service";
import { ApiError } from "../utils/api-error";

interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

interface ListNotificationsOptions {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

/**
 * Internal notification creation helper.
 *
 * This is intended to be used by backend business events such as
 * invoice creation/payment, warranty events, document uploads,
 * and system events.
 */
export async function createNotificationForOwner(
  ownerId: string,
  input: CreateNotificationInput,
) {
  const shop = await getShopForOwner(ownerId);

  return createNotification({
    userId: ownerId,
    shopId: shop._id.toString(),
    type: input.type,
    title: input.title,
    message: input.message,

    ...(input.link
      ? {
          link: input.link,
        }
      : {}),

    ...(input.metadata
      ? {
          metadata: input.metadata,
        }
      : {}),
  });
}

/**
 * Get notifications belonging to the authenticated shopkeeper.
 */
export async function getNotificationsForOwner(
  ownerId: string,
  options: ListNotificationsOptions = {},
) {
  const shop = await getShopForOwner(ownerId);

  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const unreadOnly = options.unreadOnly ?? false;

  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    findNotificationsByUserId(ownerId, {
      skip,
      limit,
      unreadOnly,
      shopId: shop._id.toString(),
    }),

    countNotificationsByUserId(ownerId, {
      unreadOnly,
      shopId: shop._id.toString(),
    }),

    countNotificationsByUserId(ownerId, {
      unreadOnly: true,
      shopId: shop._id.toString(),
    }),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      hasMore: skip + notifications.length < total,
    },
    unreadCount,
  };
}

/**
 * Mark one notification as read.
 */
export async function markNotificationAsReadForOwner(
  ownerId: string,
  notificationId: string,
) {
  const shop = await getShopForOwner(ownerId);

  const notification = await findNotificationByIdForUser(
    notificationId,
    ownerId,
    shop._id.toString(),
  );

  if (!notification) {
    throw new ApiError(
      404,
      "Notification not found.",
      "NOTIFICATION_NOT_FOUND",
    );
  }

  if (!notification.isRead) {
    const updatedNotification = await markNotificationAsRead(
      notificationId,
      ownerId,
      shop._id.toString(),
    );

    if (!updatedNotification) {
      throw new ApiError(
        404,
        "Notification not found.",
        "NOTIFICATION_NOT_FOUND",
      );
    }

    return updatedNotification;
  }

  return notification;
}

/**
 * Mark all notifications belonging to the shopkeeper as read.
 */
export async function markAllNotificationsAsReadForOwner(
  ownerId: string,
) {
  const shop = await getShopForOwner(ownerId);

  const result = await markAllNotificationsAsRead(
    ownerId,
    shop._id.toString(),
  );

  return {
    modifiedCount: result.modifiedCount,
  };
}

/**
 * Delete one notification belonging to the authenticated shopkeeper.
 */
export async function deleteNotificationForOwner(
  ownerId: string,
  notificationId: string,
) {
  const shop = await getShopForOwner(ownerId);

  const deleted = await deleteNotification(
    notificationId,
    ownerId,
    shop._id.toString(),
  );

  if (!deleted) {
    throw new ApiError(
      404,
      "Notification not found.",
      "NOTIFICATION_NOT_FOUND",
    );
  }

  return deleted;
}