import React, { useState } from 'react';
import { useVoucher, useAuditLog, useToast } from '../../hooks/useFinTrack';
import { voucherAPI } from '../../services/api';
import { formatCurrency, formatDate, formatDateTime, STATUS_CONFIG, VOUCHER_TYPE_CONFIG } from '../../utils/helpers';
import { Modal, ConfirmDialog, Skeleton } from '../shared/UI';
import './VoucherDetail.css';

function AuditSection({ voucherId }) {
  const { logs, loading } = useAuditLog(voucherId);
  if (loading) return <Skeleton height="80px" />;
  if (!logs.length) return <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No audit records.</p>;
  return (
    <div className="audit-list">
      {logs.map((log, i) => (
        <div key={i} className="audit-item">
          <span className="audit-action">{log.action}</span>
          <span className="audit-meta">
            {log.user_id && <span>User #{log.user_id} · </span>}
            {formatDateTime(log.timestamp || log.created_at)}
          </span>
          {log.notes && <span className="audit-notes">{log.notes}</span>}
        </div>
      ))}
    </div>
  );
}

export default function VoucherDetail({ voucherId, onClose, onRefresh }) {
  const { voucher, loading } = useVoucher(voucherId);
  const [tab, setTab] = useState('lines');
  const [confirmReverse, setConfirmReverse] = useState(false);
  const [reversing, setReversing] = useState(false);
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
      const data = await voucherAPI.print(voucherId);
      const printData = data.data || data;
      const w = window.open('', '_blank');
      w.document.write(buildPrintHTML(printData));
      w.document.close();
      w.print();
    } catch (err) {
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

  const typeConf   = VOUCHER_TYPE_CONFIG[voucher.voucher_type] || {};
  const statusConf = STATUS_CONFIG[voucher.status] || {};
  const lines = voucher.lines || [];
  let totalDebit = 0, totalCredit = 0;
  lines.forEach((l) => { totalDebit += parseFloat(l.debit_amount) || 0; totalCredit += parseFloat(l.credit_amount) || 0; });

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={`${voucher.voucher_number} — ${typeConf.label || voucher.voucher_type}`}
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
            <button className="btn btn-secondary btn-sm" onClick={handlePrint}>🖨 Print</button>
            {voucher.status === 'POSTED' && (
              <button className="btn btn-secondary btn-sm" onClick={() => setConfirmReverse(true)}>
                ↩ Reverse
              </button>
            )}
            <button className="btn btn-secondary" onClick={onClose} style={{ marginLeft: 'auto' }}>Close</button>
          </div>
        }
      >
        {/* Meta Row */}
        <div className="voucher-meta-row">
          <div className="meta-item">
            <span className="meta-label">Date</span>
            <span className="meta-value">{formatDate(voucher.voucher_date)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Type</span>
            <span className={`badge ${typeConf.color || ''}`}>{typeConf.label}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Status</span>
            <span className={`badge ${statusConf.color || ''}`}>{statusConf.label}</span>
          </div>
          {voucher.reference_number && (
            <div className="meta-item">
              <span className="meta-label">Reference</span>
              <span className="meta-value text-mono">{voucher.reference_number}</span>
            </div>
          )}
          {voucher.currency_code && (
            <div className="meta-item">
              <span className="meta-label">Currency</span>
              <span className="meta-value text-mono">{voucher.currency_code}</span>
            </div>
          )}
        </div>

        {voucher.description && (
          <p style={{ margin: '12px 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {voucher.description}
          </p>
        )}

        {/* Tabs */}
        <div className="detail-tabs">
          <button className={`tab-btn${tab === 'lines'  ? ' active' : ''}`} onClick={() => setTab('lines')}>Lines</button>
          <button className={`tab-btn${tab === 'audit'  ? ' active' : ''}`} onClick={() => setTab('audit')}>Audit Log</button>
        </div>

        {tab === 'lines' && (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Account</th>
                  <th>Description</th>
                  <th className="amount-cell">Debit (Dr)</th>
                  <th className="amount-cell">Credit (Cr)</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{i + 1}</td>
                    <td className="text-mono">{line.account_id}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{line.description || '—'}</td>
                    <td className="amount-cell">{parseFloat(line.debit_amount) ? formatCurrency(line.debit_amount, voucher.currency_code) : '—'}</td>
                    <td className="amount-cell">{parseFloat(line.credit_amount) ? formatCurrency(line.credit_amount, voucher.currency_code) : '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--bg-muted)', fontWeight: 600 }}>
                  <td colSpan={3} style={{ padding: '8px 14px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Totals</td>
                  <td className="amount-cell" style={{ padding: '8px 14px', color: '#1d4ed8' }}>{formatCurrency(totalDebit, voucher.currency_code)}</td>
                  <td className="amount-cell" style={{ padding: '8px 14px', color: '#065f46' }}>{formatCurrency(totalCredit, voucher.currency_code)}</td>
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
        message={`Create a reversing entry for ${voucher.voucher_number}? A new voucher with opposite debits/credits will be created.`}
        confirmLabel="Reverse"
        loading={reversing}
      />
    </>
  );
}

function buildPrintHTML(data) {
  const lines = data.lines || [];
  const rows = lines.map((l) => `
    <tr>
      <td>${l.account_id || ''}</td>
      <td>${l.description || ''}</td>
      <td style="text-align:right">${l.debit_amount ? parseFloat(l.debit_amount).toFixed(2) : ''}</td>
      <td style="text-align:right">${l.credit_amount ? parseFloat(l.credit_amount).toFixed(2) : ''}</td>
    </tr>`).join('');

  return `<!DOCTYPE html><html><head><title>${data.voucher_number}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 13px; padding: 32px; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    .meta { color: #666; margin-bottom: 20px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 7px 10px; text-align: left; }
    th { background: #f5f5f5; font-size: 11px; text-transform: uppercase; }
    tfoot td { font-weight: bold; background: #f9f9f9; }
    @media print { body { padding: 0; } }
  </style></head><body>
  <h1>FinTrack — ${data.voucher_number}</h1>
  <div class="meta">
    Date: ${data.voucher_date} &nbsp;|&nbsp; Type: ${data.voucher_type} &nbsp;|&nbsp; Status: ${data.status}<br/>
    ${data.description || ''}
  </div>
  <table>
    <thead><tr><th>Account</th><th>Description</th><th>Debit (Dr)</th><th>Credit (Cr)</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="2">Totals</td>
      <td style="text-align:right">${lines.reduce((s, l) => s + (parseFloat(l.debit_amount) || 0), 0).toFixed(2)}</td>
      <td style="text-align:right">${lines.reduce((s, l) => s + (parseFloat(l.credit_amount) || 0), 0).toFixed(2)}</td>
    </tr></tfoot>
  </table>
  </body></html>`;
}
