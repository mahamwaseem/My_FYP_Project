import React from 'react';
import { useToastStore } from '../../hooks/useAuthHooks';

const ICONS = { success: '✓', error: '✕', info: 'ℹ' };

export function ToastContainer() {
  const { toasts } = useToastStore();
  if (!toasts.length) return null;
  return (
    <div className="au-toast-container" role="alert" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`au-toast au-toast-${t.type}`}>
          <span className="au-toast-icon">{ICONS[t.type]}</span>
          <div className="au-toast-content">
            {t.title && <div className="au-toast-title">{t.title}</div>}
            <div className="au-toast-message">{t.message}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
