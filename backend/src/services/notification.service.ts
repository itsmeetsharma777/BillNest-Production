import {
  createNotification,
  countNotificationsByUserId,
  deleteNotification,
  findNotificationByIdForUser,
  findNotificationsByUserId,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../repositories/notification.repository";

import type {
  NotificationType,
} from "../models/notification.model";

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

export async function getNotificationsForOwner(
  ownerId: string,
  options: ListNotificationsOptions = {},
) {
  const shop = await getShopForOwner(ownerId);

  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const unreadOnly = options.unreadOnly ?? false;

  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] =
    await Promise.all([
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
      hasMore: page * limit < total,
    },
    unreadCount,
  };
}

export async function markNotificationAsReadForOwner(
  ownerId: string,
  notificationId: string,
) {
  const shop = await getShopForOwner(ownerId);

  const notification =
    await findNotificationByIdForUser(
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
    return markNotificationAsRead(
      notificationId,
      ownerId,
      shop._id.toString(),
    );
  }

  return notification;
}

export async function markAllNotificationsAsReadForOwner(
  ownerId: string,
) {
  const shop = await getShopForOwner(ownerId);

  const result =
    await markAllNotificationsAsRead(
      ownerId,
      shop._id.toString(),
    );

  return {
    modifiedCount: result.modifiedCount,
  };
}

export async function deleteNotificationForOwner(
  ownerId: string,
  notificationId: string,
) {
  const shop = await getShopForOwner(ownerId);

  const deleted =
    await deleteNotification(
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