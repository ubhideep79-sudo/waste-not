import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAuditLog extends Document {
  action: string;
  entityType: "WasteRecord" | "Ingredient" | "User" | "AppSetting";
  entityId?: string;
  performedBy?: Types.ObjectId;
  performedByName: string;
  performedByRole: string;
  details: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: ["WasteRecord", "Ingredient", "User", "AppSetting"],
    },
    entityId: {
      type: String,
      trim: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    performedByName: {
      type: String,
      required: true,
      trim: true,
    },
    performedByRole: {
      type: String,
      required: true,
      default: "system",
    },
    details: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ entityType: 1, timestamp: -1 });

export const AuditLog =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
