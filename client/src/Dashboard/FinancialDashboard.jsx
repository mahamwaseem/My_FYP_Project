import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useDashboard } from './hooks/useDashboard';
import { useAuth } from '../Auth';
import Icon from './components/Icon';
import { fmtPKR, fmtFull, relTime } from './utils';
import './styles/dashboard.css';

const TEAL = ['#0d9488', '#14b8a6', '#5eead4', '#99f6e4', '#0f766e', '#2dd4bf'];
const TONE = {
  teal:   { bg: '#f0fdfa', fg: '#0f766e', ic: '#14b8a6' },
  indigo: { bg: '#eef2ff', fg: '#4338ca', ic: '#6366f1' },
  green:  { bg: '#ecfdf5', fg: '#047857', ic: '#10b981' },
  red:    { bg: '#fef2f2', fg: '#b91c1c', ic: '#ef4444' },
};

const ACTION_LABEL = {
  created: 'created', updated: 'updated', deleted: 'deleted', posted: 'posted',
  reversed: 'reversed', applied: 'applied', generated: 'generated',
  login: 'signed in', logout: 'signed out', login_failed: 'failed sign-in',
  role_changed: 'changed role', status_changed: 'changed status',
  password_reset: 'reset password', password_changed: 'changed password',
};

export default function FinancialDashboard({ onBack, onNavigate }) {
  const { user } = useAuth();
  const d = useDashboard();

  const firstName = (user?.name || 'there').split(' ')[0];

  return (
    <div className="fd">
      {/* ── Heading ── */}
      <div className="fd-head">
        <div className="fd-head-text">
          <p className="fd-kicker">Financial Dashboard</p>
          <h1 className="fd-title">Welcome back, {firstName}</h1>
          <p className="fd-sub">A real-time snapshot of your financial position · {d.period.label}</p>
        </div>
        <div className="fd-head-actions">
          <PeriodSwitcher period={d.period} setPeriod={d.setPeriod} />
          <button className="fd-icon-btn" onClick={d.reload} title="Refresh"><Icon name="refresh" size={16} /></button>
        </div>
      </div>

      {d.error && (
        <div className="fd-error">
          <Icon name="alert" size={16} /> {d.error}
          <button onClick={d.reload}>Retry</button>
        </div>
      )}

      {/* ── Hero stat cards ── */}
      <div className="fd-heroes">
        {(d.loading || !d.ready ? PLACEHOLDER_HEROES : d.heroes).map((h, i) => (
          <HeroCard key={h.key || i} hero={h} loading={d.loading || !d.ready} />
        ))}
      </div>

      {/* ── Pending / status strip ── */}
      <div className="fd-strip">
        <StatusPill
          icon="clock" tone="amber"
          big={d.ready ? d.counts.draft : '—'}
          label="Drafts awaiting posting"
          cta={d.ready && d.counts.draft > 0 ? 'Review' : null}
          onClick={() => onNavigate && onNavigate('vouchers')}
          loading={d.loading}
        />
        <StatusPill icon="check" tone="green" big={d.ready ? d.counts.posted : '—'} label="Posted vouchers" loading={d.loading} />
        <StatusPill icon="repeat" tone="teal" big={d.ready ? d.counts.recurring : '—'} label="Recurring schedules" loading={d.loading} />
        <StatusPill
          icon={d.balanced ? 'check' : 'alert'}
          tone={d.balanced === false ? 'red' : 'green'}
          big={d.balanced === false ? 'Off' : 'Yes'}
          label={d.balanced === false ? 'Ledger out of balance' : 'Ledger in balance'}
          loading={d.loading}
        />
      </div>

      {/* ── Charts row ── */}
      <div className="fd-charts">
        <div className="fd-card fd-chart">
          <div className="fd-card-head">
            <span className="fd-card-title"><Icon name="bars" size={16} /> Income vs Expenses</span>
            <span className="fd-card-note">Current period vs prior</span>
          </div>
          <div className="fd-chart-body">
            {d.ready ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={d.trend} barGap={10} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => fmtPKR(v, { compact: true })} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={62} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(20,184,166,0.06)' }} />
                  <Bar dataKey="Income" fill="#14b8a6" radius={[6, 6, 0, 0]} maxBarSize={54} />
                  <Bar dataKey="Expenses" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={54} />
                </BarChart>
              </ResponsiveContainer>
            ) : <ChartSkeleton />}
          </div>
        </div>

        <div className="fd-card fd-chart">
          <div className="fd-card-head">
            <span className="fd-card-title"><Icon name="pie" size={16} /> Financial Position</span>
            <span className="fd-card-note">Assets · Equity · Liabilities</span>
          </div>
          <div className="fd-chart-body">
            {d.ready && d.position.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={d.position} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={3} stroke="none">
                    {d.position.map((e, i) => <Cell key={i} fill={TEAL[i % TEAL.length]} />)}
                  </Pie>
                  <Tooltip content={<ChartTip />} />
                  <Legend verticalAlign="bottom" height={28} iconType="circle"
                          formatter={(val) => <span style={{ color: '#475569', fontSize: 12 }}>{val}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : d.ready ? <Empty msg="No posted balances yet" /> : <ChartSkeleton />}
          </div>
        </div>
      </div>

      {/* ── Lower row: account breakdown + recent activity ── */}
      <div className="fd-lower">
        <div className="fd-card">
          <div className="fd-card-head">
            <span className="fd-card-title"><Icon name="layers" size={16} /> Balances by Account Type</span>
          </div>
          <div className="fd-typelist">
            {d.ready && d.typeBreakdown.length > 0 ? d.typeBreakdown.map((t, i) => {
              const max = d.typeBreakdown[0].value || 1;
              return (
                <div className="fd-typerow" key={t.name}>
                  <span className="fd-typename">{t.name}</span>
                  <div className="fd-typebar"><span style={{ width: `${(t.value / max) * 100}%`, background: TEAL[i % TEAL.length] }} /></div>
                  <span className="fd-typeval">{fmtPKR(t.value, { compact: true })}</span>
                </div>
              );
            }) : d.ready ? <Empty msg="No account balances yet" /> : <ListSkeleton rows={5} />}
          </div>
        </div>

        <div className="fd-card">
          <div className="fd-card-head">
            <span className="fd-card-title"><Icon name="activity" size={16} /> Recent Activity</span>
            {d.auditAvailable && <span className="fd-card-note">Latest events</span>}
          </div>
          <div className="fd-feed">
            {!d.ready ? <ListSkeleton rows={6} />
              : !d.auditAvailable ? <Empty msg="Activity is visible to administrators" sub />
              : d.activity.length === 0 ? <Empty msg="No recent activity" sub />
              : d.activity.map((a) => (
                <div className="fd-feed-row" key={a.id}>
                  <span className="fd-feed-dot" data-action={a.action} />
                  <div className="fd-feed-main">
                    <span className="fd-feed-text">
                      <strong>{a.actor || 'System'}</strong> {ACTION_LABEL[a.action] || a.action}
                      {a.entity && a.entity !== '—' ? <> · <span className="fd-feed-entity">{a.entity}</span></> : null}
                    </span>
                    <span className="fd-feed-time">{relTime(a.ts)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Hero card ── */
function HeroCard({ hero, loading }) {
  const tone = TONE[hero.tone] || TONE.teal;
  if (loading) {
    return <div className="fd-hero fd-hero--skel"><div className="fd-skelbar w40" /><div className="fd-skelbar w70 tall" /><div className="fd-skelbar w30" /></div>;
  }
  const up = hero.delta != null && hero.delta >= 0;
  return (
    <div className="fd-hero">
      <div className="fd-hero-top">
        <span className="fd-hero-label">{hero.label}</span>
        <span className="fd-hero-ic" style={{ background: tone.bg, color: tone.ic }}><Icon name={hero.icon} size={18} /></span>
      </div>
      <div className="fd-hero-val" style={hero.negative ? { color: '#b91c1c' } : undefined}>{fmtPKR(hero.value)}</div>
      {hero.delta != null ? (
        <div className={`fd-hero-delta ${up ? 'up' : 'down'}`}>
          <Icon name={up ? 'arrow-up' : 'trending'} size={13} />
          {Math.abs(hero.delta).toFixed(1)}% <span className="fd-hero-delta-note">vs prior</span>
        </div>
      ) : <div className="fd-hero-delta muted">— no prior data</div>}
    </div>
  );
}

/* ── Status pill ── */
function StatusPill({ icon, tone, big, label, cta, onClick, loading }) {
  const tones = {
    amber: { bg: '#fffbeb', fg: '#b45309', ic: '#f59e0b' },
    green: { bg: '#ecfdf5', fg: '#047857', ic: '#10b981' },
    teal:  { bg: '#f0fdfa', fg: '#0f766e', ic: '#14b8a6' },
    red:   { bg: '#fef2f2', fg: '#b91c1c', ic: '#ef4444' },
  };
  const t = tones[tone] || tones.teal;
  return (
    <div className="fd-pill">
      <span className="fd-pill-ic" style={{ background: t.bg, color: t.ic }}><Icon name={icon} size={18} /></span>
      <div className="fd-pill-text">
        <span className="fd-pill-big">{loading ? '—' : big}</span>
        <span className="fd-pill-label">{label}</span>
      </div>
      {cta && <button className="fd-pill-cta" onClick={onClick}>{cta} <Icon name="arrow" size={13} /></button>}
    </div>
  );
}

/* ── Period switcher ── */
function PeriodSwitcher({ period, setPeriod }) {
  const iso = (d) => d.toISOString().slice(0, 10);
  const presets = [
    { label: 'This month', make: () => { const n = new Date(); return { date_from: iso(new Date(n.getFullYear(), n.getMonth(), 1)), date_to: iso(n), label: 'This month' }; } },
    { label: 'This quarter', make: () => { const n = new Date(); const q = Math.floor(n.getMonth() / 3) * 3; return { date_from: iso(new Date(n.getFullYear(), q, 1)), date_to: iso(n), label: 'This quarter' }; } },
    { label: 'This year', make: () => { const n = new Date(); return { date_from: iso(new Date(n.getFullYear(), 0, 1)), date_to: iso(n), label: 'This year' }; } },
  ];
  return (
    <div className="fd-period">
      {presets.map((p) => (
        <button key={p.label} className={period.label === p.label ? 'on' : ''} onClick={() => setPeriod(p.make())}>{p.label}</button>
      ))}
    </div>
  );
}

/* ── Chart tooltip ── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="fd-tip">
      {label && <div className="fd-tip-label">{label}</div>}
      {payload.map((p, i) => (
        <div className="fd-tip-row" key={i}>
          <span className="fd-tip-dot" style={{ background: p.color || p.payload.fill }} />
          <span className="fd-tip-name">{p.name}</span>
          <span className="fd-tip-val">{fmtFull(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── small helpers ── */
function Empty({ msg, sub }) { return <div className={`fd-empty${sub ? ' sub' : ''}`}>{msg}</div>; }
function ChartSkeleton() { return <div className="fd-chartskel"><div className="fd-skelbar w100 chart" /></div>; }
function ListSkeleton({ rows = 5 }) {
  return <div className="fd-listskel">{[...Array(rows)].map((_, i) => <div className="fd-skelbar w100" key={i} style={{ animationDelay: `${i * 60}ms` }} />)}</div>;
}
const PLACEHOLDER_HEROES = [{ key: 'a' }, { key: 'b' }, { key: 'c' }, { key: 'd' }];
