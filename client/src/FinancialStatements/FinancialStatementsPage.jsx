import React, { useState } from 'react';
import './styles/statements.css';

import { PERIODS, useStatement, useStatementOverview, useToast } from './hooks/useStatements';
import { COMPANY } from './services/mockData';
import {
  labelFor, todayLabel, downloadCSV, statementToCSVRows, printElement,
} from './utils/statementHelpers';

import ToastContainer from './components/shared/Toast';
import Icon from './components/shared/Icon';
import { Figure } from './components/statements/Parts';

import BalanceSheet from './components/statements/BalanceSheet';
import IncomeStatement from './components/statements/IncomeStatement';
import CashFlow from './components/statements/CashFlow';
import TrialBalance from './components/statements/TrialBalance';

const CARDS = [
  { id: 'balance',  name: 'Balance Sheet',    tag: 'Financial position — what is owned and owed', roman: 'I',   icon: 'balance' },
  { id: 'income',   name: 'Income Statement', tag: 'Profit & Loss — performance over the period',  roman: 'II',  icon: 'income' },
  { id: 'cashflow', name: 'Cash Flow',        tag: 'Movement of cash across activities',           roman: 'III', icon: 'cash' },
  { id: 'trial',    name: 'Trial Balance',    tag: 'Σ Debit = Σ Credit — the proof of balance',    roman: 'IV',  icon: 'scale' },
];

const PAPER_ID = 'fs-printable';

