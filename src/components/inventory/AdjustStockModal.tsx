import React, { useState } from "react";
import { Modal } from "../common/Modal.tsx";
import { Ingredient } from "../../types/index.ts";
import { api } from "../../services/api.ts";
import { useToast } from "../../context/ToastContext.tsx";
import { Check, Boxes, Scale } from "lucide-react";

interface AdjustStockModalProps {
  ingredient: Ingredient | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  ingredient,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const [newQuantity, setNewQuantity] = useState<string>(
    ingredient ? String(ingredient.availableQuantity) : "0"
  );
  const [reason, setReason] = useState<string>("Physical stock count verification");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  React.useEffect(() => {
    if (ingredient) {
      setNewQuantity(String(ingredient.availableQuantity));
    }
  }, [ingredient]);

  if (!ingredient) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(newQuantity);
    if (isNaN(qty) || qty < 0) {
      toast.error("Please enter a valid non-negative quantity.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.adjustIngredientStock(ingredient._id, qty, reason);
      toast.success(
        `Adjusted stock for ${ingredient.name} from ${ingredient.availableQuantity} to ${qty} ${ingredient.unit}.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to adjust stock.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const diff = (parseFloat(newQuantity) || 0) - ingredient.availableQuantity;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Adjust Stock: ${ingredient.name}`}
      subtitle="Manual inventory adjustment with recorded audit trail"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-[#FAF9F5] border border-[#D5DDD8] rounded-lg text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-[#52796F]">Current Recorded Stock:</span>
            <strong className="text-[#12372A] font-mono">
              {ingredient.availableQuantity} {ingredient.unit}
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[#52796F]">Unit Valuation:</span>
            <strong className="text-[#12372A] font-mono">
              ₹{ingredient.costPerUnit} / {ingredient.unit}
            </strong>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#12372A] mb-1">
            New Physical Count ({ingredient.unit}) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#D5DDD8] p-2.5 pl-8 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden font-mono"
            />
            <Scale className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
          </div>

          {diff !== 0 && (
            <p className="mt-1 text-[11px] font-mono">
              Net Adjustment:{" "}
              <span className={diff > 0 ? "text-emerald-700 font-bold" : "text-red-600 font-bold"}>
                {diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)} {ingredient.unit} (₹
                {Math.abs(Math.round(diff * ingredient.costPerUnit)).toLocaleString("en-IN")})
              </span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#12372A] mb-1">
            Adjustment Reason / Notes <span className="text-red-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full text-xs rounded-lg border border-[#D5DDD8] bg-white p-2.5 focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-hidden"
          >
            <option value="Physical stock count verification">Physical stock count verification</option>
            <option value="Delivery variance reconciliation">Delivery variance reconciliation</option>
            <option value="Emergency banquet prep allocation">Emergency banquet prep allocation</option>
            <option value="Unrecorded kitchen transfer">Unrecorded kitchen transfer</option>
            <option value="Quality inspection cull">Quality inspection cull</option>
          </select>
        </div>

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
            <span>Confirm Adjustment</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
