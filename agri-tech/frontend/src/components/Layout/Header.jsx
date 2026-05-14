import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <h1>
          <span className="brand-mark" style={{ fontSize: '1.05em' }}>🌾</span>
          CropPulse
        </h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginLeft: 'auto' }}>
          {token ? (
            <>
              <div className="profile-pill">
                <span className="profile-avatar">
                  {(user.name || user.email || 'U').slice(0, 1).toUpperCase()}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>
                  Welcome, <span style={{ color: 'var(--text-primary)' }}>{user.name || user.email}</span>
                </span>
              </div>
              <button onClick={handleLogout} className="btn-danger-modern">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: '500' }}>Login</Link>
              <Link to="/register" className="btn-modern" style={{ textDecoration: 'none' }}>Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
