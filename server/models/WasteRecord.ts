import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWasteRecord extends Document {
  ingredient: Types.ObjectId;
  ingredientName: string;
  category: string;
  quantity: number;
  unit: "kg" | "g" | "litre" | "ml" | "pieces";
  normalizedKg: number; // For aggregate weight in kg
  costPerUnit: number; // Snapshot of unit cost in INR
  totalCost: number; // in INR ₹
  reason:
    | "Spoilage"
    | "Overproduction"
    | "Preparation waste"
    | "Expired ingredients"
    | "Storage errors"
    | "Plate waste"
    | "Other";
  kitchenStation: string;
  shift: string;
  recordedBy: Types.ObjectId;
  recordedByName: string;
  recordedByRole: string;
  notes?: string;
  recordDate: Date;
  deductedFromStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WasteRecordSchema = new Schema<IWasteRecord>(
  {
    ingredient: {
      type: Schema.Types.ObjectId,
      ref: "Ingredient",
      required: [true, "Ingredient reference is required"],
    },
    ingredientName: {
      type: String,
      required: [true, "Ingredient name is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0.001, "Quantity must be greater than zero"],
    },
    unit: {
      type: String,
      required: [true, "Unit is required"],
      enum: ["kg", "g", "litre", "ml", "pieces"],
    },
    normalizedKg: {
      type: Number,
      required: true,
      default: 0,
    },
    costPerUnit: {
      type: Number,
      required: [true, "Cost per unit snapshot is required"],
      min: [0, "Cost per unit cannot be negative"],
    },
    totalCost: {
      type: Number,
      required: [true, "Total cost is required"],
      min: [0, "Total cost cannot be negative"],
    },
    reason: {
      type: String,
      required: [true, "Waste reason is required"],
      enum: [
        "Spoilage",
        "Overproduction",
        "Preparation waste",
        "Expired ingredients",
        "Storage errors",
        "Plate waste",
        "Other",
      ],
    },
    kitchenStation: {
      type: String,
      required: [true, "Kitchen station is required"],
      default: "Main Kitchen",
      trim: true,
    },
    shift: {
      type: String,
      required: [true, "Kitchen shift is required"],
      default: "Morning Shift",
      trim: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recorded by user reference is required"],
    },
    recordedByName: {
      type: String,
      required: true,
      trim: true,
    },
    recordedByRole: {
      type: String,
      required: true,
      default: "staff",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    recordDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    deductedFromStock: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save calculate normalized kg if not set
WasteRecordSchema.pre("validate", function () {
  if (this.unit === "kg" || this.unit === "litre") {
    this.normalizedKg = this.quantity;
  } else if (this.unit === "g" || this.unit === "ml") {
    this.normalizedKg = this.quantity / 1000;
  } else if (this.unit === "pieces") {
    // Estimating average piece ~ 0.08 kg (e.g. egg/patty/bun)
    this.normalizedKg = this.quantity * 0.08;
  }
});

// Indexes for date ranges, reasons, stations, and ingredients
WasteRecordSchema.index({ recordDate: -1 });
WasteRecordSchema.index({ ingredient: 1, recordDate: -1 });
WasteRecordSchema.index({ reason: 1, recordDate: -1 });
WasteRecordSchema.index({ kitchenStation: 1, recordDate: -1 });
WasteRecordSchema.index({ recordedBy: 1, recordDate: -1 });

export const WasteRecord =
  mongoose.models.WasteRecord ||
  mongoose.model<IWasteRecord>("WasteRecord", WasteRecordSchema);
