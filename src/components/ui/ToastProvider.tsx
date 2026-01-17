"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastPayload {
  id?: string;
  message: string;
  action?: ToastAction;
  durationMs?: number;
}

interface ToastContextValue {
  push: (toast: ToastPayload) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  const push = useCallback((toast: ToastPayload) => {
    const cryptoRef = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
    const id = cryptoRef?.randomUUID
      ? cryptoRef.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { ...toast, id }]);
  }, []);

  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map((toast) => {
      const timeout = toast.durationMs ?? 5000;
      return setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, timeout);
    });
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [toasts]);

  const contextValue = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto w-full max-w-sm rounded-2xl bg-black/90 px-4 py-3 text-sm text-white shadow-lg"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-left text-sm leading-5">{toast.message}</p>
              {toast.action ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-emerald-300"
                  onClick={() => {
                    toast.action?.onClick();
                    setToasts((current) =>
                      current.filter((item) => item.id !== toast.id),
                    );
                  }}
                >
                  {toast.action.label}
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
