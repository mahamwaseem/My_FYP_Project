import React, { useState } from 'react';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Instrument+Serif:ital@0;1&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --teal: #0d9488;
    --teal-light: #14b8a6;
    --teal-dark: #0f766e;
    --teal-glow: rgba(13,148,136,0.15);
    --navy: #0f172a;
    --slate: #1e293b;
    --muted: #64748b;
    --border: #e2e8f0;
    --bg: #f8fafc;
    --white: #ffffff;
    --accent: #f59e0b;
  }

  body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: var(--white);
    color: var(--navy);
    overflow-x: hidden;
  }

  /* ===== NAVBAR ===== */
  .navbar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
    height: 68px;
  }

  .nav-inner {
    width: 100%; max-width: 100%;
    padding: 0 40px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo {
    display: flex; align-items: center; gap: 10px;
    text-decoration: none;
  }

  .logo-icon {
    width: 38px; height: 38px;
    background: linear-gradient(135deg, var(--teal), var(--teal-dark));
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 900; color: white;
    box-shadow: 0 4px 12px rgba(13,148,136,0.4);
  }

  .logo-text { display: flex; flex-direction: column; }
  .logo-name {
    font-size: 1.25rem; font-weight: 800; color: var(--teal);
    line-height: 1;
  }
  .logo-sub { font-size: 0.68rem; color: var(--muted); font-weight: 500; }

  .nav-links {
    display: flex; align-items: center; gap: 6px;
  }

  .nav-link {
    text-decoration: none; color: var(--slate);
    font-size: 0.88rem; font-weight: 600;
    padding: 7px 14px; border-radius: 8px;
    transition: all 0.2s;
    cursor: pointer;
    background: none; border: none; font-family: inherit;
  }
  .nav-link:hover { background: var(--teal-glow); color: var(--teal); }

  /* Templates nav link — special pill style */
  .nav-right { display: flex; align-items: center; gap: 10px; }

  .btn-outline {
    background: transparent; border: 1.5px solid var(--border);
    color: var(--slate); padding: 8px 20px;
    border-radius: 8px; font-size: 0.875rem; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
    font-family: inherit;
  }
  .btn-outline:hover { border-color: var(--teal); color: var(--teal); }

  .btn-primary {
    background: linear-gradient(135deg, var(--teal-light), var(--teal-dark));
    color: white; border: none;
    padding: 8px 22px; border-radius: 8px;
    font-size: 0.875rem; font-weight: 700;
    cursor: pointer; transition: all 0.2s;
    font-family: inherit;
    box-shadow: 0 4px 12px rgba(13,148,136,0.3);
  }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(13,148,136,0.4); }

  /* ===== HERO ===== */
  .hero {
    padding-top: 68px;
    position: relative;
    overflow: hidden;
  }

  .hero-inner {
    width: 100%; max-width: 100%;
    padding: 80px 40px 60px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    align-items: center;
  }

  .hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(13,148,136,0.3); border: 1px solid rgba(13,148,136,0.5);
    color: rgba(255,255,255,0.9); padding: 6px 14px; border-radius: 100px;
    font-size: 0.8rem; font-weight: 700;
    margin-bottom: 24px;
    letter-spacing: 0.02em;
  }

  .badge-dot {
    width: 7px; height: 7px; background: var(--teal);
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .hero-title {
    font-size: clamp(2.6rem, 4vw, 4rem);
    font-weight: 900;
    line-height: 1.08;
    color: white;
    margin-bottom: 20px;
  }

  .hero-title em {
    font-style: normal;
    font-family: 'Instrument Serif', serif;
    color: #20d9d9;
  }

  .hero-desc {
    font-size: 1.1rem; color: rgba(255,255,255,0.85);
    line-height: 1.75; margin-bottom: 36px;
    max-width: 520px;
  }

  .hero-actions {
    display: flex; align-items: center; gap: 14px;
    margin-bottom: 48px;
  }

  .btn-hero {
    background: linear-gradient(135deg, var(--teal-light), var(--teal-dark));
    color: white; border: none;
    padding: 14px 32px; border-radius: 10px;
    font-size: 1rem; font-weight: 700;
    cursor: pointer; font-family: inherit;
    box-shadow: 0 8px 24px rgba(13,148,136,0.35);
    transition: all 0.25s;
  }
  .btn-hero:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(13,148,136,0.45); }

  .btn-ghost {
    background: white; border: 1.5px solid var(--border);
    color: var(--slate); padding: 13px 24px; border-radius: 10px;
    font-size: 1rem; font-weight: 600;
    cursor: pointer; font-family: inherit;
    display: flex; align-items: center; gap: 8px;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .btn-ghost:hover { border-color: var(--teal); color: var(--teal); }

  .stats-row {
    display: flex; align-items: center; gap: 32px;
  }

  .stat { display: flex; flex-direction: column; }
  .stat-num {
    font-size: 1.8rem; font-weight: 900; color: white;
    line-height: 1;
  }
  .stat-label { font-size: 0.8rem; color: rgba(255,255,255,0.75); font-weight: 500; margin-top: 3px; }

  .stat-divider {
    width: 1px; height: 40px; background: rgba(255,255,255,0.2);
  }

  /* Hero Right - Dashboard Preview */
  .hero-visual { position: relative; }

  .dashboard-card {
    background: white;
    border-radius: 20px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04);
    overflow: hidden;
  }

  .db-header {
    background: linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%);
    padding: 20px 24px;
    display: flex; align-items: center; justify-content: space-between;
  }

  .db-header-title { color: white; font-weight: 700; font-size: 0.9rem; }

  .db-dots { display: flex; gap: 6px; }
  .db-dot {
    width: 10px; height: 10px; border-radius: 50%;
    background: rgba(255,255,255,0.4);
  }
  .db-dot:first-child { background: rgba(255,255,255,0.8); }

  .db-body { padding: 24px; }

  .db-metrics {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 12px; margin-bottom: 20px;
  }

  .db-metric {
    background: var(--bg); border-radius: 12px; padding: 14px;
    border: 1px solid var(--border);
  }
  .db-metric-label { font-size: 0.72rem; color: var(--muted); font-weight: 600; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
  .db-metric-val { font-size: 1.3rem; font-weight: 800; color: var(--navy); }
  .db-metric-change { font-size: 0.72rem; color: #10b981; font-weight: 600; margin-top: 2px; }

  .db-chart-area {
    background: var(--bg); border-radius: 12px; padding: 16px;
    border: 1px solid var(--border); margin-bottom: 16px;
  }
  .db-chart-title { font-size: 0.8rem; font-weight: 700; color: var(--slate); margin-bottom: 12px; }

  .chart-bars {
    display: flex; align-items: flex-end; gap: 8px; height: 70px;
  }

  .chart-bar {
    flex: 1; border-radius: 6px 6px 0 0;
    background: linear-gradient(180deg, var(--teal-light), var(--teal-dark));
    transition: all 0.3s;
  }
  .chart-bar.dim { background: linear-gradient(180deg, #e2e8f0, #cbd5e1); }

  .db-recent { display: flex; flex-direction: column; gap: 8px; }
  .db-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 10px; background: var(--bg); border-radius: 8px;
    border: 1px solid var(--border);
  }
  .db-row-left { display: flex; align-items: center; gap: 10px; }
  .db-row-icon {
    width: 28px; height: 28px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center; font-size: 13px;
  }
  .db-row-name { font-size: 0.8rem; font-weight: 600; color: var(--slate); }
  .db-row-sub { font-size: 0.7rem; color: var(--muted); }
  .db-row-amount { font-size: 0.85rem; font-weight: 700; }
  .db-row-amount.pos { color: #10b981; }
  .db-row-amount.neg { color: #ef4444; }

  /* ===== FEATURES APP GRID ===== */
  .features-section {
    padding: 80px 40px;
    background: var(--navy);
    position: relative;
    overflow: hidden;
  }

  .features-section::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 20% 50%, rgba(13,148,136,0.15) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 50%, rgba(13,148,136,0.08) 0%, transparent 60%);
    pointer-events: none;
  }

  .section-tag {
    display: inline-block;
    font-size: 0.75rem; font-weight: 800; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--teal-light);
    margin-bottom: 12px;
  }

  .section-title {
    font-size: clamp(2rem, 3vw, 2.8rem);
    font-weight: 900; color: white;
    line-height: 1.15; margin-bottom: 12px;
  }

  .section-title em {
    font-style: normal;
    font-family: 'Instrument Serif', serif;
    color: var(--teal-light);
  }

  .section-sub { font-size: 1rem; color: #94a3b8; max-width: 520px; margin-bottom: 60px; }

  .features-headline {
    display: flex; flex-direction: column; align-items: center; text-align: center;
    margin-bottom: 56px;
  }

  .features-headline .section-sub { margin: 0 auto; }

  .modules-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 20px;
    max-width: 100%;
  }

  .module-card {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px;
    padding: 24px 16px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
    overflow: hidden;
  }

  .module-card:hover {
    background: rgba(13,148,136,0.15);
    border-color: rgba(13,148,136,0.4);
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(13,148,136,0.2);
  }

  /* Templates module card gets a special shimmer border */
  .module-card-templates {
    border-color: rgba(13,148,136,0.35) !important;
    background: rgba(13,148,136,0.08) !important;
  }
  .module-card-templates::after {
    content: 'NEW';
    position: absolute; top: 10px; right: 10px;
    font-size: 0.55rem; font-weight: 800; letter-spacing: 0.08em;
    background: var(--teal); color: white;
    padding: 2px 6px; border-radius: 4px;
  }
  .module-card-templates:hover {
    background: rgba(13,148,136,0.22) !important;
    border-color: rgba(13,148,136,0.6) !important;
  }

  .module-icon-wrap {
    width: 64px; height: 64px;
    border-radius: 18px;
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; margin: 0 auto 12px;
  }

  .module-name {
    font-size: 0.8rem; font-weight: 700; color: white;
    line-height: 1.3;
  }

  .module-desc {
    font-size: 0.7rem; color: #64748b; margin-top: 4px; font-weight: 500;
  }

  .module-card--clickable:hover .module-name { color: var(--teal-light); }

  /* ===== MENU SECTION ===== */
  .menu-section {
    padding: 80px 40px;
    background: white;
  }

  .menu-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 24px;
  }

  .menu-panel {
    border: 1.5px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.3s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .menu-panel:hover {
    box-shadow: 0 8px 32px rgba(13,148,136,0.12);
    border-color: rgba(13,148,136,0.3);
  }
  .panel-header {
    padding: 18px 22px;
    background: linear-gradient(135deg, var(--teal), var(--teal-dark));
    cursor: pointer;
    display: flex; align-items: center; justify-content: space-between;
    user-select: none;
  }
  .panel-header-left { display: flex; align-items: center; gap: 12px; }
  .panel-hicon {
    width: 38px; height: 38px; background: rgba(255,255,255,0.2);
    border-radius: 10px; display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }
  .panel-title { color: white; font-size: 1rem; font-weight: 700; }
  .panel-count { color: rgba(255,255,255,0.75); font-size: 0.75rem; font-weight: 500; }
  .panel-chevron {
    color: white; font-size: 0.9rem;
    transition: transform 0.3s;
    opacity: 0.8;
  }
  .panel-chevron.open { transform: rotate(180deg); }
  .panel-body { background: white; }
  .panel-items-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 1px;
    background: var(--border);
  }
  .panel-item {
    background: white;
    padding: 14px 18px;
    display: flex; align-items: center; gap: 10px;
    text-decoration: none; color: var(--slate);
    font-size: 0.875rem; font-weight: 600;
    transition: all 0.2s;
    cursor: pointer;
  }
  .panel-item:hover { background: rgba(13,148,136,0.06); color: var(--teal); }
  .panel-item-icon {
    width: 32px; height: 32px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center; font-size: 16px;
    flex-shrink: 0;
  }
  .panel-item-text { display: flex; flex-direction: column; }
  .panel-item-label { font-size: 0.83rem; font-weight: 600; }
  .panel-item-sub { font-size: 0.7rem; color: var(--muted); font-weight: 500; }
  .panel-footer {
    padding: 12px 18px;
    border-top: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
  }
  .view-all-link {
    font-size: 0.8rem; font-weight: 700; color: var(--teal);
    text-decoration: none;
    display: flex; align-items: center; gap: 5px;
  }
  .view-all-link:hover { color: var(--teal-dark); }

  /* ===== COA SPECIAL PANEL ===== */
  .coa-panel {
    border: 1.5px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.3s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .coa-panel:hover {
    box-shadow: 0 8px 36px rgba(26,154,146,0.16);
    border-color: rgba(26,154,146,0.4);
  }
  .coa-header {
    padding: 18px 22px;
    background: linear-gradient(135deg, #1a9a92 0%, #0d7a73 100%);
    cursor: pointer;
    display: flex; align-items: center; justify-content: space-between;
    user-select: none;
    position: relative; overflow: hidden;
  }
  .coa-header::before {
    content: '';
    position: absolute; top: -40px; right: -40px;
    width: 120px; height: 120px;
    border-radius: 50%;
    background: rgba(255,255,255,0.07);
    pointer-events: none;
  }
  .coa-header-left { display: flex; align-items: center; gap: 14px; }
  .coa-hicon {
    width: 42px; height: 42px;
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.28);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; transition: transform 0.2s;
  }
  .coa-panel:hover .coa-hicon { transform: scale(1.06); }
  .coa-title { color: white; font-size: 1.05rem; font-weight: 800; letter-spacing: -0.01em; }
  .coa-count { color: rgba(255,255,255,0.68); font-size: 0.74rem; font-weight: 500; margin-top: 2px; }
  .coa-chevron {
    width: 32px; height: 32px;
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.22);
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    color: white; font-size: 11px;
    transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), background 0.2s;
    flex-shrink: 0;
  }
  .coa-chevron.open { transform: rotate(180deg); background: rgba(255,255,255,0.28); }

  .coa-submenu {
    max-height: 0; overflow: hidden;
    transition: max-height 0.42s cubic-bezier(0.4,0,0.2,1);
    background: #fff;
  }
  .coa-submenu.open { max-height: 600px; }
  .coa-submenu-inner { padding: 10px 12px 12px; }

  .coa-sub-item {
    display: flex; align-items: center; gap: 14px;
    padding: 12px 14px; border-radius: 11px;
    cursor: pointer;
    transition: background 0.18s, transform 0.2s, border-color 0.18s;
    margin-bottom: 5px;
    border: 1.5px solid transparent;
    text-decoration: none; color: inherit;
    position: relative; overflow: hidden;
  }
  .coa-sub-item:last-child { margin-bottom: 0; }
  .coa-sub-item::before {
    content: '';
    position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: #1a9a92; border-radius: 0 3px 3px 0;
    transform: scaleY(0);
    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
    transform-origin: center;
  }
  .coa-sub-item:hover::before { transform: scaleY(1); }
  .coa-sub-item:hover {
    background: #f0faf9; border-color: rgba(26,154,146,0.18);
    transform: translateX(4px);
  }
  .coa-submenu.open .coa-sub-item { animation: coa-item-in 0.32s ease both; }
  .coa-submenu.open .coa-sub-item:nth-child(1) { animation-delay: 0.05s; }
  .coa-submenu.open .coa-sub-item:nth-child(2) { animation-delay: 0.10s; }
  .coa-submenu.open .coa-sub-item:nth-child(3) { animation-delay: 0.15s; }
  .coa-submenu.open .coa-sub-item:nth-child(4) { animation-delay: 0.20s; }

  @keyframes coa-item-in {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .coa-sub-icon {
    width: 40px; height: 40px; border-radius: 11px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; flex-shrink: 0;
    transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1);
  }
  .coa-sub-item:hover .coa-sub-icon { transform: scale(1.15) rotate(-3deg); }
  .coa-sub-text { flex: 1; min-width: 0; }
  .coa-sub-label { font-size: 0.9rem; font-weight: 700; color: #0f2e2c; letter-spacing: -0.01em; }
  .coa-sub-desc { font-size: 0.72rem; color: #64748b; font-weight: 500; margin-top: 1px; }
  .coa-sub-badge {
    font-size: 0.6rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;
    background: rgba(26,154,146,0.1); color: #1a9a92;
    padding: 2px 8px; border-radius: 20px; border: 1px solid rgba(26,154,146,0.2);
    flex-shrink: 0; transition: background 0.18s;
  }
  .coa-sub-item:hover .coa-sub-badge { background: rgba(26,154,146,0.18); }
  .coa-sub-arrow {
    width: 28px; height: 28px; border-radius: 8px;
    background: #f1f5f9;
    display: flex; align-items: center; justify-content: center;
    color: #94a3b8; font-size: 12px; flex-shrink: 0;
    transition: background 0.18s, color 0.18s, transform 0.2s;
  }
  .coa-sub-item:hover .coa-sub-arrow { background: #1a9a92; color: white; transform: translateX(3px); }
  .coa-footer {
    padding: 10px 16px 14px; border-top: 1px solid #f1f5f9;
    display: flex; align-items: center; justify-content: center;
  }
  .coa-view-all {
    font-size: 0.82rem; font-weight: 700; color: #1a9a92;
    text-decoration: none;
    display: flex; align-items: center; gap: 6px;
    padding: 7px 16px; border-radius: 8px;
    transition: background 0.18s, color 0.18s;
  }
  .coa-view-all:hover { background: #f0faf9; color: #0d7a73; }
  .coa-view-all-arrow { transition: transform 0.2s; display: inline-block; }
  .coa-view-all:hover .coa-view-all-arrow { transform: translateX(4px); }

  /* ===== TEMPLATES PANEL (in command center) ===== */
  .templates-panel {
    border: 1.5px solid rgba(13,148,136,0.25);
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.3s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    grid-column: span 1;
  }
  .templates-panel:hover {
    box-shadow: 0 8px 36px rgba(13,148,136,0.18);
    border-color: rgba(13,148,136,0.5);
  }
  .templates-panel-header {
    padding: 18px 22px;
    background: linear-gradient(135deg, #0d9488 0%, #065f5b 100%);
    cursor: pointer;
    display: flex; align-items: center; justify-content: space-between;
    user-select: none; position: relative; overflow: hidden;
  }
  .templates-panel-header::after {
    content: '';
    position: absolute; bottom: -30px; right: -30px;
    width: 100px; height: 100px; border-radius: 50%;
    background: rgba(255,255,255,0.06); pointer-events: none;
  }
  .templates-panel-left { display: flex; align-items: center; gap: 14px; }
  .templates-panel-hicon {
    width: 42px; height: 42px;
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.28);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; transition: transform 0.2s;
  }
  .templates-panel:hover .templates-panel-hicon { transform: scale(1.06) rotate(-5deg); }
  .templates-panel-title { color: white; font-size: 1.05rem; font-weight: 800; }
  .templates-panel-sub { color: rgba(255,255,255,0.65); font-size: 0.74rem; font-weight: 500; margin-top: 2px; }
  .templates-panel-badge {
    background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);
    color: white; font-size: 0.65rem; font-weight: 800; letter-spacing: 0.07em;
    padding: 3px 9px; border-radius: 20px; text-transform: uppercase;
    flex-shrink: 0;
  }
  .templates-panel-body { padding: 16px; background: white; }
  .tpl-quick-grid {
    display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 14px;
  }
  .tpl-quick-item {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    padding: 12px 8px; border-radius: 10px;
    border: 1.5px solid var(--border);
    cursor: pointer; transition: all 0.2s; text-align: center;
  }
  .tpl-quick-item:hover {
    border-color: var(--teal); background: rgba(13,148,136,0.05);
    transform: translateY(-2px);
  }
  .tpl-quick-icon {
    width: 34px; height: 34px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center; font-size: 16px;
  }
  .tql-quick-name { font-size: 0.72rem; font-weight: 700; color: var(--slate); }
  .tql-quick-count { font-size: 0.65rem; color: var(--muted); }
  .tpl-panel-footer {
    border-top: 1px solid var(--border); padding-top: 12px;
    display: flex; align-items: center; justify-content: center;
  }
  .tpl-view-all {
    font-size: 0.82rem; font-weight: 700; color: var(--teal);
    display: flex; align-items: center; gap: 6px;
    padding: 7px 16px; border-radius: 8px;
    transition: background 0.18s; text-decoration: none; cursor: pointer;
    background: none; border: none; font-family: inherit;
  }
  .tpl-view-all:hover { background: rgba(13,148,136,0.08); }
  .tpl-arrow { transition: transform 0.2s; display: inline-block; }
  .tpl-view-all:hover .tpl-arrow { transform: translateX(4px); }

  /* ===== WHY SECTION ===== */
  .why-section { padding: 80px 40px; background: var(--bg); }
  .why-grid {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 20px; margin-top: 48px;
  }
  .why-card {
    background: white; border-radius: 16px; padding: 28px 24px;
    border: 1.5px solid var(--border); transition: all 0.3s;
    position: relative; overflow: hidden;
  }
  .why-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, var(--teal), var(--teal-light));
    transform: scaleX(0); transition: transform 0.3s; transform-origin: left;
  }
  .why-card:hover { border-color: rgba(13,148,136,0.3); box-shadow: 0 12px 36px rgba(13,148,136,0.1); transform: translateY(-4px); }
  .why-card:hover::before { transform: scaleX(1); }
  .why-icon {
    width: 50px; height: 50px;
    background: rgba(13,148,136,0.1); border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; margin-bottom: 16px;
  }
  .why-title { font-size: 1rem; font-weight: 800; color: var(--navy); margin-bottom: 8px; }
  .why-desc { font-size: 0.875rem; color: var(--muted); line-height: 1.65; }

  /* ===== TESTIMONIALS ===== */
  .testimonials-section { padding: 80px 40px; background: white; }
  .testimonials-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 24px; margin-top: 48px;
  }
  .testimonial-card {
    background: var(--bg); border: 1.5px solid var(--border);
    border-radius: 16px; padding: 28px 24px;
  }
  .quote-mark {
    font-size: 3rem; color: var(--teal); font-family: 'Instrument Serif', serif;
    line-height: 0.7; margin-bottom: 16px; display: block;
  }
  .testimonial-text { font-size: 0.9rem; color: var(--slate); line-height: 1.7; margin-bottom: 20px; }
  .testimonial-author { display: flex; align-items: center; gap: 12px; }
  .author-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    background: linear-gradient(135deg, var(--teal), var(--teal-dark));
    display: flex; align-items: center; justify-content: center;
    color: white; font-weight: 800; font-size: 0.9rem;
  }
  .author-name { font-size: 0.875rem; font-weight: 700; color: var(--navy); }
  .author-role { font-size: 0.75rem; color: var(--muted); }

  /* ===== CTA ===== */
  .cta-section {
    padding: 80px 40px;
    background: linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%);
    text-align: center; position: relative; overflow: hidden;
  }
  .cta-section::before {
    content: ''; position: absolute; inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    pointer-events: none;
  }
  .cta-title { font-size: clamp(2rem, 3vw, 3rem); font-weight: 900; color: white; margin-bottom: 16px; position: relative; }
  .cta-sub { font-size: 1.1rem; color: rgba(255,255,255,0.85); margin-bottom: 36px; position: relative; }
  .cta-actions { display: flex; align-items: center; justify-content: center; gap: 14px; position: relative; }
  .btn-cta-white {
    background: white; color: var(--teal-dark); border: none;
    padding: 14px 32px; border-radius: 10px;
    font-size: 1rem; font-weight: 700; cursor: pointer; font-family: inherit;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15); transition: all 0.25s;
  }
  .btn-cta-white:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.2); }
  .btn-cta-outline {
    background: transparent; border: 2px solid rgba(255,255,255,0.5);
    color: white; padding: 12px 28px; border-radius: 10px;
    font-size: 1rem; font-weight: 600; cursor: pointer; font-family: inherit;
    transition: all 0.2s;
  }
  .btn-cta-outline:hover { border-color: white; background: rgba(255,255,255,0.1); }

  /* ===== FOOTER ===== */
  .footer { background: var(--navy); padding: 60px 40px 32px; color: #94a3b8; }
  .footer-grid {
    display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 40px; margin-bottom: 48px;
  }
  .footer-logo-name { font-size: 1.5rem; font-weight: 900; color: var(--teal-light); margin-bottom: 8px; }
  .footer-brand-desc { font-size: 0.875rem; line-height: 1.7; color: #64748b; }
  .footer-col-title { font-size: 0.8rem; font-weight: 800; color: white; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 16px; }
  .footer-link { display: block; font-size: 0.875rem; color: #64748b; text-decoration: none; margin-bottom: 10px; transition: color 0.2s; }
  .footer-link:hover { color: var(--teal-light); }
  .footer-bottom {
    border-top: 1px solid rgba(255,255,255,0.08); padding-top: 24px;
    display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem;
  }
  .footer-bottom-links { display: flex; gap: 20px; }

  /* Responsive */
  @media (max-width: 1200px) { .modules-grid { grid-template-columns: repeat(4, 1fr); } }
  @media (max-width: 900px) {
    .hero-inner { grid-template-columns: 1fr; }
    .hero-visual { display: none; }
    .menu-grid { grid-template-columns: 1fr; }
    .why-grid { grid-template-columns: repeat(2, 1fr); }
    .testimonials-grid { grid-template-columns: 1fr; }
    .footer-grid { grid-template-columns: 1fr 1fr; }
    .modules-grid { grid-template-columns: repeat(3, 1fr); }
    .tpl-quick-grid { grid-template-columns: 1fr 1fr 1fr; }
  }
  @media (max-width: 640px) {
    .nav-links { display: none; }
    .why-grid { grid-template-columns: 1fr; }
    .modules-grid { grid-template-columns: repeat(2, 1fr); }
    .footer-grid { grid-template-columns: 1fr; }
    .hero-inner, .features-section, .menu-section, .why-section, .testimonials-section, .cta-section, .footer { padding-left: 20px; padding-right: 20px; }
    .nav-inner { padding: 0 20px; }
  }
`;

const modules = [
  { icon: '📊', name: 'Accounting',  desc: 'Full ledger',       bg: 'linear-gradient(135deg,#0d9488,#0f766e)' },
  { icon: '📄', name: 'Invoicing',   desc: 'Bills & invoices',  bg: 'linear-gradient(135deg,#7c3aed,#5b21b6)' },
  { icon: '💰', name: 'Payroll',     desc: 'Salaries & tax',    bg: 'linear-gradient(135deg,#f59e0b,#d97706)' },
  { icon: '📦', name: 'Inventory',   desc: 'Stock tracking',    bg: 'linear-gradient(135deg,#10b981,#059669)' },
  { icon: '🏦', name: 'Banking',     desc: 'Reconciliation',    bg: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' },
  { icon: '📈', name: 'Reports',     desc: 'Analytics',         bg: 'linear-gradient(135deg,#ef4444,#b91c1c)' },
  { icon: '🛒', name: 'Purchase',    desc: 'PO management',     bg: 'linear-gradient(135deg,#ec4899,#be185d)' },
  { icon: '🤝', name: 'CRM',         desc: 'Clients & leads',   bg: 'linear-gradient(135deg,#06b6d4,#0891b2)' },
  { icon: '📝', name: 'Contracts',   desc: 'Agreements',        bg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' },
  { icon: '⏱️', name: 'Timesheets',  desc: 'Time tracking',     bg: 'linear-gradient(135deg,#f97316,#ea580c)' },
  { icon: '🏗️', name: 'Projects',   desc: 'Task & budget',     bg: 'linear-gradient(135deg,#14b8a6,#0d9488)' },
  // ── Templates module ──
  { icon: '🎨', name: 'Templates',   desc: 'Voucher designs',   bg: 'linear-gradient(135deg,#0d9488,#14b8a6)', isTemplates: true },
];

const coaSubItems = [
  { icon: '🗂️', bg: '#d1fae5', label: 'Group',    desc: 'Organize account groups',    route: 'account-group' },
  { icon: '📂', bg: '#dbeafe', label: 'Category', desc: 'Account categories',          route: 'account-category' },
  { icon: '🏷️', bg: '#f3e8ff', label: 'Class',    desc: 'Classification types',        route: 'account-class' },
  { icon: '📒', bg: '#fef3c7', label: 'Account',  desc: 'Individual ledger accounts',  route: 'account-account' },
];

const panelsData = [
  {
    icon: '📄', title: 'Vouchers', count: '6 types',
    items: [
      { icon: '💚', bg: '#dcfce7', label: 'Receipt',  sub: 'Money received' },
      { icon: '🔴', bg: '#fee2e2', label: 'Payment',  sub: 'Money paid out' },
      { icon: '🔄', bg: '#dbeafe', label: 'Contra',   sub: 'Cash/bank transfer' },
      { icon: '📓', bg: '#f3e8ff', label: 'Journal',  sub: 'Adjusting entries' },
      { icon: '🛍️', bg: '#fff7ed', label: 'Sales',    sub: 'Customer invoices' },
      { icon: '🛒', bg: '#fef9c3', label: 'Purchase', sub: 'Vendor bills' },
    ]
  },
  {
    icon: '📈', title: 'Reports', count: '6 reports',
    items: [
      { icon: '⚖️', bg: '#dbeafe', label: 'Balance Sheet',    sub: 'Assets vs liabilities' },
      { icon: '📊', bg: '#dcfce7', label: 'Profit & Loss',    sub: 'Income statement' },
      { icon: '🔢', bg: '#f3e8ff', label: 'Trial Balance',    sub: 'Debit/credit check' },
      { icon: '💸', bg: '#fff7ed', label: 'Cash Flow',        sub: 'Liquidity report' },
      { icon: '📖', bg: '#fef9c3', label: 'General Ledger',   sub: 'All transactions' },
      { icon: '⏰', bg: '#fee2e2', label: 'Aged Receivables', sub: 'Outstanding dues' },
    ]
  }
];

const templateQuickItems = [
  { icon: '🏢', bg: '#e6f7f6', name: 'Invoice',  count: '2 types' },
  { icon: '🎁', bg: '#fef9ec', name: 'Voucher',  count: '2 types' },
  { icon: '🧾', bg: '#f0effe', name: 'Receipt',  count: '1 type' },
  { icon: '📋', bg: '#ecfdf5', name: 'Credit',   count: '1 type' },
  { icon: '🏷️', bg: '#fff1f1', name: 'Coupon',  count: '1 type' },
  { icon: '📦', bg: '#eff6ff', name: 'PO',       count: '1 type' },
];

const whyCards = [
  { icon: '🔐', title: 'Bank-Grade Security',  desc: '256-bit SSL encryption with two-factor authentication keeps your financial data safe at all times.' },
  { icon: '☁️', title: 'Cloud-First Access',   desc: 'Access your accounts from any device, anywhere in the world — real-time sync across all platforms.' },
  { icon: '🤖', title: 'Smart Automation',     desc: 'Auto-reconciliation, recurring vouchers, and AI-powered anomaly detection save hours every week.' },
  { icon: '📊', title: 'IFRS Compliant',       desc: 'Built for international standards with multi-currency support, tax management, and audit-ready reporting.' },
];

const testimonials = [
  { text: "FinTrack transformed how we manage our books. The voucher system is incredibly intuitive and the reports give us exactly what our auditors need.", name: 'Sara Ahmed',   role: 'CFO, TechBridge Solutions',    init: 'SA' },
  { text: "We switched from manual Excel sheets to FinTrack and cut our accounting time by 60%. The Chart of Accounts setup was seamless.",                  name: 'Khalid Mirza', role: 'Owner, Mirza Trading Co.',     init: 'KM' },
  { text: "The real-time dashboard and cash flow reports have been game-changing for our financial decisions. Highly recommended.",                           name: 'Priya Sharma', role: 'Finance Manager, BuildCraft',  init: 'PS' },
];

export default function HomePage({ onNavigate }) {
  const [openPanels, setOpenPanels] = useState({ 0: true, 1: true });
  const [coaOpen, setCoaOpen] = useState(false);

  const togglePanel = (i) => setOpenPanels(p => ({ ...p, [i]: !p[i] }));
  const toggleCoa   = () => setCoaOpen(v => !v);

  const moduleRoutes = {
    'Accounting': 'account-group',
    'Templates':  'templates',
  };

  const handleModuleClick  = (name) => { const r = moduleRoutes[name]; if (r && onNavigate) onNavigate(r); };
  const handleCoaSubClick  = (route) => { if (route && onNavigate) onNavigate(route); };
  const goToTemplates      = () => { if (onNavigate) onNavigate('templates'); };

  const bars = [40, 65, 45, 80, 55, 90, 70];

  return (
    <>
      <style>{styles}</style>

      {/* ── NAVBAR ── */}
      <nav className="navbar">
        <div className="nav-inner">
          <a href="#" className="logo">
            <div className="logo-icon">F</div>
            <div className="logo-text">
              <span className="logo-name">FinTrack</span>
              <span className="logo-sub">Professional Accounting</span>
            </div>
          </a>

          <div className="nav-links">
            {['Dashboard', 'Features', 'Vouchers', 'Reports', 'Pricing', 'Contact'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="nav-link">{l}</a>
            ))}

            {/* ── Templates nav link ── */}
            <button className="nav-link" onClick={goToTemplates}>
              Templates
            </button>
          </div>

          <div className="nav-right">
            <button className="btn-outline">Login</button>
            <button className="btn-primary">Start Free Trial</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url(/hero-bg.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
        <div className="hero-inner">
          <div>
            <div className="hero-badge">
              <span className="badge-dot" />
              Trusted by 25,000+ businesses
            </div>
            <h1 className="hero-title">
              The <em>Complete</em> Accounting<br />Platform for Modern<br />Business
            </h1>
            <p className="hero-desc">
              From journal entries to financial statements — FinTrack gives your team professional-grade accounting tools with real-time visibility and automated compliance.
            </p>
            <div className="hero-actions">
              <button className="btn-hero">Start Free Trial →</button>
              <button className="btn-ghost"><span>▶</span> Watch Demo</button>
            </div>
            <div className="stats-row">
              {[['25K+','Active Businesses'],['99.9%','Uptime SLA'],['24/7','Expert Support'],['4.9★','User Rating']].map(([n,l],i,a) => (
                <React.Fragment key={l}>
                  <div className="stat">
                    <span className="stat-num">{n}</span>
                    <span className="stat-label">{l}</span>
                  </div>
                  {i < a.length - 1 && <div className="stat-divider" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="hero-visual">
            <div className="dashboard-card">
              <div className="db-header">
                <span className="db-header-title">📊 FinTrack Dashboard</span>
                <div className="db-dots"><div className="db-dot"/><div className="db-dot"/><div className="db-dot"/></div>
              </div>
              <div className="db-body">
                <div className="db-metrics">
                  {[{l:'Revenue',v:'$84,200',c:'+12.5%'},{l:'Expenses',v:'$31,450',c:'+3.2%'},{l:'Net Profit',v:'$52,750',c:'+18.7%'}].map(m => (
                    <div key={m.l} className="db-metric">
                      <div className="db-metric-label">{m.l}</div>
                      <div className="db-metric-val">{m.v}</div>
                      <div className="db-metric-change">↑ {m.c}</div>
                    </div>
                  ))}
                </div>
                <div className="db-chart-area">
                  <div className="db-chart-title">Monthly Revenue — 2025</div>
                  <div className="chart-bars">
                    {bars.map((h,i) => <div key={i} className={`chart-bar ${i < 5 ? '' : 'dim'}`} style={{ height: `${h}%` }} />)}
                  </div>
                </div>
                <div className="db-recent">
                  {[
                    { icon:'💚', bg:'#dcfce7', name:'Receipt Voucher', sub:'Acme Corp',     amt:'+$12,500', cls:'pos' },
                    { icon:'🔴', bg:'#fee2e2', name:'Payment Voucher', sub:'Office Rent',   amt:'-$3,200',  cls:'neg' },
                    { icon:'📓', bg:'#f3e8ff', name:'Journal Entry',   sub:'Depreciation',  amt:'-$850',    cls:'neg' },
                  ].map(r => (
                    <div key={r.name} className="db-row">
                      <div className="db-row-left">
                        <div className="db-row-icon" style={{ background: r.bg }}>{r.icon}</div>
                        <div><div className="db-row-name">{r.name}</div><div className="db-row-sub">{r.sub}</div></div>
                      </div>
                      <div className={`db-row-amount ${r.cls}`}>{r.amt}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES MODULES ── */}
      <section className="features-section" id="features">
        <div className="features-headline">
          <span className="section-tag">Everything you need</span>
          <h2 className="section-title">All your business on <em>one platform.</em></h2>
          <p className="section-sub">Simple, efficient, yet affordable — every module designed to work seamlessly together.</p>
        </div>
        <div className="modules-grid">
          {modules.map(m => (
            <div
              key={m.name}
              className={`module-card module-card--clickable${m.isTemplates ? ' module-card-templates' : ''}`}
              onClick={() => handleModuleClick(m.name)}
            >
              <div className="module-icon-wrap" style={{ background: m.bg }}>
                <span style={{ fontSize: '28px' }}>{m.icon}</span>
              </div>
              <div className="module-name">{m.name}</div>
              <div className="module-desc">{m.desc}</div>
              {moduleRoutes[m.name] && (
                <div style={{ marginTop: '8px', fontSize: '0.65rem', color: 'rgba(13,148,136,0.8)', fontWeight: 700, letterSpacing: '0.05em' }}>
                  OPEN →
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── COMMAND CENTER ── */}
      <section className="menu-section" id="dashboard">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span className="section-tag" style={{ color: 'var(--teal)' }}>Quick Access</span>
          <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.5rem)', fontWeight: 900, color: 'var(--navy)', marginBottom: '12px' }}>
            Your Accounting <em style={{ fontStyle: 'normal', fontFamily: '"Instrument Serif",serif', color: 'var(--teal)' }}>Command Center</em>
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>Click any category to explore and navigate instantly.</p>
        </div>

        {/* 4-column grid: COA | Vouchers | Reports | Templates */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '24px' }}>

          {/* COA */}
          <div className="coa-panel">
            <div className="coa-header" onClick={toggleCoa}>
              <div className="coa-header-left">
                <div className="coa-hicon">📊</div>
                <div><div className="coa-title">Chart of Accounts</div><div className="coa-count">4 sub-modules</div></div>
              </div>
              <div className={`coa-chevron${coaOpen ? ' open' : ''}`}>▼</div>
            </div>
            <div className={`coa-submenu${coaOpen ? ' open' : ''}`}>
              <div className="coa-submenu-inner">
                {coaSubItems.map(item => (
                  <div key={item.label} className="coa-sub-item" onClick={() => handleCoaSubClick(item.route)} style={{ cursor: 'pointer' }}>
                    <div className="coa-sub-icon" style={{ background: item.bg }}>{item.icon}</div>
                    <div className="coa-sub-text">
                      <div className="coa-sub-label">{item.label}</div>
                      <div className="coa-sub-desc">{item.desc}</div>
                    </div>
                    <span className="coa-sub-badge">Open</span>
                    <div className="coa-sub-arrow">›</div>
                  </div>
                ))}
              </div>
              <div className="coa-footer">
                <a href="#" className="coa-view-all" onClick={e => { e.preventDefault(); handleCoaSubClick('account-group'); }}>
                  View all Chart of Accounts <span className="coa-view-all-arrow">→</span>
                </a>
              </div>
            </div>
          </div>

          {/* Vouchers & Reports */}
          {panelsData.map((panel, i) => (
            <div key={i} className="menu-panel">
              <div className="panel-header" onClick={() => togglePanel(i)}>
                <div className="panel-header-left">
                  <div className="panel-hicon">{panel.icon}</div>
                  <div><div className="panel-title">{panel.title}</div><div className="panel-count">{panel.count}</div></div>
                </div>
                <span className={`panel-chevron ${openPanels[i] ? 'open' : ''}`}>▼</span>
              </div>
              {openPanels[i] && (
                <div className="panel-body">
                  <div className="panel-items-grid">
                    {panel.items.map(item => (
                      <a key={item.label} href={`#${item.label.toLowerCase().replace(/ /g,'-')}`} className="panel-item">
                        <div className="panel-item-icon" style={{ background: item.bg }}>{item.icon}</div>
                        <div className="panel-item-text">
                          <span className="panel-item-label">{item.label}</span>
                          <span className="panel-item-sub">{item.sub}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                  <div className="panel-footer">
                    <a href="#" className="view-all-link">View all {panel.title} →</a>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* ── Templates Panel ── */}
          <div className="templates-panel">
            <div className="templates-panel-header" onClick={goToTemplates}>
              <div className="templates-panel-left">
                <div className="templates-panel-hicon">🎨</div>
                <div>
                  <div className="templates-panel-title">Voucher Templates</div>
                  <div className="templates-panel-sub">6 ready-made designs</div>
                </div>
              </div>
              <span className="templates-panel-badge">Layer 1</span>
            </div>
            <div className="templates-panel-body">
              <div className="tpl-quick-grid">
                {templateQuickItems.map(t => (
                  <div key={t.name} className="tpl-quick-item" onClick={goToTemplates}>
                    <div className="tpl-quick-icon" style={{ background: t.bg }}>{t.icon}</div>
                    <div className="tql-quick-name">{t.name}</div>
                    <div className="tql-quick-count">{t.count}</div>
                  </div>
                ))}
              </div>
              <div className="tpl-panel-footer">
                <button className="tpl-view-all" onClick={goToTemplates}>
                  Browse all Templates <span className="tpl-arrow">→</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── WHY ── */}
      <section className="why-section">
        <div style={{ textAlign: 'center' }}>
          <span className="section-tag" style={{ color: 'var(--teal)' }}>Why FinTrack</span>
          <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.5rem)', fontWeight: 900, color: 'var(--navy)' }}>
            Built for serious <em style={{ fontStyle: 'normal', fontFamily: '"Instrument Serif",serif', color: 'var(--teal)' }}>financial management</em>
          </h2>
        </div>
        <div className="why-grid">
          {whyCards.map(c => (
            <div key={c.title} className="why-card">
              <div className="why-icon">{c.icon}</div>
              <div className="why-title">{c.title}</div>
              <div className="why-desc">{c.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="testimonials-section">
        <div style={{ textAlign: 'center', marginBottom: '0' }}>
          <span className="section-tag" style={{ color: 'var(--teal)' }}>Customer Stories</span>
          <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.5rem)', fontWeight: 900, color: 'var(--navy)' }}>
            Trusted by businesses <em style={{ fontStyle: 'normal', fontFamily: '"Instrument Serif",serif', color: 'var(--teal)' }}>worldwide</em>
          </h2>
        </div>
        <div className="testimonials-grid">
          {testimonials.map(t => (
            <div key={t.name} className="testimonial-card">
              <span className="quote-mark">"</span>
              <p className="testimonial-text">{t.text}</p>
              <div className="testimonial-author">
                <div className="author-avatar">{t.init}</div>
                <div><div className="author-name">{t.name}</div><div className="author-role">{t.role}</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <h2 className="cta-title">Ready to Transform Your Accounting?</h2>
        <p className="cta-sub">Join 25,000+ businesses that trust FinTrack for their financial management.</p>
        <div className="cta-actions">
          <button className="btn-cta-white">Start Free 30-Day Trial</button>
          <button className="btn-cta-outline">Schedule a Demo</button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-grid">
          <div>
            <div className="footer-logo-name">FinTrack</div>
            <p className="footer-brand-desc">Professional accounting software designed for businesses of all sizes. Simplify your finances, amplify your growth.</p>
          </div>
          <div>
            <div className="footer-col-title">Product</div>
            {['Dashboard','Chart of Accounts','Vouchers','Templates','Reports','Payroll','Inventory'].map(l => (
              <a key={l} href="#" className="footer-link"
                onClick={l === 'Templates' ? (e) => { e.preventDefault(); goToTemplates(); } : undefined}
              >{l}</a>
            ))}
          </div>
          <div>
            <div className="footer-col-title">Company</div>
            {['About Us','Blog','Careers','Press','Partners','Contact'].map(l => (
              <a key={l} href="#" className="footer-link">{l}</a>
            ))}
          </div>
          <div>
            <div className="footer-col-title">Support</div>
            {['Documentation','API Docs','Help Center','Status','Community','Training'].map(l => (
              <a key={l} href="#" className="footer-link">{l}</a>
            ))}
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 FinTrack. All rights reserved.</span>
          <div className="footer-bottom-links">
            <a href="#" className="footer-link" style={{ marginBottom: 0 }}>Privacy Policy</a>
            <a href="#" className="footer-link" style={{ marginBottom: 0 }}>Terms of Service</a>
            <a href="#" className="footer-link" style={{ marginBottom: 0 }}>Cookie Policy</a>
          </div>
        </div>
      </footer>
    </>
  );
}