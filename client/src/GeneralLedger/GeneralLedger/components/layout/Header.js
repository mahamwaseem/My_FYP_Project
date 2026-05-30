import React from 'react';
import './Header.css';

// Three readable base sizes. The chosen value is written to the .gl-app root as
// --gl-base; because all module type is in em, one variable scales everything.
const SIZES = [
  { key: 'M', label: 'A',   px: 16, title: 'Standard text size' },
  { key: 'L', label: 'A+',  px: 18, title: 'Large text size' },
  { key: 'XL', label: 'A++', px: 20, title: 'Larger text size' },
];

export default function Header({ title, subtitle, onMenuClick, children, fontSize, onFontSize }) {
  return (
    <header className="top-header">
      <div className="header-left">
        <button className="header-menu-btn" onClick={onMenuClick} aria-label="Toggle menu">
          <span></span><span></span><span></span>
        </button>
        <div className="header-title-group">
          {title && <h1 className="header-title">{title}</h1>}
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="header-right">
        <div className="text-size-control" role="group" aria-label="Text size">
          <span className="text-size-hint" aria-hidden="true">Text</span>
          {SIZES.map((s) => (
            <button
              key={s.key}
              type="button"
              title={s.title}
              aria-pressed={fontSize === s.px}
              className={`text-size-btn${fontSize === s.px ? ' active' : ''}`}
              onClick={() => onFontSize(s.px)}
            >
              {s.label}
            </button>
          ))}
        </div>
        {children}
      </div>
    </header>
  );
}
