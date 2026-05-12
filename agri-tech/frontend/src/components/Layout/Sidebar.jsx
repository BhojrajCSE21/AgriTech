import React from 'react';
import { NavLink } from 'react-router-dom';

function Sidebar() {
  return (
    <div className="sidebar">
      <NavLink to="/" className="sidebar-link">
        <span>🌾</span> Dashboard
      </NavLink>
      <NavLink to="/map" className="sidebar-link">
        <span>🗺️</span> Field Map
      </NavLink>
      <NavLink to="/ai" className="sidebar-link">
        <span>🤖</span> AI Center
      </NavLink>
    </div>
  );
}

export default Sidebar;