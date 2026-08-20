import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { CheckCircle2, XCircle, AlertTriangle, X } from "lucide-react";

// =====================================================
// TOAST + CONFIRM SYSTEM
// =====================================================
//
// Replaces native alert()/confirm() everywhere with a
// consistent, styled UI that matches the rest of the app,
// instead of an ugly mismatched browser popup.
//
// Usage:
//   const { showToast } = useToast();
//   showToast("Post deleted", "success");
//
//   const confirm = useConfirm();
//   const ok = await confirm({
//     title: "Delete this post?",
//     message: "This cannot be undone.",
//   });
//   if (!ok) return;
// =====================================================

const ToastContext = createContext(null);
const ConfirmContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside UIProvider");
  return ctx;
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside UIProvider");
  return ctx;
}

let toastIdCounter = 0;

export function UIProvider({ children }) {
  // ===================================================
  // TOASTS
  // ===================================================

  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "success", duration = 3500) => {
      const id = ++toastIdCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  // ===================================================
  // CONFIRM MODAL
  // ===================================================

  const [confirmState, setConfirmState] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback(({ title, message, confirmLabel = "Delete", cancelLabel = "Cancel", danger = true }) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setConfirmState({ title, message, confirmLabel, cancelLabel, danger });
    });
  }, []);

  const handleConfirmResult = (result) => {
    setConfirmState(null);
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <ConfirmContext.Provider value={confirm}>
        {children}

        {/* =============================================
            TOAST STACK
        ============================================= */}

        <div className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex w-full max-w-[380px] -translate-x-1/2 flex-col gap-2 px-4">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex animate-[toastIn_0.25s_ease-out] items-start gap-2.5 rounded-xl border px-4 py-3 shadow-[0_14px_35px_rgba(48,65,58,0.14)] ${
                toast.type === "error"
                  ? "border-[#E6D2CF] bg-[#FFF9F8]"
                  : "border-[#DCE7E2] bg-white"
              }`}
            >
              {toast.type === "error" ? (
                <XCircle size={16} className="mt-0.5 shrink-0 text-[#A1746E]" />
              ) : (
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#6F8C82]" />
              )}

              <p className="flex-1 text-[12px] leading-5 text-[#3D4844]">
                {toast.message}
              </p>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-[#A0AAA6] transition-colors hover:text-[#697571]"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* =============================================
            CONFIRM MODAL
        ============================================= */}

        {confirmState && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#1A211F]/40 px-4 backdrop-blur-[2px]">
            <div className="w-full max-w-[380px] animate-[modalIn_0.2s_ease-out] rounded-2xl border border-[#E1E7E4] bg-white p-6 shadow-[0_24px_60px_rgba(30,35,35,0.2)]">

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FBF4F2]">
                <AlertTriangle size={18} className="text-[#A1746E]" />
              </div>

              <h3 className="mt-4 text-[16px] font-semibold text-[#202725]">
                {confirmState.title}
              </h3>

              {confirmState.message && (
                <p className="mt-2 text-[13px] leading-5 text-[#697571]">
                  {confirmState.message}
                </p>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => handleConfirmResult(false)}
                  className="flex-1 rounded-lg border border-[#E1E7E4] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#53615B] transition-colors hover:bg-[#F7F9F8]"
                >
                  {confirmState.cancelLabel}
                </button>

                <button
                  type="button"
                  onClick={() => handleConfirmResult(true)}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-[12px] font-semibold text-white transition-colors ${
                    confirmState.danger
                      ? "bg-[#B96E63] hover:bg-[#A25D53]"
                      : "bg-[#718F84] hover:bg-[#5F7D72]"
                  }`}
                >
                  {confirmState.confirmLabel}
                </button>
              </div>

            </div>
          </div>
        )}

        <style>{`
          @keyframes toastIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.96); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>

      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}