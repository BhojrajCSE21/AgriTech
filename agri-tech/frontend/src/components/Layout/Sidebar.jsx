import React from 'react';
import { NavLink } from 'react-router-dom';

const icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z" fill="currentColor" />
    </svg>
  ),
  map: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m9 18-5 2.2V6l5-2.2 6 2.4 5-2.2v14.2l-5 2.2L9 18Zm1-1.7 4 1.6V7.7l-4-1.6v10.2Z" fill="currentColor" />
    </svg>
  ),
  ai: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 3h6v2h3a2 2 0 0 1 2 2v9a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V7a2 2 0 0 1 2-2h3V3Zm-1.5 8.5A1.5 1.5 0 1 0 9 10a1.5 1.5 0 0 0-1.5 1.5Zm7.5 0A1.5 1.5 0 1 0 16.5 10a1.5 1.5 0 0 0-1.5 1.5ZM8 16h8v-2H8v2Z" fill="currentColor" />
    </svg>
  ),
};

function Sidebar() {
  return (
    <div className="sidebar">
      <NavLink to="/" className="sidebar-link">
        <span className="sidebar-icon">{icons.dashboard}</span>
        <span className="nav-label">Dashboard</span>
      </NavLink>
      <NavLink to="/map" className="sidebar-link">
        <span className="sidebar-icon">{icons.map}</span>
        <span className="nav-label">Field Map</span>
      </NavLink>
      <NavLink to="/ai" className="sidebar-link">
        <span className="sidebar-icon">{icons.ai}</span>
        <span className="nav-label">AI Center</span>
      </NavLink>
    </div>
  );
}

export default Sidebar;
