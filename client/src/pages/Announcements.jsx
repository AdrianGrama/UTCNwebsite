import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Announcements = () => {
  const { user, token } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(localStorage.getItem('announcement_filter') || 'All');

  // Stări pentru adăugare anunț
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Administrativ');

  const fetchAnnouncements = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('http://localhost:5001/api/announcements', { headers });
      const data = await res.json();
      if (res.ok) {
        setAnnouncements(data);
      } else {
        setError(data.message || 'Eroare la încărcarea anunțurilor.');
      }
    } catch (e) {
      setError('Eroare rețea la încărcarea anunțurilor.');
    }
  };

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      await fetchAnnouncements();
      setLoading(false);
    };
    initPage();
  }, [token]);

  // Salvăm filtrul în localStorage la fiecare modificare
  useEffect(() => {
    localStorage.setItem('announcement_filter', categoryFilter);
  }, [categoryFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      const res = await fetch('http://localhost:5001/api/announcements', {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, content, category })
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        setTitle('');
        setContent('');
        setCategory('Administrativ');
        fetchAnnouncements();
      } else {
        setError(data.message || 'Eroare la salvarea anunțului.');
      }
    } catch (e) {
      setError('Eroare rețea la salvarea anunțului.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Sigur doriți să ștergeți acest anunț?')) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`http://localhost:5001/api/announcements/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        fetchAnnouncements();
      } else {
        const data = await res.json();
        setError(data.message || 'Eroare la ștergerea anunțului.');
      }
    } catch (e) {
      setError('Eroare rețea la ștergerea anunțului.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '5rem', color: 'var(--text-secondary)' }}>
        Se încarcă avizierul...
      </div>
    );
  }

  const categories = ['All', 'Administrativ', 'Examene', 'Burse', 'Altele'];

  const filteredAnnouncements = categoryFilter === 'All'
    ? announcements
    : announcements.filter((a) => a.category === categoryFilter);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Avizier Anunțuri</h1>
          <p className="subtitle">Noutăți, decizii și informări la zi din cadrul facultății</p>
        </div>
        {user.role === 'teacher' && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            📣 Adaugă Anunț
          </button>
        )}
      </div>

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

      {/* Selector Categorie (filtru salvat local) */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`btn ${categoryFilter === cat ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCategoryFilter(cat)}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            {cat === 'All' ? 'Toate' : cat}
          </button>
        ))}
      </div>

      {filteredAnnouncements.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Nu s-a găsit niciun anunț în categoria selectată.
        </div>
      ) : (
        <div className="announcement-list animate-fade">
          {filteredAnnouncements.map((ann) => (
            <div key={ann.id} className="card announcement-item" style={{ position: 'relative' }}>
              <div className="announcement-meta">
                <span className="badge badge-info">{ann.category}</span>
                <span>📅 {new Date(ann.date).toLocaleString('ro-RO')}</span>
              </div>
              <div className="announcement-title">{ann.title}</div>
              <div className="announcement-body">{ann.content}</div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.25rem',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '0.75rem'
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Autor: <strong>{ann.author}</strong>
                </span>

                {user.role === 'teacher' && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ann.id)}>
                    🗑️ Șterge anunț
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Adăugare Anunț */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Publică un Anunț Nou</h2>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>✖</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="title">Titlu Anunț</label>
                <input
                  type="text"
                  id="title"
                  className="form-input"
                  placeholder="ex: Planificare colocviu restanțe"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="category">Categorie</label>
                <select
                  id="category"
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="Administrativ">Administrativ</option>
                  <option value="Examene">Examene</option>
                  <option value="Burse">Burse</option>
                  <option value="Altele">Altele</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="content">Conținut Anunț</label>
                <textarea
                  id="content"
                  className="form-textarea"
                  rows="5"
                  placeholder="Introduceți textul informativ..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Anulează
                </button>
                <button type="submit" className="btn btn-primary">
                  Publică pe avizier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
