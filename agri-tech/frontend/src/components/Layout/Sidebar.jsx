import React from 'react';
import { NavLink } from 'react-router-dom';

function Sidebar() {
  return (
    <div className="sidebar">
      <NavLink to="/" className="sidebar-link">
        <span>🌾</span> Dashboard
      </NavLink>
      <NavLink to="/fields" className="sidebar-link">
        <span>📍</span> Fields
      </NavLink>
      <NavLink to="/sensors" className="sidebar-link">
        <span>📡</span> Sensors
      </NavLink>
      <NavLink to="/weather" className="sidebar-link">
        <span>🌤️</span> Weather
      </NavLink>
      <NavLink to="/map" className="sidebar-link">
        <span>🗺️</span> Field Map
      </NavLink>
      <NavLink to="/ai" className="sidebar-link">
        <span>🤖</span> AI Analysis
      </NavLink>
      <NavLink to="/settings" className="sidebar-link">
        <span>⚙️</span> Settings
      </NavLink>
    </div>
  );
}

export default Sidebar;