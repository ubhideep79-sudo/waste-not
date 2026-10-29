import React from "react";
import { Modal } from "./Modal.tsx";
import { AlertTriangle, Trash2, Check } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = false,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="flex items-start gap-3 py-1">
        <div
          className={`p-2.5 rounded-full shrink-0 ${
            isDestructive ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
          }`}
        >
          {isDestructive ? (
            <Trash2 className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
        </div>
        <p className="text-xs text-slate-600 leading-relaxed pt-1">{message}</p>
      </div>

      <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white transition-colors disabled:opacity-50 ${
            isDestructive
              ? "bg-red-600 hover:bg-red-700 shadow-xs"
              : "bg-[#12372A] hover:bg-[#1E4D3A] shadow-xs"
          }`}
        >
          {isLoading ? (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isDestructive ? (
            <Trash2 className="w-3.5 h-3.5" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          <span>{confirmLabel}</span>
        </button>
      </div>
    </Modal>
  );
};