export default function FinancialStatementsPage({ onBack }) {
  // view: 'select' (cards + controls) | 'statement' (single full-width statement)
  const [view, setView] = useState('select');
  const [selected, setSelected] = useState('balance');
  const [period, setPeriod] = useState(PERIODS[0]);
  const [comparative, setComparative] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const toast = useToast();

  const { summary, statuses, demo } = useStatementOverview(period);
  const { data, loading } = useStatement(selected, period, comparative);

  const meta = CARDS.find((c) => c.id === selected);

  const openStatement = (id) => { setSelected(id); setView('statement'); window.scrollTo({ top: 0 }); };
  const backToSelect = () => { setView('select'); setExportOpen(false); };

  const doExport = (format) => {
    setExportOpen(false);
    if (!data) return;
    if (format === 'excel' || format === 'csv') {
      downloadCSV(`${selected}-${period.id}.csv`,
        statementToCSVRows(selected, data, { company: COMPANY.name, periodLabel: period.label }));
      toast.success(`${labelFor(selected)} exported to ${format === 'excel' ? 'Excel (CSV)' : 'CSV'}.`);
    } else if (format === 'pdf') {
      printElement(PAPER_ID, `${labelFor(selected)} — ${period.label}`);
      toast.info('Choose “Save as PDF” in the print dialog.');
    } else if (format === 'print') {
      printElement(PAPER_ID, `${labelFor(selected)} — ${period.label}`);
    }
  };

  return (
    <div className="fs">
      <ToastContainer />

      {/* ════ TOP BAR ════ */}
      <header className="fs-topbar">
        <div className="fs-tb-left">
          {view === 'statement' ? (
            <button className="fs-back" onClick={backToSelect} aria-label="Back to statements">
              <Icon name="back" size={16} />
            </button>
          ) : onBack ? (
            <button className="fs-back" onClick={onBack} aria-label="Back to home">
              <Icon name="back" size={16} />
            </button>
          ) : null}
          <span className="fs-mark">F</span>
          <div>
            <div className="fs-tb-title">Financial Statements</div>
            <div className="fs-tb-sub">Generate · preview · export — {COMPANY.name}</div>
          </div>
        </div>
        <div className="fs-tb-right">
          {summary && (
            <div className={`fs-tb-balance ${summary.balanced ? 'ok' : 'bad'}`}>
              <span className="fs-dot" />{summary.balanced ? 'Ledger in balance' : 'Out of balance'}
            </div>
          )}
        </div>
      </header>

      {/* ════ VIEW 1 — SELECTION ════ */}
      {view === 'select' && (
        <div className="fs-shell">
          <div className="fs-select">
            {/* MAIN */}
            <main className="fs-main">
              <div className="fs-main-head">
                <h2>Generate Statements</h2>
                <p>Select a statement to open it full-screen. Set the period and options on the right.</p>
              </div>

              <div className="fs-kpis">
                <Kpi label="Total Assets" value={summary?.total_assets} />
                <Kpi label={summary?.is_profit === false ? 'Net Loss' : 'Net Profit'} value={summary ? Math.abs(summary.net_profit) : null} tone={summary?.is_profit === false ? 'neg' : 'pos'} />
                <Kpi label="Total Debits" value={summary?.total_debit} />
                <Kpi label="Accounts" value={summary?.accounts} plain />
              </div>

              <div className="fs-cards">
                {CARDS.map((c) => {
                  const status = statuses?.[c.id] || 'Ready';
                  return (
                    <button key={c.id} className="fs-card" onClick={() => openStatement(c.id)}>
                      <div className="fs-card-top">
                        <span className="fs-card-ic"><Icon name={c.icon} size={22} /></span>
                        <span className={`fs-status ${status.toLowerCase()}`}>{status}</span>
                      </div>
                      <div className="fs-card-roman">{c.roman}</div>
                      <div className="fs-card-name">{c.name}</div>
                      <div className="fs-card-tag">{c.tag}</div>
                      <div className="fs-card-cta">Open statement <Icon name="arrow" size={14} /></div>
                    </button>
                  );
                })}
              </div>
            </main>

            {/* CONTROLS */}
            <aside className="fs-ctrl">
              <div className="fs-ctrl-head">Generation Controls</div>

              <div className="fs-field">
                <label>Reporting period</label>
                <div className="fs-seg">
                  {PERIODS.map((p) => (
                    <button key={p.id} className={period.id === p.id ? 'on' : ''} onClick={() => setPeriod(p)}>
                      {p.id === 'monthly' ? 'Monthly' : p.id === 'quarterly' ? 'Quarterly' : 'Annually'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="fs-field">
                <label><Icon name="calendar" size={13} /> Date range</label>
                <div className="fs-dates">
                  <input type="date" value={period.date_from} onChange={(e) => setPeriod({ ...period, date_from: e.target.value })} />
                  <span className="fs-dates-sep">→</span>
                  <input type="date" value={period.date_to} onChange={(e) => setPeriod({ ...period, date_to: e.target.value })} />
                </div>
              </div>

              <button className={`fs-toggle${comparative ? ' on' : ''}`} onClick={() => setComparative((c) => !c)}>
                <span className="fs-toggle-track"><span className="fs-toggle-knob" /></span>
                <span className="fs-toggle-text">
                  Comparative figures
                  <span className="fs-toggle-sub">Show prior-year column</span>
                </span>
              </button>

              <div className="fs-ctrl-spacer" />

              {demo && <div className="fs-demo-flag">Demo data — connect <code>/api/reports/</code> to go live.</div>}

              <button className="fs-generate" onClick={() => openStatement(selected)}>
                Open Selected Statement
              </button>
              <div className="fs-ctrl-note">Or click any card above to open it.</div>
            </aside>
          </div>
        </div>
      )}

      {/* ════ VIEW 2 — SINGLE STATEMENT ════ */}
      {view === 'statement' && (
        <div className="fs-shell">
          {/* statement toolbar */}
          <div className="fs-stmt-toolbar">
            <button className="fs-toolbar-back" onClick={backToSelect}>
              <Icon name="back" size={16} /> All statements
            </button>

            <div className="fs-toolbar-mid">
              <span className="fs-toolbar-title">{meta.name}</span>
              <div className="fs-seg compact">
                {PERIODS.map((p) => (
                  <button key={p.id} className={period.id === p.id ? 'on' : ''} onClick={() => setPeriod(p)}>
                    {p.id === 'monthly' ? 'Monthly' : p.id === 'quarterly' ? 'Quarterly' : 'Annually'}
                  </button>
                ))}
              </div>
              <button className={`fs-cmp-pill${comparative ? ' on' : ''}`} onClick={() => setComparative((c) => !c)}>
                <span className="fs-toggle-track sm"><span className="fs-toggle-knob sm" /></span>
                Prior year
              </button>
            </div>

            <div className={`fs-exp${exportOpen ? ' open' : ''}`}>
              <button className="fs-exp-btn light" onClick={() => setExportOpen((o) => !o)}>
                <Icon name="download" size={15} /> Export <Icon name="chevron" size={14} />
              </button>
              <div className="fs-exp-menu">
                <button onClick={() => doExport('pdf')}><Icon name="pdf" size={15} /> PDF</button>
                <button onClick={() => doExport('excel')}><Icon name="excel" size={15} /> Excel</button>
                <button onClick={() => doExport('print')}><Icon name="print" size={15} /> Print</button>
              </div>
            </div>
          </div>

          {/* the statement, alone, full-width-but-margined */}
          <div className="fs-paper solo" id={PAPER_ID} key={selected + period.id + comparative}>
            <div className="fs-paper-head">
              <div>
                <div className="fs-co">{COMPANY.name}</div>
                <div className="fs-co-sub">Double-entry accounting · {COMPANY.currency}</div>
              </div>
              <div className="fs-paper-meta">
                <span className="fs-roman">{meta.roman}</span>
                <div>
                  <div className="fs-paper-title">{meta.name}</div>
                  <div className="fs-paper-period">{period.label}{comparative ? ' · vs prior year' : ''}</div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="fs-loading">
                {[...Array(6)].map((_, i) => <div className="fs-skel" key={i} style={{ animationDelay: `${i * 70}ms` }} />)}
              </div>
            ) : (
              <>
                {selected === 'balance'  && <BalanceSheet data={data} comparative={comparative} />}
                {selected === 'income'   && <IncomeStatement data={data} comparative={comparative} />}
                {selected === 'cashflow' && <CashFlow data={data} comparative={comparative} />}
                {selected === 'trial'    && <TrialBalance data={data} />}
              </>
            )}

            <div className="fs-paper-foot">
              <span>Generated by FinTrack</span>
              <span>Prepared {todayLabel()}</span>
            </div>
          </div>

          {/* quick switch between statements without going back */}
          <div className="fs-quickswitch">
            {CARDS.map((c) => (
              <button key={c.id} className={`fs-qs${selected === c.id ? ' on' : ''}`} onClick={() => openStatement(c.id)}>
                <Icon name={c.icon} size={16} /> {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, tone, plain }) {
  return (
    <div className={`fs-kpi${tone ? ' ' + tone : ''}`}>
      <span className="fs-kpi-label">{label}</span>
      <span className="fs-kpi-val">{value != null ? (plain ? value : <Figure value={value} />) : '—'}</span>
    </div>
  );
}