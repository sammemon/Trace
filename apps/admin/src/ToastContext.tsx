import React, { createContext, useCallback, useContext, useState } from 'react';
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}
function generateId(): string {
  return (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
}
interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
}
const ToastContext = createContext<ToastContextValue | null>(null);
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback(
    (message: string, type: Toast['type'] = 'info') => {
      const id = generateId();
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        4000,
      );
    },
    [],
  );
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {' '}
      {children} <ToastContainer toasts={toasts} onRemove={removeToast} />{' '}
    </ToastContext.Provider>
  );
}
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}
const ICONS: Record<Toast['type'], string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};
function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {' '}
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast ${t.type}`}
          role="alert"
          aria-live="polite"
        >
          {' '}
          <span>{ICONS[t.type]}</span>{' '}
          <span style={{ flex: 1 }}>{t.message}</span>{' '}
          <button
            onClick={() => onRemove(t.id)}
            style={{ marginLeft: 8, opacity: 0.6, fontSize: 18, lineHeight: 1 }}
            aria-label="Dismiss notification"
          >
            ×
          </button>{' '}
        </div>
      ))}{' '}
    </div>
  );
}
