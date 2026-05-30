import React, { useState, useMemo, useEffect } from 'react';
import { useAccounts, useToast } from '../../hooks/useGeneralLedger';
import { ledgerAPI } from '../../services/glApi';
import { MOCK_ENTRIES } from '../../services/mockData';
import { ErrorBoundary, ConfirmDialog } from '../shared/UI';
import { formatAmount, formatCurrency, formatDate, computeReconciliation, ACCOUNT_TYPE_CONFIG } from '../../utils/glHelpers';
import './Reconciliation.css';

export default function Reconciliation() {
  const { accounts } = useAccounts();
  const toast = useToast();

  // Default to the first bank/cash asset account.
  const bankAccounts = accounts.filter((a) => a.type === 'ASSET');
  const [accountId, setAccountId] = useState('');
  const effectiveId = accountId || (bankAccounts[0] && bankAccounts[0].id) || (accounts[0] && accounts[0].id) || '';

  const account = accounts.find((a) => String(a.id) === String(effectiveId));
  const [statementBalance, setStatementBalance] = useState('60000.00');
  const [lines, setLines] = useState([]);
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  // Load this account's ledger lines (each can be cleared/uncleared).
  useEffect(() => {
    if (!effectiveId) return;
    let active = true;
    ledgerAPI.ledgerLinesForRecon(effectiveId)
      .then((res) => {
        const list = Array.isArray(res) ? res : (res && (res.data || res.results)) || [];
        if (active) seedLines(list.length ? list : null);
      })
      .catch(() => active && seedLines(null));
    function seedLines(apiList) {
      const src = apiList || MOCK_ENTRIES.filter((e) => e.account_id === Number(effectiveId));
      setLines(src.map((e) => ({ ...e, cleared: !!e.cleared })));
    }
    return () => { active = false; };
  }, [effectiveId]);

  const openingCleared = account ? (account.opening || 0) : 0;
  const recon = useMemo(
    () => computeReconciliation(openingCleared, lines, statementBalance),
    [openingCleared, lines, statementBalance]
  );

  const toggleClear = (id) =>
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, cleared: !l.cleared } : l)));
  const clearAll = (val) => setLines((ls) => ls.map((l) => ({ ...l, cleared: val })));

  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      await ledgerAPI.finalizeReconciliation(effectiveId).catch(() => {});
      toast.success(`${account?.name} reconciled for the period.`, 'Reconciled');
      setConfirmFinalize(false);
    } finally { setFinalizing(false); }
  };

  return (
    <ErrorBoundary>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Bank Reconciliation</h1>
          <p className="page-subtitle">Match ledger entries to your bank statement and confirm the balances agree</p>
        </div>
      </div>

      {/* ── Setup ── */}
      <div className="card recon-setup">
        <div className="form-group recon-acc">
          <label className="form-label" htmlFor="recon-acc">Bank / cash account</label>
          <select id="recon-acc" className="form-control" value={effectiveId} onChange={(e) => setAccountId(e.target.value)}>
            {(bankAccounts.length ? bankAccounts : accounts).map((a) => (
              <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="recon-bal">Statement closing balance</label>
          <input id="recon-bal" type="number" step="0.01" className="form-control"
            value={statementBalance} onChange={(e) => setStatementBalance(e.target.value)} />
          <span className="form-hint">Enter the closing balance shown on your bank statement.</span>
        </div>
      </div>

      {/* ── Reconciliation summary ── */}
      <div className={`recon-summary${recon.isReconciled ? ' reconciled' : ''}`}>
        <div className="rs-cell">
          <span className="rs-label">Statement Balance</span>
          <span className="rs-value text-num">{formatCurrency(parseFloat(statementBalance) || 0)}</span>
        </div>
        <span className="rs-op">−</span>
        <div className="rs-cell">
          <span className="rs-label">Cleared Book Balance</span>
          <span className="rs-value text-num">{formatCurrency(recon.clearedBalance)}</span>
          <span className="rs-sub">{recon.clearedCount} cleared item{recon.clearedCount !== 1 ? 's' : ''}</span>
        </div>
        <span className="rs-op">=</span>
        <div className="rs-cell rs-diff">
          <span className="rs-label">Difference</span>
          <span className="rs-value text-num">{formatCurrency(recon.difference)}</span>
          <span className="rs-sub">{recon.unclearedCount} uncleared item{recon.unclearedCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="rs-status">
          {recon.isReconciled ? (
            <>
              <span className="rs-badge ok">✓ Reconciled</span>
              <button className="btn btn-success btn-sm" onClick={() => setConfirmFinalize(true)}>Finalize</button>
            </>
          ) : (
            <span className="rs-badge pending">Difference must be 0.00</span>
          )}
        </div>
      </div>

      {/* ── Lines to match ── */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h2 style={{ fontSize: '1.05em', fontWeight: 600 }}>Ledger Entries</h2>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => clearAll(true)}>Mark all cleared</button>
            <button className="btn btn-ghost btn-sm" onClick={() => clearAll(false)}>Unmark all</button>
          </div>
        </div>
        <div className="data-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          {lines.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px' }}>
              <div className="empty-state-icon">⚖</div>
              <h3>No entries to reconcile</h3>
              <p>This account has no ledger movements in the period.</p>
            </div>
          ) : (
            <table className="data-table recon-table">
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>Cleared</th>
                  <th style={{ width: '110px' }}>Date</th>
                  <th>Voucher</th>
                  <th>Particulars</th>
                  <th>Reference</th>
                  <th className="amount-cell">Debit</th>
                  <th className="amount-cell">Credit</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.id}
                    className={l.cleared ? 'line-cleared' : ''}
                    onClick={() => toggleClear(l.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <label className="recon-check">
                        <input type="checkbox" checked={l.cleared} onChange={() => toggleClear(l.id)}
                          aria-label={`Mark ${l.voucher_no} cleared`} />
                        <span className="recon-checkmark" aria-hidden="true" />
                      </label>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(l.date)}</td>
                    <td className="text-mono" style={{ color: 'var(--teal-700)', fontWeight: 500 }}>{l.voucher_no}</td>
                    <td className="particulars-cell">{l.narration || '—'}</td>
                    <td className="text-mono" style={{ color: 'var(--text-muted)', fontSize: '0.9em' }}>{l.reference || '—'}</td>
                    <td className="amount-cell debit-cell">{formatAmount(l.debit)}</td>
                    <td className="amount-cell credit-cell">{formatAmount(l.credit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmFinalize}
        onClose={() => setConfirmFinalize(false)}
        onConfirm={handleFinalize}
        title="Finalize reconciliation"
        message={`Lock the reconciliation for ${account?.name}? Cleared items will be marked reconciled and the period closed.`}
        confirmLabel="Finalize"
        loading={finalizing}
      />
    </ErrorBoundary>
  );
}
