import React, { useState, useEffect, useCallback } from "react";
import { Ingredient } from "../../types/index.ts";
import { api } from "../../services/api.ts";
import { useAuth } from "../../context/AuthContext.tsx";
import { useToast } from "../../context/ToastContext.tsx";
import { IngredientModal } from "./IngredientModal.tsx";
import { AdjustStockModal } from "./AdjustStockModal.tsx";
import { ConfirmDialog } from "../common/ConfirmDialog.tsx";
import {
  Boxes,
  Search,
  PlusCircle,
  AlertTriangle,
  RotateCcw,
  Edit2,
  Trash2,
  SlidersHorizontal,
  Clock,
  IndianRupee,
} from "lucide-react";

const CATEGORIES = [
  "All",
  "Vegetables & Produce",
  "Meat & Poultry",
  "Seafood",
  "Dairy & Eggs",
  "Bakery & Dry Goods",
  "Oils, Sauces & Spices",
  "Beverages",
];

export const InventoryList: React.FC = () => {
  const { isManager } = useAuth();
  const toast = useToast();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [totalValuation, setTotalValuation] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showLowStockOnly, setShowLowStockOnly] = useState<boolean>(false);
  const [showExpiringOnly, setShowExpiringOnly] = useState<boolean>(false);

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(
    null
  );
  const [adjustingIngredient, setAdjustingIngredient] =
    useState<Ingredient | null>(null);
  const [deletingIngredient, setDeletingIngredient] =
    useState<Ingredient | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadIngredients = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getIngredients({
        search: search || undefined,
        category: selectedCategory !== "All" ? selectedCategory : undefined,
        lowStock: showLowStockOnly,
        expiringSoon: showExpiringOnly,
      });

      setIngredients(res.ingredients);
      setTotalValuation(res.totalValuationINR);
      setLowStockCount(res.lowStockCount);
    } catch (err: any) {
      toast.error("Failed to load inventory: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategory, showLowStockOnly, showExpiringOnly]);

  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  const handleDelete = async () => {
    if (!deletingIngredient) return;
    setIsDeleting(true);
    try {
      await api.deleteIngredient(deletingIngredient._id);
      toast.success(`Ingredient "${deletingIngredient.name}" has been deleted.`);
      setDeletingIngredient(null);
      loadIngredients();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete ingredient.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#12372A] font-display">
            Kitchen Inventory & Stock Control
          </h1>
          <p className="text-xs text-[#52796F]">
            Track hotel pantry stock, reorder levels, unit valuation in INR, and expiry dates
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => {
              setEditingIngredient(null);
              setIsAddEditModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#12372A] hover:bg-[#1E4D3A] rounded-lg shadow-xs transition-colors self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4 text-[#F2C94C]" />
            <span>Add Ingredient</span>
          </button>
        )}
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-[#D5DDD8] shadow-card flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#52796F] uppercase tracking-wider">
              Total Stock Valuation
            </p>
            <p className="text-xl font-bold text-[#12372A] font-display mt-0.5">
              ₹{totalValuation.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-[#2D6A4F]/10 text-[#2D6A4F]">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#D5DDD8] shadow-card flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#52796F] uppercase tracking-wider">
              Active Stock Items
            </p>
            <p className="text-xl font-bold text-[#12372A] font-display mt-0.5">
              {ingredients.length} items
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-[#12372A]/10 text-[#12372A]">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={`p-4 rounded-xl border shadow-card flex items-center justify-between cursor-pointer transition-colors ${
            lowStockCount > 0
              ? "bg-[#FFFBF0] border-[#FDE68A] hover:bg-[#FEF3C7]"
              : "bg-white border-[#D5DDD8]"
          }`}
        >
          <div>
            <p className="text-[11px] font-semibold text-[#D97706] uppercase tracking-wider">
              Low-Stock Alerts
            </p>
            <p className="text-xl font-bold text-[#B45309] font-display mt-0.5">
              {lowStockCount} items below threshold
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-[#F59E0B]/10 text-[#D97706]">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-white border border-[#D5DDD8] shadow-card space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search ingredient, supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#D5DDD8] pl-8 pr-3 py-2 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                showLowStockOnly
                  ? "bg-[#D97706] text-white shadow-xs"
                  : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low Stock Only ({lowStockCount})</span>
            </button>

            <button
              onClick={() => setShowExpiringOnly(!showExpiringOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                showExpiringOnly
                  ? "bg-[#7C3AED] text-white shadow-xs"
                  : "bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Expiring Within 3 Days</span>
            </button>

            {(search || selectedCategory !== "All" || showLowStockOnly || showExpiringOnly) && (
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("All");
                  setShowLowStockOnly(false);
                  setShowExpiringOnly(false);
                }}
                className="flex items-center gap-1 text-xs text-[#52796F] hover:text-[#12372A] font-semibold px-2 py-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pt-2 border-t border-slate-100 pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-[#12372A] text-white shadow-xs"
                  : "text-[#52796F] hover:bg-[#EAEFE9] hover:text-[#12372A]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Ingredients Table */}
      <div className="bg-white rounded-xl border border-[#D5DDD8] shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <div className="inline-block w-6 h-6 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
            <p>Loading inventory records...</p>
          </div>
        ) : ingredients.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Boxes className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No ingredients match your filter</p>
            <p className="text-[11px] text-slate-400">
              Clear your search or click "Add Ingredient" to register a new hotel pantry item.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF9F5] border-b border-[#D5DDD8] text-[11px] font-semibold uppercase tracking-wider text-[#52796F]">
                  <th className="py-3 px-4">Ingredient</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Stock Status</th>
                  <th className="py-3 px-4">Unit Cost (INR)</th>
                  <th className="py-3 px-4">Total Value</th>
                  <th className="py-3 px-4">Storage Location</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  {isManager && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEFE9]">
                {ingredients.map((ing) => {
                  const isLow = ing.availableQuantity <= ing.reorderLevel;
                  const isCritical = ing.availableQuantity <= ing.reorderLevel * 0.5;
                  const totalValue = ing.availableQuantity * ing.costPerUnit;

                  // Expiry calculation
                  let daysToExpiry: number | null = null;
                  if (ing.expiryDate) {
                    const diffTime = new Date(ing.expiryDate).getTime() - Date.now();
                    daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  }

                  return (
                    <tr
                      key={ing._id}
                      className={`hover:bg-[#F3FAF5]/60 transition-colors ${
                        isLow ? "bg-[#FFFDF5]" : ""
                      }`}
                    >
                      {/* Name & Supplier */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#12372A] text-xs">
                          {ing.name}
                        </div>
                        {ing.supplier && (
                          <div className="text-[10px] text-[#52796F]">
                            Supplier: {ing.supplier}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {ing.category}
                      </td>

                      {/* Stock Status with Reorder Indicator */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              isCritical
                                ? "text-red-600"
                                : isLow
                                ? "text-amber-600"
                                : "text-[#12372A]"
                            }`}
                          >
                            {ing.availableQuantity} {ing.unit}
                          </span>
                          {isLow && (
                            <span
                              className={`text-[10px] font-sans font-bold px-1.5 py-0.5 rounded ${
                                isCritical
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              Reorder (≤{ing.reorderLevel})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Unit Cost */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-700">
                        ₹{ing.costPerUnit} / {ing.unit}
                      </td>

                      {/* Total Value */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-[#12372A]">
                        ₹{Math.round(totalValue).toLocaleString("en-IN")}
                      </td>

                      {/* Storage */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {ing.storageLocation || "Walk-in Chiller"}
                      </td>

                      {/* Expiry */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {ing.expiryDate ? (
                          <div>
                            <span className="text-slate-800 font-medium">
                              {new Date(ing.expiryDate).toLocaleDateString(
                                "en-IN",
                                { day: "2-digit", month: "short", year: "numeric" }
                              )}
                            </span>
                            {daysToExpiry !== null && (
                              <span
                                className={`block text-[10px] font-bold ${
                                  daysToExpiry <= 0
                                    ? "text-red-600"
                                    : daysToExpiry <= 3
                                    ? "text-amber-600"
                                    : "text-slate-400"
                                }`}
                              >
                                {daysToExpiry <= 0
                                  ? "Expired!"
                                  : daysToExpiry === 1
                                  ? "Expires tomorrow"
                                  : `In ${daysToExpiry} days`}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Manager Actions */}
                      {isManager && (
                        <td className="py-3 px-4 whitespace-nowrap text-right space-x-1">
                          <button
                            onClick={() => setAdjustingIngredient(ing)}
                            className="p-1 text-slate-500 hover:text-[#12372A] hover:bg-slate-100 rounded transition-colors"
                            title="Adjust Physical Stock"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingIngredient(ing);
                              setIsAddEditModalOpen(true);
                            }}
                            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                            title="Edit Ingredient"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeletingIngredient(ing)}
                            className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Delete Ingredient"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Ingredient Modal */}
      <IngredientModal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        onSuccess={loadIngredients}
        initialData={editingIngredient}
      />

      {/* Adjust Stock Modal */}
      <AdjustStockModal
        ingredient={adjustingIngredient}
        isOpen={!!adjustingIngredient}
        onClose={() => setAdjustingIngredient(null)}
        onSuccess={loadIngredients}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingIngredient}
        onClose={() => setDeletingIngredient(null)}
        onConfirm={handleDelete}
        title="Delete Inventory Ingredient"
        message={`Are you sure you want to delete "${deletingIngredient?.name}"? The system will verify that no historical food waste records depend on this ingredient before allowing deletion.`}
        confirmLabel="Delete Ingredient"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
