import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Citim username-ul salvat din localStorage la pornire
  useEffect(() => {
    if (user) {
      navigate('/');
    }
    const savedUsername = localStorage.getItem('remembered_username');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(username, password);

      // Salvăm sau ștergem username-ul din local în funcție de bifă
      if (rememberMe) {
        localStorage.setItem('remembered_username', username);
      } else {
        localStorage.removeItem('remembered_username');
      }

      navigate('/');
    } catch (err) {
      setError(err.message || 'Credentiale invalide.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="card login-card">
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Autentificare</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Portalul Studențesc UTCN
        </p>

        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--danger)',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Utilizator / Email</label>
            <input
              type="text"
              id="username"
              className="form-input"
              placeholder="ex: popescu.ion"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Parolă</label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', margin: '1.5rem 0' }}>
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <label className="form-label" htmlFor="rememberMe" style={{ cursor: 'pointer', margin: 0, fontSize: '0.85rem' }}>
              Ține-mă minte pe acest dispozitiv
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Se autentifică...' : 'Conectare'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          <p><strong>Conturi Demo pentru testare:</strong></p>
          <p style={{ marginTop: '0.25rem' }}>👤 <strong>Student:</strong> popescu.ion / student123</p>
          <p>👨‍🏫 <strong>Profesor:</strong> dobra.fecior / prof123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
