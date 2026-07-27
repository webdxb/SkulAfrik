import { createContext, useCallback, useContext, useState, ReactNode } from 'react';

type Toast = { id: number; message: string; type: 'error' | 'success' };

interface ToastContextValue {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message: string, type: Toast['type']) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => remove(id), 6000);
  }, [remove]);

  const showError = useCallback((message: string) => push(message || 'Une erreur est survenue.', 'error'), [push]);
  const showSuccess = useCallback((message: string) => push(message, 'success'), [push]);

  return (
    <ToastContext.Provider value={{ showError, showSuccess }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={`rounded-lg shadow-lg px-4 py-3 text-sm text-white flex items-start justify-between gap-3 ${t.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'}`}
          >
            <span>{t.message}</span>
            <button onClick={() => remove(t.id)} className="opacity-80 hover:opacity-100 leading-none text-base">&times;</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé à l\'intérieur de <ToastProvider>');
  return ctx;
}
