import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal.tsx";
import { Ingredient, WasteReason, WasteRecord } from "../../types/index.ts";
import { api } from "../../services/api.ts";
import { useAuth } from "../../context/AuthContext.tsx";
import { useToast } from "../../context/ToastContext.tsx";
import {
  AlertTriangle,
  Scale,
  Sparkles,
  Layers,
  MapPin,
  Calendar,
  CheckCircle,
} from "lucide-react";

interface RecordWasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: WasteRecord | null;
}

const REASONS: WasteReason[] = [
  "Spoilage",
  "Overproduction",
  "Preparation waste",
  "Expired ingredients",
  "Storage errors",
  "Plate waste",
  "Other",
];

const STATIONS = [
  "Main Kitchen",
  "Banquet Kitchen",
  "Bakery & Pastry",
  "Butchery",
  "Cold Prep / Garde Manger",
  "Room Service",
];

const SHIFTS = [
  "Morning Shift (06:00 - 14:00)",
  "Afternoon Shift (14:00 - 22:00)",
  "Evening Shift (18:00 - 02:00)",
  "Night Shift (22:00 - 06:00)",
];

export const RecordWasteModal: React.FC<RecordWasteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const { user } = useAuth();
  const toast = useToast();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [unit, setUnit] = useState<string>("kg");
  const [reason, setReason] = useState<WasteReason>("Spoilage");
  const [kitchenStation, setKitchenStation] = useState<string>(
    user?.kitchenStation || "Main Kitchen"
  );
  const [shift, setShift] = useState<string>("Morning Shift (06:00 - 14:00)");
  const [recordDate, setRecordDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState<string>("");
  const [deductFromStock, setDeductFromStock] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch ingredients for dropdown
  useEffect(() => {
    if (isOpen) {
      api.getIngredients()
        .then((res) => {
          setIngredients(res.ingredients);
          if (initialData) {
            const ingId =
              typeof initialData.ingredient === "object"
                ? initialData.ingredient._id
                : initialData.ingredient;
            setSelectedIngredientId(ingId);
            setQuantity(String(initialData.quantity));
            setUnit(initialData.unit);
            setReason(initialData.reason);
            setKitchenStation(initialData.kitchenStation);
            setShift(initialData.shift);
            setRecordDate(initialData.recordDate.split("T")[0]);
            setNotes(initialData.notes || "");
            setDeductFromStock(false);
          } else if (res.ingredients.length > 0 && !selectedIngredientId) {
            setSelectedIngredientId(res.ingredients[0]._id);
            setUnit(res.ingredients[0].unit);
          }
        })
        .catch((err) => {
          toast.error("Failed to load ingredients: " + err.message);
        });
    }
  }, [isOpen, initialData]);

  const selectedIngredient = ingredients.find(
    (i) => i._id === selectedIngredientId
  );

  // Handle ingredient change: sync unit
  const handleIngredientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedIngredientId(id);
    const found = ingredients.find((i) => i._id === id);
    if (found) {
      setUnit(found.unit);
    }
  };

  // Live Cost Calculation
  const numQty = parseFloat(quantity) || 0;
  let unitMultiplier = 1;
  if (selectedIngredient) {
    if (selectedIngredient.unit === "kg" && unit === "g") unitMultiplier = 0.001;
    else if (selectedIngredient.unit === "g" && unit === "kg") unitMultiplier = 1000;
    else if (selectedIngredient.unit === "litre" && unit === "ml") unitMultiplier = 0.001;
    else if (selectedIngredient.unit === "ml" && unit === "litre") unitMultiplier = 1000;
  }
  const estimatedCostINR = selectedIngredient
    ? Math.round(numQty * unitMultiplier * selectedIngredient.costPerUnit * 100) / 100
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredientId) {
      toast.error("Please select an ingredient.");
      return;
    }
    if (numQty <= 0) {
      toast.error("Please enter a valid waste quantity greater than zero.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialData) {
        // Edit existing
        await api.updateWasteRecord(initialData._id, {
          quantity: numQty,
          reason,
          kitchenStation,
          shift,
          recordDate,
          notes,
        });
        toast.success("Waste record updated successfully.");
      } else {
        // Create new
        const res = await api.recordWaste({
          ingredientId: selectedIngredientId,
          quantity: numQty,
          unit,
          reason,
          kitchenStation,
          shift,
          recordDate,
          notes,
          deductFromStock,
        });
        toast.success(res.message);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit waste record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Food Waste Record" : "Record Kitchen Food Waste"}
      subtitle="Log wasted ingredients with automatic INR cost snapshot & stock adjustments"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Ingredient Selector */}
        <div>
          <label className="block text-xs font-semibold text-[#12372A] mb-1">
            Ingredient / Food Item <span className="text-red-500">*</span>
          </label>
          <select
            disabled={!!initialData}
            value={selectedIngredientId}
            onChange={handleIngredientChange}
            required
            className="w-full text-xs rounded-lg border border-[#D5DDD8] bg-white p-2.5 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="">Select an ingredient...</option>
            {ingredients.map((ing) => (
              <option key={ing._id} value={ing._id}>
                {ing.name} ({ing.category}) — Stock: {ing.availableQuantity} {ing.unit} @ ₹{ing.costPerUnit}/{ing.unit}
              </option>
            ))}
          </select>

          {selectedIngredient && (
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#52796F]">
              <span>
                Available Stock:{" "}
                <strong className="text-[#12372A]">
                  {selectedIngredient.availableQuantity} {selectedIngredient.unit}
                </strong>
              </span>
              <span>
                Standard Price:{" "}
                <strong className="text-[#12372A]">
                  ₹{selectedIngredient.costPerUnit} / {selectedIngredient.unit}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Quantity & Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#12372A] mb-1">
              Quantity Wasted <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.001"
                required
                placeholder="e.g. 2.5"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full text-xs rounded-lg border border-[#D5DDD8] p-2.5 pl-8 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden font-mono"
              />
              <Scale className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#12372A] mb-1">
              Unit of Measure <span className="text-red-500">*</span>
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
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

        {/* Live Cost Estimation Banner */}
        <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#D5DDD8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F2C94C]" />
            <span className="text-xs text-[#2B3F36] font-medium">
              Calculated Loss Cost (INR):
            </span>
          </div>
          <span className="text-base font-bold text-[#12372A] font-mono">
            ₹{estimatedCostINR.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Waste Reason */}
        <div>
          <label className="block text-xs font-semibold text-[#12372A] mb-1">
            Waste Reason <span className="text-red-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as WasteReason)}
            required
            className="w-full text-xs rounded-lg border border-[#D5DDD8] bg-white p-2.5 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden"
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Station & Shift */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#12372A] mb-1">
              Kitchen Station <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={kitchenStation}
                onChange={(e) => setKitchenStation(e.target.value)}
                required
                className="w-full text-xs rounded-lg border border-[#D5DDD8] bg-white p-2.5 pl-8 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden"
              >
                {STATIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#12372A] mb-1">
              Shift <span className="text-red-500">*</span>
            </label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              required
              className="w-full text-xs rounded-lg border border-[#D5DDD8] bg-white p-2.5 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden"
            >
              {SHIFTS.map((sh) => (
                <option key={sh} value={sh}>
                  {sh}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-[#12372A] mb-1">
            Date of Occurrence
          </label>
          <div className="relative">
            <input
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#D5DDD8] p-2.5 pl-8 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden font-mono"
            />
            <Calendar className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-[#12372A] mb-1">
            Kitchen Observations / Corrective Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Returned from buffet line; trim percentage higher due to bone structure..."
            className="w-full text-xs rounded-lg border border-[#D5DDD8] p-2.5 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden"
          />
        </div>

        {/* Explicit Inventory Deduction Safeguard Checkbox */}
        {!initialData && (
          <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#D5DDD8] flex items-start gap-3">
            <input
              type="checkbox"
              id="deductFromStock"
              checked={deductFromStock}
              onChange={(e) => setDeductFromStock(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-[#2D6A4F] focus:ring-[#2D6A4F]"
            />
            <label htmlFor="deductFromStock" className="text-xs text-[#2B3F36] cursor-pointer">
              <span className="font-semibold text-[#12372A]">
                Deduct wasted quantity directly from active inventory stock
              </span>
              <p className="text-[11px] text-[#637C71] mt-0.5">
                Automatically decreases available quantity in warehouse records. Uncheck if this was plate return or already written off during stocktake.
              </p>
            </label>
          </div>
        )}

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
              <CheckCircle className="w-4 h-4 text-[#74C69D]" />
            )}
            <span>{initialData ? "Save Changes" : "Submit Waste Entry"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
