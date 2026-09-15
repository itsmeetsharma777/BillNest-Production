import { Schema, model, type InferSchemaType } from "mongoose";

const auditLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      index: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },

    entityType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },

    entityId: {
      type: Schema.Types.ObjectId,
      index: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    ipAddress: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    userAgent: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  },
);

auditLogSchema.index({ shopId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });

export type AuditLog = InferSchemaType<typeof auditLogSchema>;

export const AuditLogModel = model("AuditLog", auditLogSchema);