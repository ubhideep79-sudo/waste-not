import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

interface ToastContextType {
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (type: ToastType, message: string, title?: string) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, message, title }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toast = {
    success: (msg: string, title?: string) => addToast("success", msg, title),
    error: (msg: string, title?: string) => addToast("error", msg, title),
    info: (msg: string, title?: string) => addToast("info", msg, title),
    warning: (msg: string, title?: string) => addToast("warning", msg, title),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const bgColors = {
            success: "bg-[#12372A] text-white border-[#2D6A4F]",
            error: "bg-[#4A0E0E] text-white border-[#8B2626]",
            warning: "bg-[#452B06] text-[#FDE68A] border-[#92400E]",
            info: "bg-[#1E293B] text-white border-[#334155]",
          };

          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-[#74C69D] shrink-0" />,
            error: <AlertCircle className="w-5 h-5 text-[#F87171] shrink-0" />,
            warning: <AlertTriangle className="w-5 h-5 text-[#FBBF24] shrink-0" />,
            info: <Info className="w-5 h-5 text-[#60A5FA] shrink-0" />,
          };

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg text-xs transition-all animate-in fade-in slide-in-from-bottom-2 ${bgColors[t.type]}`}
            >
              {icons[t.type]}
              <div className="flex-1 min-w-0">
                {t.title && (
                  <p className="font-semibold text-sm mb-0.5">{t.title}</p>
                )}
                <p className="leading-relaxed opacity-95">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="opacity-70 hover:opacity-100 p-0.5 rounded transition-opacity"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
