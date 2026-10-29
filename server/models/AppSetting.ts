import mongoose, { Schema, Document } from "mongoose";

export interface IAppSetting extends Document {
  hotelName: string;
  hotelLocation: string;
  currency: string;
  currencySymbol: string;
  monthlyWasteBudgetINR: number;
  costReductionGoalPercent: number;
  autoDeductInventory: boolean;
  allowStaffEditHours: number;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppSettingSchema = new Schema<IAppSetting>(
  {
    hotelName: {
      type: String,
      default: "The Grand Regal Hotel & Convention Centre",
      trim: true,
    },
    hotelLocation: {
      type: String,
      default: "New Delhi / Mumbai",
      trim: true,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    currencySymbol: {
      type: String,
      default: "₹",
      trim: true,
    },
    monthlyWasteBudgetINR: {
      type: Number,
      default: 75000, // Monthly maximum target in INR
      min: [1000, "Monthly budget must be at least ₹1,000"],
    },
    costReductionGoalPercent: {
      type: Number,
      default: 18, // 18% reduction goal
      min: [1, "Goal must be at least 1%"],
      max: [90, "Goal cannot exceed 90%"],
    },
    autoDeductInventory: {
      type: Boolean,
      default: true,
    },
    allowStaffEditHours: {
      type: Number,
      default: 24, // Staff can edit own entries within 24 hours
    },
    updatedBy: {
      type: String,
      default: "System",
    },
  },
  {
    timestamps: true,
  }
);

export const AppSetting =
  mongoose.models.AppSetting ||
  mongoose.model<IAppSetting>("AppSetting", AppSettingSchema);
