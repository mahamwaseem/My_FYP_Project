import React from 'react';
import { useToastStore } from '../../hooks/useStatements';

const ICONS = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

export function ToastContainer() {
  const { toasts } = useToastStore();
  if (!toasts.length) return null;
  return (
    <div className="fs-toast-container" role="alert" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`fs-toast fs-toast-${toast.type}`}>
          <span className="fs-toast-icon">{ICONS[toast.type]}</span>
          <div className="fs-toast-content">
            {toast.title && <div className="fs-toast-title">{toast.title}</div>}
            <div className="fs-toast-message">{toast.message}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
