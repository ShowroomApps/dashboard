'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface ToastContextType {
  toast: {
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
  };
}

const defaultToast = {
  success: () => {},
  error: () => {},
  info: () => {},
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, title, description };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((title: string, description?: string) => addToast('success', title, description), [addToast]);
  const error = useCallback((title: string, description?: string) => addToast('error', title, description), [addToast]);
  const info = useCallback((title: string, description?: string) => addToast('info', title, description), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: { success, error, info } }}>
      {children}
      {/* Toast Notification Top-Right Overlay */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
              t.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-400'
                : t.type === 'error'
                ? 'bg-slate-900/95 border-rose-500/40 text-rose-400'
                : 'bg-slate-900/95 border-indigo-500/40 text-indigo-400'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />}

            <div className="flex-1 text-xs">
              <div className="font-semibold text-sm text-white">{t.title}</div>
              {t.description && <div className="text-slate-300 mt-0.5">{t.description}</div>}
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return defaultToast;
  }
  return context.toast;
}
