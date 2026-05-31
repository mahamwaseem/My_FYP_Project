import React from 'react';
import './HomePage.css';

/* ── crisp inline SVG icons (no emoji) ─────────────────────────── */
const PATHS = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  voucher: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
  scale: <><path d="M12 3v18" /><path d="M5 21h14" /><path d="M5 7h14" /><path d="M6 7l-3 6a3 3 0 0 0 6 0z" /><path d="M18 7l-3 6a3 3 0 0 0 6 0z" /></>,
  chart: <><line x1="5" y1="20" x2="5" y2="11" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="19" y1="20" x2="19" y2="14" /><line x1="3" y1="20" x2="21" y2="20" /></>,
  palette: <><circle cx="13.5" cy="6.5" r="1.2" /><circle cx="17.5" cy="10.5" r="1.2" /><circle cx="8.5" cy="7.5" r="1.2" /><circle cx="6.5" cy="12.5" r="1.2" /><path d="M12 2a10 10 0 1 0 0 20c1 0 1.5-.8 1.5-1.7 0-.5-.2-.9-.5-1.2-.3-.4-.5-.8-.5-1.3 0-.9.7-1.6 1.6-1.6H16a6 6 0 0 0 6-6c0-4.9-4.5-8.2-10-8.2z" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></>,
  spark: <><path d="M12 3l1.9 4.8L18.7 9.7l-4.8 1.9L12 16.4l-1.9-4.8L5.3 9.7l4.8-1.9z" /><path d="M19 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" /></>,
  folders: <path d="M3 7a2 2 0 0 1 2-2h3.6a2 2 0 0 1 1.4.6L11.4 7H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  layers: <><polygon points="12 2 22 8.5 12 15 2 8.5" /><polyline points="2 15.5 12 22 22 15.5" /></>,
  tags: <><path d="M3 5v6.6a2 2 0 0 0 .6 1.4l7 7a2 2 0 0 0 2.8 0l5.6-5.6a2 2 0 0 0 0-2.8l-7-7A2 2 0 0 0 10.6 4H4a1 1 0 0 0-1 1z" /><circle cx="7.5" cy="8.5" r="1.4" /></>,
  bookOpen: <><path d="M2 4h6a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H2z" /><path d="M22 4h-6a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2.5H22z" /></>,
  arrow: <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>,
  chevron: <polyline points="9 6 15 12 9 18" />,
  check: <polyline points="20 6 9 17 4 12" />,
  sitemap: <><rect x="9" y="3" width="6" height="5" rx="1.2" /><rect x="3" y="16" width="6" height="5" rx="1.2" /><rect x="15" y="16" width="6" height="5" rx="1.2" /><path d="M12 8v4M6 16v-2h12v2" /></>,
};
function Icon({ name, size = 24, stroke = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

/* ── real modules (from the project proposal) ──────────────────── */
const modules = [
  { icon: 'grid',    name: 'Chart of Accounts',    desc: 'Hierarchical account heads',       route: 'account-group',  accent: '#0d9488' },
  { icon: 'voucher', name: 'Vouchers',             desc: 'Payment · Receipt · Journal',      route: 'vouchers',       accent: '#0ea5e9' },
  { icon: 'book',    name: 'General Ledger',       desc: 'Posted entries & running balances', route: 'general-ledger', accent: '#6366f1' },
  { icon: 'scale',   name: 'Reports',              desc: 'Balances · summaries · audit',     route: 'reporting',      accent: '#f59e0b' },
  { icon: 'chart',   name: 'Financial Statements', desc: 'Balance Sheet · P&L · Cash Flow',  route: 'reports',        accent: '#ef4444' },
  { icon: 'palette', name: 'Voucher Templates',    desc: 'Reusable pre-filled entries',      route: 'templates',      accent: '#ec4899' },
  { icon: 'shield',  name: 'Roles & Access',       desc: 'Admin · Accountant · Viewer',      route: 'users',          accent: '#64748b' },
  { icon: 'spark',   name: 'AI Insights',          desc: 'Anomaly & cash-flow forecast',     route: null,             accent: '#8b5cf6' },
];

/* hero fact cards — real properties of the system, not invented metrics */
const facts = [
  { k: 'Principle',       v: 'Debit = Credit',  icon: 'scale' },
  { k: 'Classifications', v: '5 types',         icon: 'layers' },
  { k: 'Voucher types',   v: '3 + templates',   icon: 'voucher' },
  { k: 'Statements',      v: '4 reports',       icon: 'chart' },
];

const classifications = [
  { code: '1000s', name: 'Assets',      side: 'Debit normal',  color: '#0d9488' },
  { code: '2000s', name: 'Liabilities', side: 'Credit normal', color: '#f59e0b' },
  { code: '3000s', name: 'Equity',      side: 'Credit normal', color: '#6366f1' },
  { code: '4000s', name: 'Income',      side: 'Credit normal', color: '#10b981' },
  { code: '5000s', name: 'Expenses',    side: 'Debit normal',  color: '#ef4444' },
];

/* COA pipeline stages — violet → blue → amber → teal (Account = brand) */
const pipeline = [
  { icon: 'folders', label: 'Group',    note: 'Top level',  route: 'account-group',    bg: '#EEEDFE', bd: '#AFA9EC', fg: '#534AB7', tt: '#26215C' },
  { icon: 'layers',  label: 'Category', note: 'Sub-group',  route: 'account-category', bg: '#E6F1FB', bd: '#85B7EB', fg: '#185FA5', tt: '#042C53' },
  { icon: 'tags',    label: 'Class',    note: 'Type',       route: 'account-class',    bg: '#FAEEDA', bd: '#EF9F27', fg: '#854F0B', tt: '#412402' },
];

const features = [
  { icon: 'grid', title: 'Chart of Accounts',
    body: 'A fully customizable, hierarchical COA — Group → Category → Class → Account — across the five standard classifications, tailored to each SME’s business rules.',
    points: ['Group / Category / Class / Account hierarchy', 'Assets, Liabilities, Equity, Income, Expenses', 'Search & filter account heads'] },
  { icon: 'voucher', title: 'Voucher Management',
    body: 'Every transaction is entered through an authorized, auditable voucher. The system enforces Debit = Credit and posts the double-entry automatically once posted.',
    points: ['Payment, Receipt & Journal vouchers', 'Debit = Credit validation on every entry', 'Reusable templates for recurring entries'] },
  { icon: 'book', title: 'General Ledger',
    body: 'A detailed, chronological record of every debit and credit per account head with running balances, advanced search, and bank reconciliation.',
    points: ['Running balance per account', 'Advanced historical search & filter', 'Bank reconciliation tool'] },
  { icon: 'chart', title: 'Reports & Statements',
    body: 'Raw vouchers become reliable financial intelligence — automatically. Generate the verification report and the principal statements for any period.',
    points: ['Trial Balance (Σ Debit = Σ Credit)', 'Income Statement & Balance Sheet', 'Cash Flow · export to PDF / Excel'] },
  { icon: 'shield', title: 'Roles & Secure Access',
    body: 'Role-based access control protects sensitive operations, with encrypted credentials and controlled module access for every user type.',
    points: ['Administrator · Accountant · Viewer', 'Encrypted authentication', 'Period locking / financial closing'] },
  { icon: 'spark', title: 'AI-Powered Insights',
    body: 'Machine-learning support for decisions: flag unusual transactions for audit and forecast upcoming liquidity before issues arise.',
    points: ['Contextual anomaly detection', '90-day cash-flow forecasting', 'Strategic liquidity alerts'] },
];

const principles = [
  { icon: 'scale',   title: 'Double-Entry, Enforced', desc: 'Every voucher must satisfy Debit = Credit before posting — the global standard for accurate, verifiable books.' },
  { icon: 'grid',    title: 'Standalone & Decoupled', desc: 'A fully independent accounting unit — no dependency on any POS or inventory system. Minimal coupling, maximal cohesion.' },
  { icon: 'voucher', title: 'Complete Audit Trail',   desc: 'Voucher-based entry links every figure back to its source document, so every number is authorized and traceable.' },
  { icon: 'shield',  title: 'Built for SMEs',         desc: 'Designed for the accountants at Multi Tech Solutions’ SME clients — professional tools without unnecessary complexity.' },
];

export default function HomePage({ onNavigate }) {
  const go = (route) => { if (route && onNavigate) onNavigate(route); };

  return (
    <div className="ft">
      {/* ───────── HERO ───────── */}
      <header className="ft-hero" id="overview">
        <div
          className="ft-hero-bg"
          style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/hero-bg.jpeg)` }}
          aria-hidden="true"
        />
        <div className="ft-hero-scrim" aria-hidden="true" />
        <div className="ft-hero-inner">
          <span className="ft-badge"><span className="ft-badge-dot" /> Standalone double-entry accounting</span>
          <h1 className="ft-hero-title">
            Professional accounting,<br />
            <span className="ft-grad">decoupled</span> and built on <span className="ft-grad">Debit = Credit.</span>
          </h1>
          <p className="ft-hero-desc">
            FinTrack is a stand-alone, web-based double-entry accounting system for Multi Tech
            Solutions and its SME clients — from a customizable Chart of Accounts to vouchers,
            ledgers and audited financial statements. Accurate, independent and fully traceable.
          </p>
          <div className="ft-hero-actions">
            <button className="ft-btn-primary" onClick={() => go('account-group')}>
              Open Chart of Accounts <Icon name="arrow" size={18} />
            </button>
            <button className="ft-btn-secondary" onClick={() => go('vouchers')}>Create a Voucher</button>
          </div>

          <div className="ft-facts">
            {facts.map((f) => (
              <div className="ft-fact" key={f.k}>
                <span className="ft-fact-ic"><Icon name={f.icon} size={20} /></span>
                <span className="ft-fact-text">
                  <span className="ft-fact-k">{f.k}</span>
                  <span className="ft-fact-v">{f.v}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ───────── CLASSIFICATIONS ───────── */}
      <section className="ft-strip-wrap">
        <div className="ft-strip">
          {classifications.map((c) => (
            <div className="ft-class" key={c.name} style={{ '--c': c.color }}>
              <span className="ft-class-code">{c.code}</span>
              <span className="ft-class-name">{c.name}</span>
              <span className="ft-class-side">{c.side}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── MODULES ───────── */}
      <section className="ft-section" id="modules">
        <div className="ft-head">
          <span className="ft-tag">The system</span>
          <h2 className="ft-h2">Every accounting module, <em>one platform.</em></h2>
          <p className="ft-sub">The complete set of modules FinTrack delivers — each decoupled, cohesive, and working together.</p>
        </div>
        <div className="ft-modules">
          {modules.map((m) => (
            <button
              key={m.name}
              className={`ft-module${m.route ? ' clickable' : ''}`}
              style={{ '--accent': m.accent }}
              onClick={() => go(m.route)}
            >
              <span className="ft-module-ic"><Icon name={m.icon} size={24} /></span>
              <span className="ft-module-name">{m.name}</span>
              <span className="ft-module-desc">{m.desc}</span>
              <span className={`ft-module-tag${m.route ? '' : ' muted'}`}>
                {m.route ? <>Open <Icon name="arrow" size={14} /></> : 'Coming soon'}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ───────── COA COMMAND CENTER (pipeline) ───────── */}
      <section className="ft-section ft-alt" id="coa">
        <div className="ft-head">
          <span className="ft-tag">Quick access</span>
          <h2 className="ft-h2">Accounting <em>Command Center.</em></h2>
          <p className="ft-sub">Drill straight down the Chart of Accounts hierarchy — the foundation every transaction is built on.</p>
        </div>

        <div className="ft-coa-card">
          <div className="ft-coa-top">
            <span className="ft-coa-id">
              <span className="ft-coa-id-ic"><Icon name="sitemap" size={20} /></span>
              <span>
                <span className="ft-coa-title">Chart of Accounts</span>
                <span className="ft-coa-sub">Hierarchical structure · 4 levels</span>
              </span>
            </span>
            <span className="ft-coa-hint">click any stage</span>
          </div>

          <div className="ft-pipe">
            {pipeline.map((s) => (
              <React.Fragment key={s.label}>
                <button
                  className="ft-stage"
                  style={{ '--bg': s.bg, '--bd': s.bd, '--fg': s.fg, '--tt': s.tt }}
                  onClick={() => go(s.route)}
                >
                  <span className="ft-stage-ic"><Icon name={s.icon} size={22} /></span>
                  <span className="ft-stage-label">{s.label}</span>
                  <span className="ft-stage-note">{s.note}</span>
                </button>
                <span className="ft-pipe-arrow"><Icon name="chevron" size={18} /></span>
              </React.Fragment>
            ))}
            {/* destination: Account (brand teal) */}
            <button className="ft-stage ft-stage-final" onClick={() => go('account-account')}>
              <span className="ft-stage-ic"><Icon name="bookOpen" size={22} /></span>
              <span className="ft-stage-label">Account</span>
              <span className="ft-stage-note">Ledger head</span>
              <span className="ft-stage-open">Open <Icon name="arrow" size={13} /></span>
            </button>
          </div>

          <div className="ft-coa-foot">
            <button className="ft-coa-viewall" onClick={() => go('account-group')}>
              View all Chart of Accounts <Icon name="arrow" size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ───────── FEATURES ───────── */}
      <section className="ft-section" id="features">
        <div className="ft-head">
          <span className="ft-tag">Capabilities</span>
          <h2 className="ft-h2">What FinTrack <em>does.</em></h2>
          <p className="ft-sub">From the first voucher to the final financial statement — the features that keep the books accurate and auditable.</p>
        </div>
        <div className="ft-features">
          {features.map((f) => (
            <article className="ft-feature" key={f.title}>
              <span className="ft-feature-ic"><Icon name={f.icon} size={22} /></span>
              <h3 className="ft-feature-title">{f.title}</h3>
              <p className="ft-feature-body">{f.body}</p>
              <ul className="ft-feature-points">
                {f.points.map((p) => (
                  <li key={p}><span className="ft-pt-check"><Icon name="check" size={13} stroke={2.5} /></span>{p}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* ───────── PRINCIPLES ───────── */}
      <section className="ft-section ft-alt">
        <div className="ft-head">
          <span className="ft-tag">Why FinTrack</span>
          <h2 className="ft-h2">Built for <em>serious</em> financial management.</h2>
        </div>
        <div className="ft-why">
          {principles.map((p) => (
            <div className="ft-why-card" key={p.title}>
              <span className="ft-why-ic"><Icon name={p.icon} size={22} /></span>
              <h3 className="ft-why-title">{p.title}</h3>
              <p className="ft-why-desc">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="ft-cta-wrap">
        <div className="ft-cta">
          <h2 className="ft-cta-title">Start with your Chart of Accounts.</h2>
          <p className="ft-cta-sub">Set up your account structure, then record your first balanced voucher.</p>
          <div className="ft-cta-actions">
            <button className="ft-btn-primary" onClick={() => go('account-group')}>
              Open Chart of Accounts <Icon name="arrow" size={18} />
            </button>
            <button className="ft-btn-secondary" onClick={() => go('vouchers')}>Go to Vouchers</button>
          </div>
        </div>
      </section>

      {/* ───────── FOOTER ───────── */}
      <footer className="ft-footer">
        <div className="ft-footer-inner">
          <div className="ft-footer-brand">
            <div className="ft-footer-logo">
              <span className="ftn-logo-mark" style={{ width: 36, height: 36 }}>F</span>
              <span className="ft-footer-name">FinTrack</span>
            </div>
            <p className="ft-footer-desc">
              A stand-alone double-entry accounting web application — developed for
              Multi Tech Solutions and its SME clients.
            </p>
          </div>
          <div className="ft-footer-col">
            <span className="ft-footer-ct">Modules</span>
            <button className="ft-footer-link" onClick={() => go('account-group')}>Chart of Accounts</button>
            <button className="ft-footer-link" onClick={() => go('vouchers')}>Vouchers</button>
            <button className="ft-footer-link" onClick={() => go('general-ledger')}>General Ledger</button>
            <button className="ft-footer-link" onClick={() => go('templates')}>Voucher Templates</button>
          </div>
          <div className="ft-footer-col">
            <span className="ft-footer-ct">Reports</span>
            <button className="ft-footer-link" onClick={() => go('reporting')}>Reports</button>
            <a className="ft-footer-link" href="#features">Income Statement</a>
            <a className="ft-footer-link" href="#features">Balance Sheet</a>
            <a className="ft-footer-link" href="#features">Cash Flow</a>
          </div>
          <div className="ft-footer-col">
            <span className="ft-footer-ct">Project</span>
            <span className="ft-footer-text">Rawalpindi Women University</span>
            <span className="ft-footer-text">BS Computer Science — FYP</span>
            <span className="ft-footer-text">React · ASP.NET · SQL Server</span>
          </div>
        </div>
        <div className="ft-footer-bottom">
          <span>© 2025 FinTrack — Multi Tech Solutions. All rights reserved.</span>
          <span>Double-entry · Standalone · Auditable</span>
        </div>
      </footer>
    </div>
  );
}