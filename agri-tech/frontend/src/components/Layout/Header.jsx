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
        <h2 style={{ color: '#fff', margin: 0, marginRight: 'auto' }}>🌾 CropPulse</h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {token ? (
            <>
              <span style={{ color: '#fff' }}>Welcome, {user.name || user.email}</span>
              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: '1px solid #fff',
                  color: '#fff',
                  padding: '5px 15px',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: '#fff', textDecoration: 'none' }}>Login</Link>
              <Link to="/register" style={{ color: '#fff', textDecoration: 'none' }}>Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;