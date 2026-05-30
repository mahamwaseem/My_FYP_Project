import React from 'react';
import './Header.css';

export default function Header({ title, subtitle, onMenuClick, children }) {
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
      <div className="header-right">{children}</div>
    </header>
  );
}
