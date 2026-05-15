import React from 'react';

// ── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ width, height, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width: width || '100%', height: height || '16px', ...style }}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <table className="data-table" style={{ width: '100%' }}>
      <thead>
        <tr>
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i}><Skeleton width="80%" /></th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c}><Skeleton width={c === 0 ? '120px' : '80%'} /></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function CardSkeleton() {
  return (
    <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <Skeleton height="20px" width="40%" />
      <Skeleton height="14px" />
      <Skeleton height="14px" width="85%" />
      <Skeleton height="14px" width="70%" />
    </div>
  );
}

// ── Error Boundary ─────────────────────────────────────────────────────────
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-alert" style={{ margin: '16px 0' }}>
          <span>⚠</span>
          <div>
            <strong>Something went wrong.</strong>{' '}
            {this.props.fallbackMessage || 'Please refresh or try again.'}
            <div style={{ marginTop: '6px' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Modal ─────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, size = 'md', children, footer }) {
  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className={`modal modal-${size}`}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading = false }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title || 'Confirm Action'}
      size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
        {message}
      </p>
    </Modal>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────
export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', padding: '12px' }}>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        ← Prev
      </button>
      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', padding: '0 8px' }}>
        Page {page} of {totalPages}
      </span>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next →
      </button>
    </div>
  );
}
