export type UserRole = "manager" | "staff";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  kitchenStation: string;
  employeeId: string;
  active?: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface Ingredient {
  _id: string;
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
  expiryDate?: string;
  storageLocation: string;
  createdAt?: string;
  updatedAt?: string;
}

export type WasteReason =
  | "Spoilage"
  | "Overproduction"
  | "Preparation waste"
  | "Expired ingredients"
  | "Storage errors"
  | "Plate waste"
  | "Other";

export interface WasteRecord {
  _id: string;
  ingredient: string | Ingredient;
  ingredientName: string;
  category: string;
  quantity: number;
  unit: string;
  normalizedKg: number;
  costPerUnit: number;
  totalCost: number; // in INR ₹
  reason: WasteReason;
  kitchenStation: string;
  shift: string;
  recordedBy: string;
  recordedByName: string;
  recordedByRole: string;
  notes?: string;
  recordDate: string;
  deductedFromStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardKPIs {
  totalFoodWasteKg: number;
  totalWasteCostINR: number;
  recordedEntriesCount: number;
  monthToDateWasteKg: number;
  monthToDateWasteINR: number;
  monthlyBudgetINR: number;
  budgetUtilizedPercent: number;
  projectedSavingsTargetINR: number;
  actualSavingsMeasuredINR: number;
  costDiffPercent: number;
  totalIngredients: number;
  lowStockCount: number;
}

export interface ReasonBreakdownItem {
  reason: WasteReason;
  totalCostINR: number;
  totalKg: number;
  count: number;
  percentageOfCost: number;
}

export interface StationBreakdownItem {
  station: string;
  totalCostINR: number;
  totalKg: number;
  count: number;
  percentageOfCost: number;
}

export interface TopWastedIngredientItem {
  name: string;
  category: string;
  totalCostINR: number;
  totalKg: number;
  frequency: number;
}

export interface DashboardData {
  period: {
    type: string;
    startDate: string;
    endDate: string;
  };
  kpi: DashboardKPIs;
  reasonBreakdown: ReasonBreakdownItem[];
  stationBreakdown: StationBreakdownItem[];
  topWastedIngredients: TopWastedIngredientItem[];
  recentEntries: WasteRecord[];
}

export interface TrendDataPoint {
  date: string;
  label: string;
  totalCostINR: number;
  totalWeightKg: number;
  entryCount: number;
}

export interface Recommendation {
  id: string;
  title: string;
  priority: "HIGH" | "MEDIUM" | "OPPORTUNITY";
  category: string;
  finding: string;
  actionStep: string;
  projectedSavingsINR: number;
}

export interface AuditLogItem {
  _id: string;
  action: string;
  entityType: string;
  entityId?: string;
  performedByName: string;
  performedByRole: string;
  details: string;
  timestamp: string;
}

export interface AppSettings {
  _id?: string;
  hotelName: string;
  hotelLocation: string;
  currency: string;
  currencySymbol: string;
  monthlyWasteBudgetINR: number;
  costReductionGoalPercent: number;
  autoDeductInventory: boolean;
  allowStaffEditHours: number;
  updatedBy?: string;
}
