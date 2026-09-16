import {
  Schema,
  model,
  type Document,
  type Types,
} from "mongoose";

export type NotificationType =
  | "invoice_created"
  | "invoice_paid"
  | "warranty_expiring"
  | "warranty_expired"
  | "document_uploaded"
  | "system";

export interface NotificationDocument
  extends Document {
  userId: Types.ObjectId;
  shopId?: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema =
  new Schema<NotificationDocument>(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      shopId: {
        type: Schema.Types.ObjectId,
        ref: "Shop",
        required: false,
        index: true,
      },

      type: {
        type: String,
        enum: [
          "invoice_created",
          "invoice_paid",
          "warranty_expiring",
          "warranty_expired",
          "document_uploaded",
          "system",
        ],
        required: true,
        index: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 160,
      },

      message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
      },

      link: {
        type: String,
        trim: true,
        maxlength: 500,
      },

      metadata: {
        type: Schema.Types.Mixed,
        default: undefined,
      },

      isRead: {
        type: Boolean,
        default: false,
        index: true,
      },

      readAt: {
        type: Date,
      },
    },
    {
      timestamps: true,
    },
  );

notificationSchema.index({
  userId: 1,
  shopId: 1,
  createdAt: -1,
});

notificationSchema.index({
  userId: 1,
  shopId: 1,
  isRead: 1,
});

export const NotificationModel =
  model<NotificationDocument>(
    "Notification",
    notificationSchema,
  );