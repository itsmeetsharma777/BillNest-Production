import { Types } from "mongoose";

import {
  NotificationModel,
  type NotificationType,
} from "../models/notification.model";

type NotificationStatus = {
  userId: Types.ObjectId;
  shopId?: Types.ObjectId;
  isRead?: boolean;
};

function buildUserNotificationFilter(
  userId: string,
  options?: {
    unreadOnly?: boolean;
    shopId?: string;
  },
): NotificationStatus {
  const filter: NotificationStatus = {
    userId: new Types.ObjectId(userId),
  };

  if (options?.shopId) {
    filter.shopId = new Types.ObjectId(options.shopId);
  }

  if (options?.unreadOnly) {
    filter.isRead = false;
  }

  return filter;
}

export async function findNotificationsByUserId(
  userId: string,
  options?: {
    skip?: number;
    limit?: number;
    unreadOnly?: boolean;
    shopId?: string;
  },
) {
  const skip = options?.skip ?? 0;
  const limit = options?.limit ?? 20;

  const filter = buildUserNotificationFilter(userId, options);

  return NotificationModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
}

export async function countNotificationsByUserId(
  userId: string,
  options?: {
    unreadOnly?: boolean;
    shopId?: string;
  },
) {
  const filter = buildUserNotificationFilter(userId, options);

  return NotificationModel.countDocuments(filter);
}

export async function createNotification(data: {
  userId: string;
  shopId?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}) {
  return NotificationModel.create({
    userId: new Types.ObjectId(data.userId),

    ...(data.shopId
      ? {
          shopId: new Types.ObjectId(data.shopId),
        }
      : {}),

    type: data.type,
    title: data.title,
    message: data.message,

    ...(data.link
      ? {
          link: data.link,
        }
      : {}),

    ...(data.metadata
      ? {
          metadata: data.metadata,
        }
      : {}),
  });
}

/**
 * Find an existing notification generated for
 * a particular warranty event.
 *
 * This prevents the background scheduler from
 * creating the same notification repeatedly.
 */
export async function findNotificationByWarrantyEvent(
  userId: string,
  shopId: string,
  warrantyId: string,
  type: "warranty_expiring" | "warranty_expired",
) {
  return NotificationModel.findOne({
    userId: new Types.ObjectId(userId),
    shopId: new Types.ObjectId(shopId),
    type,
    "metadata.warrantyId": warrantyId,
  }).lean();
}

export async function findNotificationByIdForUser(
  notificationId: string,
  userId: string,
  shopId?: string,
) {
  return NotificationModel.findOne({
    _id: notificationId,
    userId: new Types.ObjectId(userId),

    ...(shopId
      ? {
          shopId: new Types.ObjectId(shopId),
        }
      : {}),
  });
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
  shopId?: string,
) {
  return NotificationModel.findOneAndUpdate(
    {
      _id: notificationId,
      userId: new Types.ObjectId(userId),

      ...(shopId
        ? {
            shopId: new Types.ObjectId(shopId),
          }
        : {}),

      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );
}

export async function markAllNotificationsAsRead(
  userId: string,
  shopId?: string,
) {
  return NotificationModel.updateMany(
    {
      userId: new Types.ObjectId(userId),

      ...(shopId
        ? {
            shopId: new Types.ObjectId(shopId),
          }
        : {}),

      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    },
  );
}

export async function deleteNotification(
  notificationId: string,
  userId: string,
  shopId?: string,
) {
  return NotificationModel.findOneAndDelete({
    _id: notificationId,
    userId: new Types.ObjectId(userId),

    ...(shopId
      ? {
          shopId: new Types.ObjectId(shopId),
        }
      : {}),
  });
}