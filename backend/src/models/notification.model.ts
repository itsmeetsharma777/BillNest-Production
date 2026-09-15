import { Schema, model, type InferSchemaType } from "mongoose";

const notificationSchema = new Schema(
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
      maxlength: 200,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    link: {
      type: String,
      trim: true,
      maxlength: 2048,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
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

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export type Notification = InferSchemaType<typeof notificationSchema>;

export const NotificationModel = model("Notification", notificationSchema);