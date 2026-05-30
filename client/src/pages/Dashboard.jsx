import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import GradeChart from '../components/GradeChart';

const AcademicCountdown = () => {
  const targetDate = new Date('2026-06-15T08:00:00');
  const now = new Date();
  const diffTime = targetDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, diffDays);

  const totalSemesterDays = 98; // 14 săptămâni
  const progressPercent = Math.min(100, Math.max(0, ((totalSemesterDays - daysLeft) / totalSemesterDays) * 100));

  return (
    <div className="card" style={{ padding: '1.25rem', position: 'relative' }}>
      <h3 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        📅 Numărătoare Inversă Sesiune
      </h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
        <span style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>
          {daysLeft > 0 ? `${daysLeft} zile rămase` : 'Sesiunea a început!'}
        </span>
        <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>15 Iunie 2026</span>
      </div>
      <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ 
          width: `${progressPercent}%`, 
          height: '100%', 
          background: 'var(--accent-gradient)', 
          borderRadius: '4px',
          transition: 'width 1s ease-in-out' 
        }} />
      </div>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.5rem', margin: 0 }}>
        Semestrul II • Săptămâna 12 din 14
      </p>
    </div>
  );
};



const Dashboard = () => {
  const { user, token, theme, isServerWaking } = useAuth();
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

        {/* Coloana Dreaptă: Profil / Comenzi rapide / Grafice */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Widget Countdown */}
          <AcademicCountdown />

          {/* Profil Utilizator */}
          <div>
            <h2 style={{ marginBottom: '1rem' }}>Profilul Meu</h2>
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

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 1 }}>
                <div>📧 <strong>Email:</strong> {user.email}</div>
                {user.role === 'student' && (
                  <>
                    <div>🏫 <strong>Grupa:</strong> {user.group}</div>
                    <div>📚 <strong>Specializare:</strong> {user.specialization}</div>
                  </>
                )}
              </div>

              <Link to="/grades" className="btn btn-secondary" style={{ textDecoration: 'none', justifyContent: 'center', marginTop: '0.5rem', zIndex: 1 }}>
                {user.role === 'student' ? '📈 Vezi Situația Școlară' : '⚙️ Administrează Notele'}
              </Link>
            </div>
          </div>

          {/* Grafic distributie note */}
          <GradeChart grades={grades} />
        </div>
      </div>

      {/* Alerta de Cold Start Render */}
      {isServerWaking && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--warning)',
          color: '#0f172a',
          padding: '0.9rem 1.5rem',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: '700',
          fontSize: '0.9rem',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          backdropFilter: 'blur(8px)',
          animation: 'fadeInUp 0.3s ease-out'
        }}>
          <span>⏳</span>
          <span>Se trezește serverul de pe Render (poate dura până la 50s)...</span>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
