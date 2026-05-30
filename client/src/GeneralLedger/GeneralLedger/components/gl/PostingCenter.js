import React, { useState, useEffect, useMemo } from 'react';
import { usePostingQueue, useToast } from '../../hooks/useGeneralLedger';
import { ledgerAPI } from '../../services/glApi';
import { TableSkeleton, ErrorBoundary, ConfirmDialog } from '../shared/UI';
import { formatCurrency, formatDate, formatDateTime, VOUCHER_TYPE_CONFIG, POSTING_STATUS_CONFIG } from '../../utils/glHelpers';
import './PostingCenter.css';

export default function PostingCenter() {
  const { queue: initialQueue, log: initialLog, loading } = usePostingQueue();
  const toast = useToast();

  // Local working copies so posting actions are reflected immediately.
  const [queue, setQueue] = useState([]);
  const [log, setLog] = useState([]);
  const [autoPost, setAutoPost] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [postingAll, setPostingAll] = useState(false);

  useEffect(() => { setQueue(initialQueue); }, [initialQueue]);
  useEffect(() => { setLog(initialLog); }, [initialLog]);

  const postableCount = useMemo(() => queue.filter((v) => v.balanced).length, [queue]);

  // Move a queued voucher into the posting log (POSTED) or flag it FAILED.
  const postOne = (voucher, via = 'Account User') => {
    const entry = {
      id: voucher.id,
      voucher_no: voucher.voucher_no,
      date: voucher.date,
      posted_at: new Date().toISOString(),
      posted_by: via,
      lines: voucher.lines,
      status: voucher.balanced ? 'POSTED' : 'FAILED',
      note: voucher.balanced ? undefined : 'Voucher is not balanced — debits ≠ credits',
    };
    setLog((l) => [entry, ...l]);
    setQueue((q) => q.filter((v) => v.id !== voucher.id));
    return entry.status;
  };

  const handlePostOne = async (voucher) => {
    if (!voucher.balanced) {
      toast.error(`${voucher.voucher_no} is unbalanced and cannot be posted.`, 'Post failed');
      return;
    }
    setBusyId(voucher.id);
    try {
      await ledgerAPI.postEntry(voucher.id).catch(() => {}); // backend optional in demo
      postOne(voucher);
      toast.success(`${voucher.voucher_no} posted to the ledgers.`, 'Posted');
    } finally { setBusyId(null); }
  };

  const handlePostAll = async () => {
    setPostingAll(true);
    try {
      await ledgerAPI.postAll().catch(() => {});
      const balanced = queue.filter((v) => v.balanced);
      balanced.forEach((v) => postOne(v, 'Batch Post'));
      toast.success(`${balanced.length} voucher${balanced.length !== 1 ? 's' : ''} posted.`, 'Batch complete');
      const skipped = queue.length - balanced.length;
      if (skipped > 0) toast.warning(`${skipped} unbalanced voucher${skipped !== 1 ? 's' : ''} skipped.`, 'Needs attention');
    } finally { setPostingAll(false); setConfirmAll(false); }
  };

  // Auto-post: when enabled, any balanced voucher in the queue is posted shortly
  // after it appears — mirrors a backend job that posts approved vouchers.
  useEffect(() => {
    if (!autoPost) return;
    const t = setTimeout(() => {
      const next = queue.find((v) => v.balanced);
      if (next) { postOne(next, 'Auto-Post'); toast.info(`${next.voucher_no} auto-posted.`, 'Auto-post'); }
    }, 1500);
    return () => clearTimeout(t);
  }, [autoPost, queue]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleAuto = async () => {
    const next = !autoPost;
    setAutoPost(next);
    await ledgerAPI.setAutoPost(next).catch(() => {});
    toast.info(next ? 'Balanced vouchers will post automatically.' : 'Automatic posting paused.',
      next ? 'Auto-post on' : 'Auto-post off');
  };

  return (
    <ErrorBoundary>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Posting Center</h1>
          <p className="page-subtitle">Post approved vouchers to their relevant ledgers, manually or automatically</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" disabled={!postableCount || postingAll} onClick={() => setConfirmAll(true)}>
            ↳ Post all ({postableCount})
          </button>
        </div>
      </div>

      {/* Auto-post control */}
      <div className={`autopost-bar${autoPost ? ' on' : ''}`}>
        <div className="autopost-info">
          <span className="autopost-dot" aria-hidden="true" />
          <div>
            <div className="autopost-title">Automatic posting {autoPost ? 'enabled' : 'disabled'}</div>
            <div className="autopost-desc">
              {autoPost
                ? 'Balanced vouchers are posted to the ledgers automatically as they arrive.'
                : 'Vouchers stay in the queue until you post them. Turn on to post balanced entries automatically.'}
            </div>
          </div>
        </div>
        <button
          type="button" role="switch" aria-checked={autoPost}
          className={`switch${autoPost ? ' on' : ''}`} onClick={toggleAuto}
        >
          <span className="switch-knob" />
        </button>
      </div>

      {/* Pending queue */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h2 style={{ fontSize: '1.05em', fontWeight: 600 }}>Pending Queue</h2>
          <span className="queue-count">{queue.length} awaiting posting</span>
        </div>
        <div className="data-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          {loading ? <TableSkeleton rows={4} cols={6} /> : queue.length === 0 ? (
            <div className="empty-state" style={{ padding: '44px' }}>
              <div className="empty-state-icon">✓</div>
              <h3>Queue is clear</h3>
              <p>All approved vouchers have been posted to the ledgers.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Voucher</th>
                  <th>Date</th>
                  <th>Particulars</th>
                  <th>Lines</th>
                  <th className="amount-cell">Amount</th>
                  <th>Check</th>
                  <th style={{ width: '110px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((v) => {
                  const vt = VOUCHER_TYPE_CONFIG[v.voucher_type] || {};
                  return (
                    <tr key={v.id} className={!v.balanced ? 'row-unbalanced' : ''}>
                      <td>
                        <span className="text-mono" style={{ color: 'var(--teal-700)', fontWeight: 500 }}>{v.voucher_no}</span>{' '}
                        <span className={`badge ${vt.color || ''}`}>{vt.abbr || v.voucher_type}</span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(v.date)}</td>
                      <td className="particulars-cell">{v.narration || '—'}</td>
                      <td className="text-num">{v.lines}</td>
                      <td className="amount-cell">{formatCurrency(v.total)}</td>
                      <td>
                        {v.balanced
                          ? <span className="check-ok">● Balanced</span>
                          : <span className="check-bad">▲ Unbalanced</span>}
                      </td>
                      <td>
                        <button
                          className="btn btn-success btn-sm"
                          disabled={!v.balanced || busyId === v.id}
                          onClick={() => handlePostOne(v)}
                        >
                          {busyId === v.id ? 'Posting…' : 'Post'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Posting log */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h2 style={{ fontSize: '1.05em', fontWeight: 600 }}>Posting Log</h2>
          <span className="queue-count">{log.length} record{log.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="data-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          {log.length === 0 ? (
            <div className="empty-state" style={{ padding: '36px' }}><p>No posting activity yet.</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Voucher</th>
                  <th>Posted At</th>
                  <th>Posted By</th>
                  <th>Lines</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {log.map((r, i) => {
                  const sc = POSTING_STATUS_CONFIG[r.status] || {};
                  return (
                    <tr key={`${r.id}-${i}`}>
                      <td className="text-mono" style={{ fontWeight: 500 }}>{r.voucher_no}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(r.posted_at)}</td>
                      <td>
                        <span className={`poster-tag${r.posted_by === 'Auto-Post' ? ' auto' : ''}`}>{r.posted_by}</span>
                      </td>
                      <td className="text-num">{r.lines}</td>
                      <td>
                        <span className={`badge ${sc.color || ''}`}>{sc.label || r.status}</span>
                        {r.note && <div className="log-note">{r.note}</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmAll}
        onClose={() => setConfirmAll(false)}
        onConfirm={handlePostAll}
        title="Post all balanced vouchers"
        message={`Post ${postableCount} balanced voucher${postableCount !== 1 ? 's' : ''} to the ledgers? Unbalanced vouchers will be skipped. Posted entries cannot be edited.`}
        confirmLabel="Post all"
        loading={postingAll}
      />
    </ErrorBoundary>
  );
}
