import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';


const Dashboard = () => {
  const { user, token, theme } = useAuth();
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };

        // Preluăm notele
        const gradesRes = await fetch(`${API_BASE_URL}/api/grades`, { headers });
        const gradesData = await gradesRes.json();

        // Preluăm materiile
        const subjectsRes = await fetch(`${API_BASE_URL}/api/grades/subjects`, { headers });
        const subjectsData = await subjectsRes.json();

        // Preluăm anunțurile
        const annRes = await fetch(`${API_BASE_URL}/api/announcements`, { headers });
        const annData = await annRes.json();

        if (gradesRes.ok) setGrades(gradesData);
        if (subjectsRes.ok) setSubjects(subjectsData);
        if (annRes.ok) setAnnouncements(annData);
      } catch (error) {
        console.error('Eroare preluare date dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '5rem', color: 'var(--text-secondary)' }}>
        Se încarcă datele...
      </div>
    );
  }

  // Calculare statistici student
  const calculateStudentStats = () => {
    if (grades.length === 0) return { avg: 0, credits: 0, count: 0, sem2Credits: 0 };
    const totalCredits = grades.reduce((acc, curr) => acc + curr.credits, 0);
    const weightedSum = grades.reduce((acc, curr) => acc + (curr.grade * curr.credits), 0);
    const avg = totalCredits > 0 ? (weightedSum / totalCredits).toFixed(2) : 0;

    // Calculăm creditele promovate în Semestrul 2 al anului curent de studiu
    const studentYear = user.year || 1;
    const sem2Grades = grades.filter(g => {
      const subInfo = subjects.find(s => s.name === g.subject);
      return subInfo && subInfo.year === studentYear && subInfo.semester === 2;
    });
    const sem2Credits = sem2Grades.filter(g => g.grade >= 5).reduce((acc, curr) => acc + curr.credits, 0);

    return { avg, credits: totalCredits, count: grades.length, sem2Credits };
  };

  // Calculare statistici profesor
  const calculateTeacherStats = () => {
    if (grades.length === 0) return { totalGrades: 0, avgGrade: 0 };
    const sum = grades.reduce((acc, curr) => acc + curr.grade, 0);
    const avgGrade = (sum / grades.length).toFixed(2);
    return { totalGrades: grades.length, avgGrade };
  };

  const studentStats = user.role === 'student' ? calculateStudentStats() : null;
  const teacherStats = user.role === 'teacher' ? calculateTeacherStats() : null;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Bun venit, {user.name}!</h1>
        <p className="subtitle">
          {user.role === 'student'
            ? `Student la specializarea ${user.specialization || '-'}, Grupa ${user.group}`
            : `Cadru didactic la departamentul ${user.department || '-'}`}
        </p>
      </div>

      {/* Grid Statistici */}
      <div className="stats-grid">
        {user.role === 'student' ? (
          <>
            <div className="card stat-card">
              <div className="stat-value">{studentStats.avg}</div>
              <div className="stat-label">Media Ponderată</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{studentStats.sem2Credits} / 30</div>
              <div className="stat-label">Credite ECTS Semestriale</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{studentStats.count}</div>
              <div className="stat-label">Examene Promovate</div>
            </div>
          </>
        ) : (
          <>
            <div className="card stat-card">
              <div className="stat-value">{teacherStats.totalGrades}</div>
              <div className="stat-label">Note Înregistrate</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{teacherStats.avgGrade}</div>
              <div className="stat-label">Media Generală Note</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">100%</div>
              <div className="stat-label">Sincronizare locală JSON</div>
            </div>
          </>
        )}
      </div>

      <div className="dashboard-grid">
        {/* Coloana Stângă: Anunțuri recente */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Noutăți și Anunțuri</h2>
            <Link to="/announcements" style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '500' }}>
              Vezi toate
            </Link>
          </div>

          <div className="announcement-list">
            {announcements.slice(0, 3).map((ann) => (
              <div key={ann.id} className="card announcement-item">
                <div className="announcement-meta">
                  <span className="badge badge-info">{ann.category}</span>
                  <span>📅 {new Date(ann.date).toLocaleDateString('ro-RO')}</span>
                </div>
                <div className="announcement-title">{ann.title}</div>
                <div className="announcement-body">{ann.content}</div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                  Autor: <em>{ann.author}</em>
                </div>
              </div>
            ))}
            {announcements.length === 0 && (
              <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                Nu există anunțuri postate recent.
              </div>
            )}
          </div>
        </div>

        {/* Coloana Dreaptă: Profil / Comenzi rapide */}
        <div>
          <h2>Profilul Meu</h2>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', overflow: 'hidden' }}>
            <img 
              src={theme === 'dark' 
                ? 'https://res.cloudinary.com/donhemyhq/image/upload/v1780085546/logo4_xvuart.png' 
                : 'https://res.cloudinary.com/donhemyhq/image/upload/v1780085249/utcnlogo_lmiu8r.png'
              } 
              alt="UTCN Seal" 
              style={{ 
                position: 'absolute', 
                right: '-10px', 
                top: '-10px', 
                height: '80px', 
                opacity: 0.15,
                pointerEvents: 'none'
              }} 
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', zIndex: 1 }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'var(--accent-gradient)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: '700'
              }}>
                {user.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{user.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Rol: {user.role === 'teacher' ? 'Cadru Didactic' : 'Student'}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>📧 <strong>Email:</strong> {user.email}</div>
              {user.role === 'student' && (
                <>
                  <div>🏫 <strong>Grupa:</strong> {user.group}</div>
                  <div>📚 <strong>Specializare:</strong> {user.specialization}</div>
                </>
              )}
            </div>

            <Link to="/grades" className="btn btn-secondary" style={{ textDecoration: 'none', justifyContent: 'center', marginTop: '0.5rem' }}>
              {user.role === 'student' ? '📈 Vezi Situația Școlară' : '⚙️ Administrează Notele'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
