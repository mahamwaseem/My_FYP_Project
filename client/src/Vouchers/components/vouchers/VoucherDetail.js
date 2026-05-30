import React, { useState } from 'react';
import { useToast } from '../../hooks/useFinTrack';
import { voucherAPI } from '../../services/api';
import { formatCurrency, formatDate, formatDateTime, STATUS_CONFIG, VOUCHER_TYPE_CONFIG } from '../../utils/helpers';
import { Modal, ConfirmDialog, Skeleton } from '../shared/UI';
import './VoucherDetail.css';

// ── Fetch full voucher detail (handles { success, data } wrapper) ─────────────
function useVoucherDetail(voucherId) {
  const [voucher, setVoucher] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!voucherId) return;
    setLoading(true);
    voucherAPI.get(voucherId)
      .then((res) => {
        // Handle { success: true, data: {...} } wrapper
        setVoucher(res.data || res);
      })
      .catch(() => setVoucher(null))
      .finally(() => setLoading(false));
  }, [voucherId]);

  return { voucher, loading };
}

// ── Fetch audit log (handles wrapper) ────────────────────────────────────────
function useAuditLogDetail(voucherId) {
  const [logs,    setLogs]    = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!voucherId) return;
    voucherAPI.audit(voucherId)
      .then((res) => {
        const list = Array.isArray(res) ? res : (res.data || []);
        setLogs(list);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [voucherId]);

  return { logs, loading };
}

