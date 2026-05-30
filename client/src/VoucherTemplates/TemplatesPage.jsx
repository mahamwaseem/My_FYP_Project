import React, { useState, useMemo } from 'react';
import './styles/templates.css';

import { useTemplates, useToast } from './hooks/useTemplates';
import { TYPES, templateCounts } from './services/mockData';

import ToastContainer from './components/shared/Toast';
import Icon from './components/shared/Icon';
import TemplateCard from './components/TemplateCard';
import ApplyTemplate from './components/ApplyTemplate';

const FILTERS = [
  { id: 'all', label: 'All Templates' },
  { id: 'RV',  label: 'Receipts' },
  { id: 'PV',  label: 'Payments' },
  { id: 'JV',  label: 'Journals' },
];

export default function TemplatesPage({ onBack }) {
  const { templates, loading, demo } = useTemplates();
  const toast = useToast();

  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(null); // template being applied

  const counts = useMemo(() => templateCounts(templates), [templates]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((t) => {
      const passType = filter === 'all' || t.type === filter;
      const passQ = !q || t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.lines.some((l) => l.account.toLowerCase().includes(q));
      return passType && passQ;
    });
  }, [templates, filter, query]);

  return (
    <div className="vt">
      <ToastContainer />

      {/* ════ HERO ════ */}
      <header className="vt-hero">
        <div className="vt-hero-bg" aria-hidden="true" />
        <div className="vt-hero-scrim" aria-hidden="true" />
        <div className="vt-hero-inner">
          {onBack && (
            <button className="vt-hero-back" onClick={onBack}>
              <Icon name="back" size={15} /> Home
            </button>
          )}
          <span className="vt-hero-badge">Layer 1 · Voucher Template Engine</span>
          <h1 className="vt-hero-title">Voucher <span className="vt-hero-underline">Templates</span></h1>
          <p className="vt-hero-sub">
            Pre-filled, double-entry templates for your recurring transactions. Customise the amount,
            date and description — the accounts stay locked, Debit always equals Credit, and every
            voucher you create is fully posted and auditable.
          </p>
          <div className="vt-hero-stats">
            <div className="vt-stat"><span className="vt-stat-n">{counts.all}</span><span className="vt-stat-l">Templates</span></div>
            <span className="vt-stat-div" />
            <div className="vt-stat"><span className="vt-stat-n">3</span><span className="vt-stat-l">Voucher Types</span></div>
            <span className="vt-stat-div" />
            <div className="vt-stat"><span className="vt-stat-n">∞</span><span className="vt-stat-l">Reusable</span></div>
          </div>
        </div>
      </header>

      {/* ════ TOOLBAR: search + filters ════ */}
      <div className="vt-toolbar">
        <div className="vt-search">
          <Icon name="search" size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates…" />
        </div>
        <div className="vt-filters">
          {FILTERS.map((f) => {
            const n = f.id === 'all' ? counts.all : (counts[f.id] || 0);
            return (
              <button key={f.id} className={`vt-filter${filter === f.id ? ' on' : ''}`} onClick={() => setFilter(f.id)}>
                {f.label} <span className="vt-filter-n">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ════ GRID ════ */}
      <main className="vt-main">
        {demo && (
          <div className="vt-demo-flag">
            Showing built-in templates — connect <code>/api/templates/</code> to manage your own.
          </div>
        )}

        {loading ? (
          <div className="vt-grid">
            {[...Array(6)].map((_, i) => <div className="vt-skel" key={i} style={{ animationDelay: `${i * 70}ms` }} />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="vt-empty">
            <Icon name="search" size={28} />
            <p>No templates match “{query}”.</p>
            <button className="vt-btn-ghost" onClick={() => { setQuery(''); setFilter('all'); }}>Clear filters</button>
          </div>
        ) : (
          <div className="vt-grid">
            {visible.map((t, i) => (
              <TemplateCard key={t.id} template={t} index={i} onUse={setActive} />
            ))}
          </div>
        )}
      </main>

      {/* ════ APPLY DRAWER ════ */}
      {active && (
        <ApplyTemplate
          template={active}
          onClose={() => setActive(null)}
          onCreated={() => { /* could refresh a "recent vouchers" list here */ }}
        />
      )}
    </div>
  );
}
