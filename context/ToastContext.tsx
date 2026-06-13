'use client';
import { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
}

type Action =
  | { type: 'ADD'; toast: Toast }
  | { type: 'REMOVE'; id: string };

function reducer(state: Toast[], action: Action): Toast[] {
  if (action.type === 'ADD')    return [...state, action.toast];
  if (action.type === 'REMOVE') return state.filter(t => t.id !== action.id);
  return state;
}

const ToastContext = createContext<{
  toasts: Toast[];
  toast: (message: string, kind?: ToastKind) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, []);

  const toast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = `t-${Date.now()}-${Math.random()}`;
    dispatch({ type: 'ADD', toast: { id, message, kind } });
    setTimeout(() => dispatch({ type: 'REMOVE', id }), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