function AuditSection({ voucherId }) {
  const { logs, loading } = useAuditLogDetail(voucherId);
  if (loading) return <Skeleton height="80px" />;
  if (!logs.length) return (
    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No audit records.</p>
  );
  return (
    <div className="audit-list">
      {logs.map((log, i) => (
        <div key={i} className="audit-item">
          <span className="audit-action">{log.action_label || log.action}</span>
          <span className="audit-meta">
            {log.performed_by && <span>User #{log.performed_by} · </span>}
            {formatDateTime(log.timestamp)}
          </span>
          {log.notes && <span className="audit-notes">{log.notes}</span>}
        </div>
      ))}
    </div>
  );
}

export default function VoucherDetail({ voucherId, onClose, onRefresh }) {
  const { voucher, loading } = useVoucherDetail(voucherId);
  const [tab,            setTab]            = useState('lines');
  const [confirmReverse, setConfirmReverse] = useState(false);
  const [reversing,      setReversing]      = useState(false);
  const toast = useToast();

  const handleReverse = async () => {
    setReversing(true);
    try {
      await voucherAPI.reverse(voucherId, {});
      toast.success('Reversing entry created.', 'Reversed');
      onRefresh();
      setConfirmReverse(false);
      onClose();
    } catch (err) {
      toast.error(err.message, 'Reversal Failed');
    } finally {
      setReversing(false);
    }
  };

  const handlePrint = async () => {
    try {
      const res  = await voucherAPI.print(voucherId);
      const data = res.data || res;
      const w    = window.open('', '_blank');
      w.document.write(buildPrintHTML(data));
      w.document.close();
      w.print();
    } catch {
      toast.error('Could not load print data.', 'Print Error');
    }
  };

  if (loading || !voucher) {
    return (
      <Modal open onClose={onClose} title="Voucher Detail" size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[...Array(4)].map((_, i) => <Skeleton key={i} height="18px" />)}
        </div>
      </Modal>
    );
  }

  const typeConf   = VOUCHER_TYPE_CONFIG[voucher.v_type] || {};
  const statusConf = STATUS_CONFIG[voucher.status]       || {};
  const lines      = voucher.lines || [];

  let totalDebit = 0, totalCredit = 0;
  lines.forEach((l) => {
    totalDebit  += parseFloat(l.debit)  || 0;
    totalCredit += parseFloat(l.credit) || 0;
  });

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={`${voucher.voucher_no} — ${typeConf.label || voucher.v_type_label || voucher.v_type}`}
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
            <button className="btn btn-secondary btn-sm" onClick={handlePrint}>🖨 Print</button>
            {voucher.status === 'POSTED' && (
              <button className="btn btn-secondary btn-sm" onClick={() => setConfirmReverse(true)}>
                ↩ Reverse
              </button>
            )}
            <button className="btn btn-secondary" onClick={onClose} style={{ marginLeft: 'auto' }}>
              Close
            </button>
          </div>
        }
      >
        {/* ── Meta row ── */}
        <div className="voucher-meta-row">
          <div className="meta-item">
            <span className="meta-label">Date</span>
            <span className="meta-value">{formatDate(voucher.date)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Type</span>
            <span className={`badge ${typeConf.color || ''}`}>
              {typeConf.label || voucher.v_type_label || voucher.v_type}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Status</span>
            <span className={`badge ${statusConf.color || ''}`}>
              {statusConf.label || voucher.status_label || voucher.status}
            </span>
          </div>
          {voucher.reference && (
            <div className="meta-item">
              <span className="meta-label">Reference</span>
              <span className="meta-value text-mono">{voucher.reference}</span>
            </div>
          )}
          {voucher.currency_code && (
            <div className="meta-item">
              <span className="meta-label">Currency</span>
              <span className="meta-value text-mono">{voucher.currency_code}</span>
            </div>
          )}
        </div>

        {voucher.narration && (
          <p style={{ margin: '12px 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {voucher.narration}
          </p>
        )}

        {/* ── Tabs ── */}
        <div className="detail-tabs">
          <button className={`tab-btn${tab === 'lines' ? ' active' : ''}`} onClick={() => setTab('lines')}>
            Lines
          </button>
          <button className={`tab-btn${tab === 'audit' ? ' active' : ''}`} onClick={() => setTab('audit')}>
            Audit Log
          </button>
        </div>

        {tab === 'lines' && (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Account ID</th>
                  <th>Account Name</th>
                  <th>Description</th>
                  <th className="amount-cell">Debit (Dr)</th>
                  <th className="amount-cell">Credit (Cr)</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{i + 1}</td>
                    {/* account is the FK integer id from COA */}
                    <td className="text-mono" style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      #{line.account}
                    </td>
                    {/* account_name comes from VoucherDetailSerializer */}
                    <td style={{ fontWeight: 500 }}>
                      {line.account_name || '—'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{line.description || '—'}</td>
                    <td className="amount-cell">
                      {parseFloat(line.debit)  ? formatCurrency(line.debit,  voucher.currency_code) : '—'}
                    </td>
                    <td className="amount-cell">
                      {parseFloat(line.credit) ? formatCurrency(line.credit, voucher.currency_code) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--bg-muted)', fontWeight: 600 }}>
                  <td colSpan={4} style={{ padding: '8px 14px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Totals
                  </td>
                  <td className="amount-cell" style={{ padding: '8px 14px', color: '#1d4ed8' }}>
                    {formatCurrency(totalDebit, voucher.currency_code)}
                  </td>
                  <td className="amount-cell" style={{ padding: '8px 14px', color: '#065f46' }}>
                    {formatCurrency(totalCredit, voucher.currency_code)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {tab === 'audit' && <AuditSection voucherId={voucherId} />}
      </Modal>

      <ConfirmDialog
        open={confirmReverse}
        onClose={() => setConfirmReverse(false)}
        onConfirm={handleReverse}
        title="Reverse Voucher"
        message={`Create a reversing entry for ${voucher.voucher_no}? A new draft voucher with opposite debits/credits will be created.`}
        confirmLabel="Reverse"
        loading={reversing}
      />
    </>
  );
}

function buildPrintHTML(data) {
  const lines = data.lines || [];
  const rows  = lines.map((l) => `
    <tr>
      <td>${l.account || ''}</td>
      <td>${l.account_name || ''}</td>
      <td>${l.description || ''}</td>
      <td style="text-align:right">${l.debit  ? parseFloat(l.debit).toFixed(2)  : ''}</td>
      <td style="text-align:right">${l.credit ? parseFloat(l.credit).toFixed(2) : ''}</td>
    </tr>`).join('');

  return `<!DOCTYPE html><html><head><title>${data.voucher_no}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 13px; padding: 32px; }
    h1   { font-size: 18px; margin-bottom: 4px; }
    .meta { color: #666; margin-bottom: 20px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 7px 10px; text-align: left; }
    th { background: #f5f5f5; font-size: 11px; text-transform: uppercase; }
    tfoot td { font-weight: bold; background: #f9f9f9; }
    @media print { body { padding: 0; } }
  </style></head><body>
  <h1>FinTrack — ${data.voucher_no}</h1>
  <div class="meta">
    Date: ${data.date} &nbsp;|&nbsp;
    Type: ${data.v_type_label || data.v_type} &nbsp;|&nbsp;
    Status: ${data.status_label || data.status}<br/>
    ${data.narration || ''}
  </div>
  <table>
    <thead>
      <tr>
        <th>Acct ID</th><th>Account Name</th><th>Description</th>
        <th>Debit (Dr)</th><th>Credit (Cr)</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="3">Totals</td>
        <td style="text-align:right">${lines.reduce((s,l)=>s+(parseFloat(l.debit)||0),0).toFixed(2)}</td>
        <td style="text-align:right">${lines.reduce((s,l)=>s+(parseFloat(l.credit)||0),0).toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>
  </body></html>`;
}