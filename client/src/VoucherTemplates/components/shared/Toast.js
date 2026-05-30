import React from 'react';
import { useToastStore } from '../../hooks/useTemplates';

const ICONS = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

export function ToastContainer() {
  const { toasts } = useToastStore();
  if (!toasts.length) return null;
  return (
    <div className="vt-toast-container" role="alert" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`vt-toast vt-toast-${toast.type}`}>
          <span className="vt-toast-icon">{ICONS[toast.type]}</span>
          <div className="vt-toast-content">
            {toast.title && <div className="vt-toast-title">{toast.title}</div>}
            <div className="vt-toast-message">{toast.message}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
