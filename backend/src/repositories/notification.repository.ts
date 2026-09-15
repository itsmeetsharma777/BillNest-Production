import { Types } from "mongoose";
import { NotificationModel } from "../models/notification.model";

export async function findNotificationsByUserId(
  userId: string,
  options?: {
    skip?: number;
    limit?: number;
    unreadOnly?: boolean;
  },
) {
  const skip = options?.skip ?? 0;
  const limit = options?.limit ?? 20;

  const filter: {
    userId: Types.ObjectId;
    isRead?: boolean;
  } = {
    userId: new Types.ObjectId(userId),
  };

  if (options?.unreadOnly) {
    filter.isRead = false;
  }

  return NotificationModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
}

export async function createNotification(data: {
  userId: string;
  shopId?: string;
  type:
    | "invoice_created"
    | "invoice_paid"
    | "warranty_expiring"
    | "warranty_expired"
    | "document_uploaded"
    | "system";
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}) {
  return NotificationModel.create(data);
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
) {
  return NotificationModel.findOneAndUpdate(
    {
      _id: notificationId,
      userId,
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
    },
  );
}

export async function markAllNotificationsAsRead(userId: string) {
  return NotificationModel.updateMany(
    {
      userId,
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