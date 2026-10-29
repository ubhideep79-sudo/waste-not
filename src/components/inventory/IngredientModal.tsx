import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal.tsx";
import { Ingredient } from "../../types/index.ts";
import { api } from "../../services/api.ts";
import { useToast } from "../../context/ToastContext.tsx";
import { Check, Boxes, MapPin, IndianRupee } from "lucide-react";

interface IngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Ingredient | null;
}

const CATEGORIES = [
  "Vegetables & Produce",
  "Meat & Poultry",
  "Seafood",
  "Dairy & Eggs",
  "Bakery & Dry Goods",
  "Oils, Sauces & Spices",
  "Beverages",
] as const;

const STORAGE_LOCATIONS = [
  "Walk-in Chiller",
  "Deep Freezer",
  "Dry Pantry",
  "Veg Prep Chiller",
  "Pastry Chiller",
  "Butchery Cool Room",
];

export const IngredientModal: React.FC<IngredientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const toast = useToast();

  const [name, setName] = useState<string>("");
  const [category, setCategory] = useState<typeof CATEGORIES[number]>("Vegetables & Produce");
  const [unit, setUnit] = useState<"kg" | "g" | "litre" | "ml" | "pieces">("kg");
  const [availableQuantity, setAvailableQuantity] = useState<string>("0");
  const [reorderLevel, setReorderLevel] = useState<string>("5");
  const [costPerUnit, setCostPerUnit] = useState<string>("");
  const [supplier, setSupplier] = useState<string>("");
  const [storageLocation, setStorageLocation] = useState<string>("Walk-in Chiller");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCategory(initialData.category as any);
      setUnit(initialData.unit);
      setAvailableQuantity(String(initialData.availableQuantity));
      setReorderLevel(String(initialData.reorderLevel));
      setCostPerUnit(String(initialData.costPerUnit));
      setSupplier(initialData.supplier || "");
      setStorageLocation(initialData.storageLocation || "Walk-in Chiller");
      setExpiryDate(
        initialData.expiryDate ? initialData.expiryDate.split("T")[0] : ""
      );
    } else {
      setName("");
      setCategory("Vegetables & Produce");
      setUnit("kg");
      setAvailableQuantity("0");
      setReorderLevel("5");
      setCostPerUnit("");
      setSupplier("");
      setStorageLocation("Walk-in Chiller");
      setExpiryDate("");
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numQty = parseFloat(availableQuantity);
    const numReorder = parseFloat(reorderLevel);
    const numCost = parseFloat(costPerUnit);

    if (numQty < 0) {
      toast.error("Available quantity cannot be negative.");
      return;
    }
    if (numCost <= 0) {
      toast.error("Cost per unit must be greater than zero.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialData) {
        await api.updateIngredient(initialData._id, {
          name,
          category,
          unit,
          availableQuantity: numQty,
          reorderLevel: numReorder,
          costPerUnit: numCost,
          supplier,
          storageLocation,
          expiryDate: expiryDate ? expiryDate : undefined,
        });
        toast.success(`Updated ingredient "${name}".`);
      } else {
        await api.createIngredient({
          name,
          category,
          unit,
          availableQuantity: numQty,
          reorderLevel: numReorder,
          costPerUnit: numCost,
          supplier,
          storageLocation,
          expiryDate: expiryDate ? expiryDate : undefined,
        });
        toast.success(`Added new ingredient "${name}" to inventory.`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save ingredient.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Ingredient Details" : "Add Inventory Ingredient"}
      subtitle="Configure stock parameters, reorder thresholds, and unit costs in INR"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Ingredient Name */}
        <div>
          <label className="block text-xs font-semibold text-[#12372A] mb-1">
            Ingredient Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Basmati Rice Royal or Fresh Button Mushrooms"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-xs rounded-lg border border-[#D5DDD8] p-2.5 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden"
          />
        </div>

        {/* Category & Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#12372A] mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full text-xs rounded-lg border border-[#D5DDD8] bg-white p-2.5 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#12372A] mb-1">
              Unit of Measure <span className="text-red-500">*</span>
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as any)}
              className="w-full text-xs rounded-lg border border-[#D5DDD8] bg-white p-2.5 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden"
            >
              <option value="kg">Kilograms (kg)</option>
              <option value="g">Grams (g)</option>
              <option value="litre">Litres (L)</option>
              <option value="ml">Millilitres (ml)</option>
              <option value="pieces">Pieces / Units</option>
            </select>
          </div>
        </div>

        {/* Cost Per Unit & Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#12372A] mb-1">
              Unit Cost (INR ₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="₹ / unit"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
                className="w-full text-xs rounded-lg border border-[#D5DDD8] p-2.5 pl-8 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden font-mono"
              />
              <IndianRupee className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#12372A] mb-1">
              Available Stock ({unit}) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={availableQuantity}
              onChange={(e) => setAvailableQuantity(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#D5DDD8] p-2.5 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#12372A] mb-1">
              Reorder Threshold ({unit})
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={reorderLevel}
              onChange={(e) => setReorderLevel(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#D5DDD8] p-2.5 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden font-mono"
            />
          </div>
        </div>

        {/* Storage Location & Expiry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#12372A] mb-1">
              Storage Location
            </label>
            <select
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#D5DDD8] bg-white p-2.5 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden"
            >
              {STORAGE_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#12372A] mb-1">
              Batch Expiry Date (Optional)
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#D5DDD8] p-2.5 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden font-mono"
            />
          </div>
        </div>

        {/* Supplier */}
        <div>
          <label className="block text-xs font-semibold text-[#12372A] mb-1">
            Supplier / Vendor Name
          </label>
          <input
            type="text"
            placeholder="e.g. Heritage Dairies or Modern Meat Packers"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            className="w-full text-xs rounded-lg border border-[#D5DDD8] p-2.5 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden"
          />
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#12372A] hover:bg-[#1E4D3A] rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4 text-[#74C69D]" />
            )}
            <span>{initialData ? "Save Changes" : "Create Ingredient"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
