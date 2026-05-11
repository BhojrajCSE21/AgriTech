import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <h2 style={{ color: '#fff', margin: 0, marginRight: 'auto' }}>🌾 AgriTech</h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          <Link to="/login" style={{ color: '#fff', textDecoration: 'none' }}>Login</Link>
          <Link to="/register" style={{ color: '#fff', textDecoration: 'none' }}>Register</Link>
        </div>
      </div>
    </header>
  );
}

export default Header;