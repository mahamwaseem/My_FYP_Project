import React from 'react';
import { useToastStore } from '../../hooks/useReporting';

const ICONS = { success: '✓', error: '✕', info: 'ℹ' };

export function ToastContainer() {
  const { toasts } = useToastStore();
  if (!toasts.length) return null;
  return (
    <div className="rp-toast-container" role="alert" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`rp-toast rp-toast-${t.type}`}>
          <span className="rp-toast-icon">{ICONS[t.type]}</span>
          <div className="rp-toast-content">
            {t.title && <div className="rp-toast-title">{t.title}</div>}
            <div className="rp-toast-message">{t.message}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
