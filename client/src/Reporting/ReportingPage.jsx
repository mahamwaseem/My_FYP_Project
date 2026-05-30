import React, { useState, useMemo, useRef, useEffect } from 'react';
import './styles/reporting.css';

import { REPORTS, ACCOUNTS, COMPANY } from './services/mockData';
import { useReport, useToast, toCSV } from './hooks/useReporting';
import { resolvePeriod, downloadCSV, printElement, todayISO } from './utils/reportHelpers';

import ToastContainer from './components/shared/Toast';
import Icon from './components/shared/Icon';
import AccountBalances from './components/reports/AccountBalances';
import TransactionSummary from './components/reports/TransactionSummary';
import AuditTrail from './components/reports/AuditTrail';
import AccountStatement from './components/reports/AccountStatement';
import CustomSummary from './components/reports/CustomSummary';

const PERIODS = ['monthly', 'quarterly', 'annually'];

export default function ReportingPage({ onBack }) {
  const toast = useToast();
  const [reportId, setReportId] = useState('balances');
  const [period, setPeriod] = useState('monthly');
  const [range, setRange] = useState(() => resolvePeriod('monthly'));
  const [accountName, setAccountName] = useState(ACCOUNTS[0].name);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);

  const meta = REPORTS.find((r) => r.id === reportId);

  // when period preset changes, recompute the date range
  const applyPeriod = (p) => { setPeriod(p); setRange(resolvePeriod(p)); };

  const params = useMemo(() => ({
    period,
    date_from: range.date_from,
    date_to: range.date_to,
    account: meta.needsAccount ? accountName : undefined,
    accountName,
  }), [period, range, meta, accountName]);

  const { data, loading, demo } = useReport(reportId, params);

  // close export menu on outside click
  useEffect(() => {
    const onClick = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const doExportCSV = () => {
    const { header, rows } = toCSV(reportId, data);
    if (!header.length) { toast.error('Nothing to export yet.'); return; }
    downloadCSV(`${COMPANY.name.replace(/\s+/g, '_')}_${reportId}_${todayISO()}.csv`, header, rows);
    toast.success('CSV downloaded.');
    setExportOpen(false);
  };
  const doPrint = () => {
    printElement('rp-printable', `${meta.name} — ${COMPANY.name}`);
    setExportOpen(false);
  };

  const renderReport = () => {
    const common = { data, loading, dateFrom: range.date_from, dateTo: range.date_to, asOf: range.date_to };
    switch (reportId) {
      case 'balances': return <AccountBalances {...common} />;
      case 'txns':     return <TransactionSummary {...common} />;
      case 'audit':    return <AuditTrail {...common} />;
      case 'account':  return <AccountStatement {...common} />;
      case 'summary':  return <CustomSummary {...common} />;
      default:         return null;
    }
  };

  return (
    <div className="rp">
      <ToastContainer />
      <div className="rp-shell">

        {/* ── LEFT: report builder rail ── */}
        <aside className="rp-rail">
          <div className="rp-rail-grid" aria-hidden="true" />
          <div className="rp-rail-head">
            {onBack && (
              <button className="rp-rail-back" onClick={onBack}><Icon name="back" size={15} /> Home</button>
            )}
            <span className="rp-kicker">FinTrack · Reporting</span>
            <h1 className="rp-wordmark">Report Center</h1>
            <p className="rp-rail-note">
              Pick a report, set the period, and generate. Every report is built from your posted ledger.
            </p>
          </div>

          <nav className="rp-types">
            {REPORTS.map((r) => (
              <button key={r.id} className={`rp-type${reportId === r.id ? ' on' : ''}`} onClick={() => setReportId(r.id)}>
                <span className="rp-type-ic"><Icon name={r.icon} size={18} /></span>
                <span className="rp-type-body">
                  <span className="rp-type-name">{r.name}</span>
                  <span className="rp-type-desc">{r.desc}</span>
                </span>
                <span className="rp-type-no">{r.no}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ── RIGHT: canvas ── */}
        <main className="rp-canvas">
          <div className="rp-controls">
            <div className="rp-period">
              {PERIODS.map((p) => (
                <button key={p} className={period === p ? 'on' : ''} onClick={() => applyPeriod(p)}>{p}</button>
              ))}
            </div>

            <div className="rp-dates">
              <Icon name="cal" size={15} />
              <input type="date" value={range.date_from}
                     onChange={(e) => setRange((r) => ({ ...r, date_from: e.target.value }))} />
              <span className="rp-arrow">→</span>
              <input type="date" value={range.date_to}
                     onChange={(e) => setRange((r) => ({ ...r, date_to: e.target.value }))} />
            </div>

            {/* account picker only for Account Statement */}
            {meta.needsAccount && (
              <div className="rp-acct-pick">
                <Icon name="book" size={15} />
                <select value={accountName} onChange={(e) => setAccountName(e.target.value)}>
                  {ACCOUNTS.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              </div>
            )}

            <div className="rp-export-wrap" ref={exportRef}>
              <button className="rp-export" onClick={() => setExportOpen((o) => !o)}>
                <Icon name="download" size={15} /> Export <Icon name="chevron" size={13} />
              </button>
              {exportOpen && (
                <div className="rp-export-menu">
                  <button onClick={doExportCSV}><Icon name="csv" size={15} /> Download CSV</button>
                  <button onClick={doPrint}><Icon name="printer" size={15} /> Print / PDF</button>
                </div>
              )}
            </div>
          </div>

          {demo && (
            <div className="rp-demo-flag">
              Showing demo data — connect <code>/api/reporting/</code> to generate from live ledger.
            </div>
          )}

          {renderReport()}
        </main>
      </div>
    </div>
  );
}
