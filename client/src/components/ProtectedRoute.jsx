import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'Inter, sans-serif',
        color: 'var(--text-secondary)'
      }}>
        Încărcare portal...
      </div>
    );
  }

  if (!user) {
    // Redirecționăm către login dacă utilizatorul nu este autentificat
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirecționăm către dashboard dacă utilizatorul nu are rolul necesar
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
