import mongoose, { Schema, Document } from "mongoose";

export interface IIngredient extends Document {
  name: string;
  category:
    | "Vegetables & Produce"
    | "Meat & Poultry"
    | "Seafood"
    | "Dairy & Eggs"
    | "Bakery & Dry Goods"
    | "Oils, Sauces & Spices"
    | "Beverages";
  unit: "kg" | "g" | "litre" | "ml" | "pieces";
  availableQuantity: number;
  reorderLevel: number;
  costPerUnit: number; // in INR ₹
  supplier?: string;
  expiryDate?: Date;
  storageLocation: string;
  createdAt: Date;
  updatedAt: Date;
}

const IngredientSchema = new Schema<IIngredient>(
  {
    name: {
      type: String,
      required: [true, "Ingredient name is required"],
      trim: true,
      unique: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Vegetables & Produce",
        "Meat & Poultry",
        "Seafood",
        "Dairy & Eggs",
        "Bakery & Dry Goods",
        "Oils, Sauces & Spices",
        "Beverages",
      ],
      default: "Vegetables & Produce",
    },
    unit: {
      type: String,
      required: [true, "Unit of measurement is required"],
      enum: ["kg", "g", "litre", "ml", "pieces"],
      default: "kg",
    },
    availableQuantity: {
      type: Number,
      required: [true, "Available quantity is required"],
      min: [0, "Available quantity cannot be negative"],
      default: 0,
    },
    reorderLevel: {
      type: Number,
      required: [true, "Reorder level is required"],
      min: [0, "Reorder level cannot be negative"],
      default: 5,
    },
    costPerUnit: {
      type: Number,
      required: [true, "Cost per unit is required"],
      min: [0.01, "Cost per unit must be greater than 0"],
    },
    supplier: {
      type: String,
      trim: true,
      default: "Hotel Central Supply",
    },
    expiryDate: {
      type: Date,
    },
    storageLocation: {
      type: String,
      trim: true,
      default: "Walk-in Chiller",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast searching and low-stock queries
IngredientSchema.index({ category: 1 });
IngredientSchema.index({ availableQuantity: 1, reorderLevel: 1 });

export const Ingredient =
  mongoose.models.Ingredient ||
  mongoose.model<IIngredient>("Ingredient", IngredientSchema);
