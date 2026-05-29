import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => (location.pathname === path ? 'active' : '');

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        🎓 UTCN Portal
      </Link>
      <div className="navbar-links">
        <Link to="/" className={`navbar-link ${isActive('/')}`}>Dashboard</Link>
        <Link to="/grades" className={`navbar-link ${isActive('/grades')}`}>Situație Școlară</Link>
        <Link to="/announcements" className={`navbar-link ${isActive('/announcements')}`}>Anunțuri</Link>
      </div>
      <div className="navbar-actions">
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {user.name} ({user.role === 'teacher' ? 'Profesor' : 'Student'})
        </span>
        <button className="btn-icon" onClick={toggleTheme} title="Schimbă tema">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
          Deconectare
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
