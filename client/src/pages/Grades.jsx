import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const Grades = () => {
  const { user, token } = useAuth();
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);

  // States for search, filter & sort
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [groupFilter, setGroupFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);

  // Form states
  const [selectedStudent, setSelectedStudent] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeVal, setGradeVal] = useState('');
  const [credits, setCredits] = useState('5');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Active view tab for Teacher (grades list vs student summary list)
  const [activeTab, setActiveTab] = useState('list');

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const fetchGrades = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`${API_BASE_URL}/api/grades`, { headers });
      const data = await res.json();
      if (res.ok) {
        setGrades(data);
      } else {
        setError(data.message || 'Eroare la încărcarea notelor.');
      }
    } catch (e) {
      setError('Eroare rețea la încărcarea notelor.');
    }
  };

  const fetchStudents = async (selectedSubject) => {
    if (user.role !== 'teacher') return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const query = selectedSubject ? `?subject=${encodeURIComponent(selectedSubject)}` : '';
      const res = await fetch(`${API_BASE_URL}/api/grades/students${query}`, { headers });
      const data = await res.json();
      if (res.ok) {
        setStudents(data);
        if (data.length > 0) {
          setSelectedStudent(prev => {
            const exists = data.some(s => s.id === prev);
            return exists ? prev : data[0].id;
          });
        } else {
          setSelectedStudent('');
        }
      }
    } catch (e) {
      console.error('Eroare preluare studenți:', e);
    }
  };

  const fetchSubjects = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`${API_BASE_URL}/api/grades/subjects`, { headers });
      const data = await res.json();
      if (res.ok) {
        setSubjects(data);
      }
    } catch (e) {
      console.error('Eroare preluare materii:', e);
    }
  };

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      await Promise.all([fetchGrades(), fetchStudents(), fetchSubjects()]);
      setLoading(false);
    };
    initPage();
  }, [token]);

  const handleOpenAddModal = () => {
    setEditingGrade(null);
    const initialSubject = user.subjects && user.subjects.length > 0 ? user.subjects[0] : '';
    setSubject(initialSubject);
    setGradeVal('');
    setCredits('5');
    setDate(new Date().toISOString().split('T')[0]);
    if (initialSubject) {
      fetchStudents(initialSubject);
    } else {
      fetchStudents();
    }
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (grade) => {
    setEditingGrade(grade);
    setSelectedStudent(grade.studentId);
    setSubject(grade.subject);
    setGradeVal(grade.grade.toString());
    setCredits(grade.credits.toString());
    setDate(grade.date);
    fetchStudents(grade.subject);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      studentId: selectedStudent,
      subject,
      grade: Number(gradeVal),
      credits: Number(credits),
      date
    };

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      let res;
      if (editingGrade) {
        res = await fetch(`${API_BASE_URL}/api/grades/${editingGrade.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE_URL}/api/grades`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchGrades();
        showToast(editingGrade ? 'Nota a fost modificată cu succes!' : 'Nota a fost adăugată cu succes!', 'success');
      } else {
        setError(data.message || 'Eroare la salvarea notei.');
        showToast(data.message || 'Eroare la salvarea notei.', 'danger');
      }
    } catch (e) {
      setError('Eroare rețea la salvarea notei.');
      showToast('Eroare rețea la salvarea notei.', 'danger');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Sigur doriți să ștergeți această notă?')) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`${API_BASE_URL}/api/grades/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        fetchGrades();
        showToast('Nota a fost ștearsă cu succes!', 'success');
      } else {
        const data = await res.json();
        setError(data.message || 'Eroare la ștergerea notei.');
        showToast(data.message || 'Eroare la ștergerea notei.', 'danger');
      }
    } catch (e) {
      setError('Eroare rețea la ștergerea notei.');
      showToast('Eroare rețea la ștergerea notei.', 'danger');
    }
  };

  // Filter & Sort Logic
  const filteredGrades = grades
    .filter((g) => {
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = user.role === 'teacher'
        ? (g.subject.toLowerCase().includes(searchLower) || (g.studentName && g.studentName.toLowerCase().includes(searchLower)))
        : g.subject.toLowerCase().includes(searchLower);

      let matchStatus = true;
      if (statusFilter === 'passed') matchStatus = g.grade >= 5;
      if (statusFilter === 'failed') matchStatus = g.grade < 5;

      let matchGroup = true;
      if (user.role === 'teacher' && groupFilter !== 'all') {
        matchGroup = g.studentGroup === groupFilter;
      }

      let matchSubject = true;
      if (user.role === 'teacher' && subjectFilter !== 'all') {
        matchSubject = g.subject === subjectFilter;
      }

      return matchSearch && matchStatus && matchGroup && matchSubject;
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'grade-desc') return b.grade - a.grade;
      if (sortBy === 'grade-asc') return a.grade - b.grade;
      if (sortBy === 'subject-asc') return a.subject.localeCompare(b.subject);
      if (sortBy === 'credits-desc') return b.credits - a.credits;
      return 0;
    });

  // Extract unique groups and subjects for filters (Teacher only)
  const uniqueGroups = user.role === 'teacher' ? [...new Set(grades.map(g => g.studentGroup).filter(Boolean))] : [];
  const uniqueSubjects = user.role === 'teacher' ? [...new Set(grades.map(g => g.subject))] : [];

  // Calculations for Student
  const totalCredits = grades.reduce((acc, curr) => acc + curr.credits, 0);
  const passedCredits = grades.filter(g => g.grade >= 5).reduce((acc, curr) => acc + curr.credits, 0);
  const weightedSum = grades.reduce((acc, curr) => acc + (curr.grade * curr.credits), 0);
  const average = totalCredits > 0 ? (weightedSum / totalCredits).toFixed(2) : 0;
  const passedExams = grades.filter(g => g.grade >= 5).length;
  const failedExams = grades.filter(g => g.grade < 5).length;

  const getRepeatDangerStatus = () => {
    if (user.role !== 'student') return null;
    const totalPassedCredits = grades.filter(g => g.grade >= 5).reduce((acc, curr) => acc + curr.credits, 0);
    const studentYear = user.year || 1;
    let limit = 60;
    let threshold = 30;
    
    if (studentYear === 1) {
      limit = 60;
      threshold = 30;
    } else if (studentYear === 2) {
      limit = 120;
      threshold = 90;
    } else if (studentYear === 3) {
      limit = 180;
      threshold = 150;
    } else if (studentYear === 4) {
      limit = 240;
      threshold = 240;
    }
    
    const isDanger = totalPassedCredits < threshold;
    const missingCredits = threshold - totalPassedCredits;
    return { isDanger, totalPassedCredits, limit, threshold, missingCredits };
  };

  const getAcademicStatus = () => {
    const status = [];
    const studentYear = user.year || 1;
    for (let yr = 1; yr <= studentYear; yr++) {
      const yearSubjects = subjects.filter(s => s.year === yr);
      const yearGrades = grades.filter(g => {
        const subInfo = subjects.find(sub => sub.name === g.subject);
        return subInfo && subInfo.year === yr;
      });
      const sem1Grades = yearGrades.filter(g => {
        const subInfo = subjects.find(sub => sub.name === g.subject);
        return subInfo && subInfo.semester === 1;
      });
      const sem1TotalCredits = sem1Grades.reduce((acc, curr) => acc + curr.credits, 0);
      const sem1PassedCredits = sem1Grades.filter(g => g.grade >= 5).reduce((acc, curr) => acc + curr.credits, 0);
      const sem1WeightedSum = sem1Grades.reduce((acc, curr) => acc + (curr.grade * curr.credits), 0);
      const sem1Avg = sem1TotalCredits > 0 ? (sem1WeightedSum / sem1TotalCredits).toFixed(2) : '-';

      const sem2Grades = yearGrades.filter(g => {
        const subInfo = subjects.find(sub => sub.name === g.subject);
        return subInfo && subInfo.semester === 2;
      });
      const sem2TotalCredits = sem2Grades.reduce((acc, curr) => acc + curr.credits, 0);
      const sem2PassedCredits = sem2Grades.filter(g => g.grade >= 5).reduce((acc, curr) => acc + curr.credits, 0);
      const sem2WeightedSum = sem2Grades.reduce((acc, curr) => acc + (curr.grade * curr.credits), 0);
      const sem2Avg = sem2TotalCredits > 0 ? (sem2WeightedSum / sem2TotalCredits).toFixed(2) : '-';

      const yearTotalCredits = yearGrades.reduce((acc, curr) => acc + curr.credits, 0);
      const yearPassedCredits = yearGrades.filter(g => g.grade >= 5).reduce((acc, curr) => acc + curr.credits, 0);
      const yearWeightedSum = yearGrades.reduce((acc, curr) => acc + (curr.grade * curr.credits), 0);
      const yearAvg = yearTotalCredits > 0 ? (yearWeightedSum / yearTotalCredits).toFixed(2) : '-';

      status.push({
        year: yr,
        sem1: { avg: sem1Avg, passedCredits: sem1PassedCredits },
        sem2: { avg: sem2Avg, passedCredits: sem2PassedCredits },
        yearTotal: { avg: yearAvg, passedCredits: yearPassedCredits }
      });
    }
    return status;
  };

  // Grade distribution (1-10) for Chart
  const getGradeDistribution = () => {
    const counts = Array(10).fill(0);
    // Use filtered or all grades? Let's use all grades for the overall statistics
    grades.forEach((g) => {
      const gVal = Math.round(g.grade);
      if (gVal >= 1 && gVal <= 10) {
        counts[gVal - 1]++;
      }
    });
    return counts;
  };
  
  const gradeDistribution = getGradeDistribution();
  const maxGradeCount = Math.max(...gradeDistribution, 1);

  // Calculations for Teacher
  const teacherStats = () => {
    if (grades.length === 0) return { avg: 0, total: 0, passed: 0, passRate: 0, max: 0, min: 0 };
    const sum = grades.reduce((acc, curr) => acc + curr.grade, 0);
    const avg = (sum / grades.length).toFixed(2);
    const passed = grades.filter(g => g.grade >= 5).length;
    const passRate = ((passed / grades.length) * 100).toFixed(0);
    const gradeValues = grades.map(g => g.grade);
    const max = Math.max(...gradeValues);
    const min = Math.min(...gradeValues);
    return { avg, total: grades.length, passed, passRate, max, min };
  };

  const tStats = teacherStats();

  // Compute student summary with GPA and ECTS for Teacher Catalog
  const studentSummaries = students.map(s => {
    const sGrades = grades.filter(g => g.studentId === s.id);
    const sTotalCredits = sGrades.reduce((acc, curr) => acc + curr.credits, 0);
    const sPassedCredits = sGrades.filter(g => g.grade >= 5).reduce((acc, curr) => acc + curr.credits, 0);
    const sWeightedSum = sGrades.reduce((acc, curr) => acc + (curr.grade * curr.credits), 0);
    const sAvg = sTotalCredits > 0 ? (sWeightedSum / sTotalCredits).toFixed(2) : '-';
    return {
      ...s,
      gpa: sAvg,
      passedCredits: sPassedCredits,
      examsCount: sGrades.length
    };
  });

  return (
    <div>
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type === 'danger' ? 'toast-danger' : toast.type === 'warning' ? 'toast-warning' : ''}`}>
            <span>{toast.type === 'danger' ? '⚠️' : '✅'} {toast.message}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>{user.role === 'student' ? 'Situație Școlară' : 'Catalog Studenți'}</h1>
          <p className="subtitle">
            {user.role === 'student'
              ? `Media ta generală: ${average} | Credite ECTS promovate: ${passedCredits} / ${(user.year || 1) * 60} ECTS`
              : 'Gestionează situația școlară a studenților UTCN'}
          </p>
        </div>
        {user.role === 'teacher' && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('list')}>
              📋 Listă Note
            </button>
            <button className={`btn ${activeTab === 'summary' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('summary')}>
              📊 Situație Generală
            </button>
            <button className="btn btn-primary" onClick={handleOpenAddModal} style={{ background: 'var(--success)', border: 'none' }}>
              ➕ Adaugă Notă
            </button>
          </div>
        )}
      </div>

      {/* Alertă Pericol Repetare An */}
      {user.role === 'student' && getRepeatDangerStatus()?.isDanger && (
        <div className="danger-alert-banner animate-fade" style={{
          padding: '1.25rem',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.15) 100%)',
          borderLeft: '5px solid var(--danger)',
          borderRadius: '12px',
          color: 'var(--text-primary)',
          marginBottom: '2rem',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px 0 rgba(239, 68, 68, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontSize: '1.2rem' }}>
            ⚠️ Pericol de Repetare a Anului!
          </h3>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>
            Momentan ai acumulat doar <strong style={{ color: 'var(--danger)', fontSize: '1.05rem' }}>{getRepeatDangerStatus().totalPassedCredits} credite ECTS</strong> promovate. 
            Pragul minim necesar pentru a promova în anul următor (sau pentru a absolvi în anul 4) este de <strong>{getRepeatDangerStatus().threshold} credite</strong>.
            Îți mai sunt necesare încă <strong style={{ color: 'var(--danger)' }}>{getRepeatDangerStatus().missingCredits} credite</strong>.
          </p>
        </div>
      )}

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

      {/* Analytics Dashboard section */}
      {user.role === 'student' ? (
        <div className="stats-grid animate-fade">
          <div className="card stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="stat-value">{average}</div>
            <div className="stat-label">Media Ponderată</div>
          </div>
          <div className="card stat-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem' }}>
            <div>
              <div className="stat-value" style={{ fontSize: '1.75rem' }}>{passedCredits} / {(user.year || 1) * 60}</div>
              <div className="stat-label">Credite ECTS Acumulate</div>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${Math.min((passedCredits / ((user.year || 1) * 60)) * 100, 100)}%` }}></div>
            </div>
          </div>
          <div className="card stat-card" style={{ display: 'flex', gap: '1rem', justifyContent: 'space-around', alignItems: 'center' }}>
            <div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{passedExams}</div>
              <div className="stat-label">Promovate</div>
            </div>
            <div style={{ width: '1px', height: '40px', backgroundColor: 'var(--border-color)' }}></div>
            <div>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>{failedExams}</div>
              <div className="stat-label">Restanțe</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="stats-grid animate-fade">
          <div className="card stat-card">
            <div className="stat-value">{tStats.avg}</div>
            <div className="stat-label">Media Catalogului</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{tStats.passRate}%</div>
            <div className="stat-label">Rata de Promovabilitate</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{tStats.total}</div>
            <div className="stat-label">Total Note Acordate</div>
          </div>
          <div className="card stat-card" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <div>
              <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--success)' }}>{tStats.max}</div>
              <div className="stat-label">Nota Max</div>
            </div>
            <div style={{ width: '1px', height: '30px', backgroundColor: 'var(--border-color)' }}></div>
            <div>
              <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--danger)' }}>{tStats.min}</div>
              <div className="stat-label">Nota Min</div>
            </div>
          </div>
        </div>
      )}

      {/* Situație academică detaliată */}
      {user.role === 'student' && (
        <div className="card animate-fade" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🎓 Situație Academică Detaliată (pe Semestre și Ani)
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {getAcademicStatus().map((status) => (
              <div key={status.year} className="card" style={{ 
                padding: '1.25rem', 
                backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                margin: 0
              }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--primary)' }}>
                  Anul {status.year} de Studiu
                </h4>
                
                {/* Semestrul 1 */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <strong>Semestrul 1</strong>
                    <span>Medie: <strong style={{ color: status.sem1.avg === '-' ? 'var(--text-secondary)' : 'var(--success)' }}>{status.sem1.avg}</strong></span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    <span className="text-secondary">Credite ECTS:</span>
                    <span>{status.sem1.passedCredits} / 30 ECTS</span>
                  </div>
                  <div className="progress-bar-container" style={{ height: '6px' }}>
                    <div className="progress-bar-fill" style={{ 
                      width: `${Math.min((status.sem1.passedCredits / 30) * 100, 100)}%`,
                      backgroundColor: status.sem1.passedCredits >= 30 ? 'var(--success)' : 'var(--primary)'
                    }}></div>
                  </div>
                </div>

                {/* Semestrul 2 */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <strong>Semestrul 2</strong>
                    <span>Medie: <strong style={{ color: status.sem2.avg === '-' ? 'var(--text-secondary)' : 'var(--success)' }}>{status.sem2.avg}</strong></span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    <span className="text-secondary">Credite ECTS:</span>
                    <span>{status.sem2.passedCredits} / 30 ECTS</span>
                  </div>
                  <div className="progress-bar-container" style={{ height: '6px' }}>
                    <div className="progress-bar-fill" style={{ 
                      width: `${Math.min((status.sem2.passedCredits / 30) * 100, 100)}%`,
                      backgroundColor: status.sem2.passedCredits >= 30 ? 'var(--success)' : 'var(--primary)'
                    }}></div>
                  </div>
                </div>

                <div style={{ margin: '1rem 0', height: '1px', backgroundColor: 'var(--border-color)' }}></div>

                {/* Total An */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    <strong>Total Anul {status.year}</strong>
                    <span>Medie An: <strong style={{ color: status.yearTotal.avg === '-' ? 'var(--text-secondary)' : 'var(--success)', fontSize: '0.95rem' }}>{status.yearTotal.avg}</strong></span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    <span className="text-secondary">Credite Totale:</span>
                    <span style={{ fontWeight: 'bold' }}>{status.yearTotal.passedCredits} / 60 ECTS</span>
                  </div>
                  <div className="progress-bar-container" style={{ height: '8px' }}>
                    <div className="progress-bar-fill" style={{ 
                      width: `${Math.min((status.yearTotal.passedCredits / 60) * 100, 100)}%`,
                      backgroundColor: status.yearTotal.passedCredits >= 60 ? 'var(--success)' : status.yearTotal.passedCredits >= 30 ? 'var(--primary)' : 'var(--danger)'
                    }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grade Distribution Chart (CSS-based SVG style) */}
      <div className="card chart-card animate-fade" style={{ marginBottom: '2rem' }}>
        <h3>Distribuția Notelor în Catalog</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Frecvența notelor înregistrate (de la 1 la 10)</p>
        <div className="chart-bars-container">
          {gradeDistribution.map((count, index) => {
            const grade = index + 1;
            const percentHeight = (count / maxGradeCount) * 100;
            const isPassing = grade >= 5;
            return (
              <div key={grade} className="chart-bar-col">
                <div className="chart-bar-wrapper">
                  <div 
                    className="chart-bar-fill" 
                    style={{ 
                      height: `${percentHeight}%`,
                      backgroundColor: isPassing ? 'rgba(16, 185, 129, 0.65)' : 'rgba(239, 68, 68, 0.65)'
                    }}
                  >
                    <span className="chart-bar-tooltip">{count} {count === 1 ? 'notă' : 'note'}</span>
                  </div>
                </div>
                <div className="chart-x-axis-label">{grade}</div>
              </div>
            );
          })}
        </div>
      </div>

      {activeTab === 'list' ? (
        <>
          {/* Search, filters, sorting wrapper */}
          <div className="filters-wrapper animate-fade">
            <div className="filters-row">
              <div className="filter-item">
                <label className="form-label" htmlFor="search">Căutare după materie {user.role === 'teacher' && '/ student'}</label>
                <input 
                  type="text" 
                  id="search" 
                  className="form-input" 
                  placeholder="Introdu denumirea..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="filter-item">
                <label className="form-label" htmlFor="statusFilter">Status Nota</label>
                <select 
                  id="statusFilter" 
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Toate</option>
                  <option value="passed">Promovate (&gt;= 5)</option>
                  <option value="failed">Nepromovate (&lt; 5)</option>
                </select>
              </div>

              {user.role === 'teacher' && uniqueGroups.length > 0 && (
                <div className="filter-item">
                  <label className="form-label" htmlFor="groupFilter">Grupa</label>
                  <select 
                    id="groupFilter" 
                    className="form-select"
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                  >
                    <option value="all">Toate grupele</option>
                    {uniqueGroups.map(grp => (
                      <option key={grp} value={grp}>{grp}</option>
                    ))}
                  </select>
                </div>
              )}

              {user.role === 'teacher' && uniqueSubjects.length > 0 && (
                <div className="filter-item">
                  <label className="form-label" htmlFor="subjectFilter">Disciplină</label>
                  <select 
                    id="subjectFilter" 
                    className="form-select"
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                  >
                    <option value="all">Toate disciplinele</option>
                    {uniqueSubjects.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="filter-item">
                <label className="form-label" htmlFor="sortBy">Ordonează după</label>
                <select 
                  id="sortBy" 
                  className="form-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date-desc">Data (Cele mai noi)</option>
                  <option value="date-asc">Data (Cele mai vechi)</option>
                  <option value="grade-desc">Notă descrescător</option>
                  <option value="grade-asc">Notă crescător</option>
                  <option value="subject-asc">Materie (A-Z)</option>
                  <option value="credits-desc">Credite descrescător</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grades Table */}
          {filteredGrades.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              Nu s-au găsit înregistrări care să corespundă criteriilor de căutare.
            </div>
          ) : (
            <div className="table-container animate-fade">
              <table className="table">
                <thead>
                  <tr>
                    {user.role === 'teacher' && (
                      <>
                        <th>Student</th>
                        <th>Grupa</th>
                      </>
                    )}
                    <th>Materie</th>
                    <th>Notă</th>
                    <th>Credite ECTS</th>
                    <th>Data examinării</th>
                    {user.role === 'teacher' && <th>Acțiuni</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredGrades.map((g) => (
                    <tr key={g.id}>
                      {user.role === 'teacher' && (
                        <>
                          <td style={{ fontWeight: '600' }}>{g.studentName}</td>
                          <td>{g.studentGroup}</td>
                        </>
                      )}
                      <td>{g.subject}</td>
                      <td>
                        <span className={`badge ${g.grade >= 5 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                          {g.grade}
                        </span>
                      </td>
                      <td>{g.credits} ECTS</td>
                      <td>{new Date(g.date).toLocaleDateString('ro-RO')}</td>
                      {user.role === 'teacher' && (
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEditModal(g)}>
                              ✏️ Editează
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g.id)}>
                              🗑️ Șterge
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        /* Teacher Only: Overall Student GPA and Credits summary tab */
        <div className="table-container animate-fade">
          <table className="table">
            <thead>
              <tr>
                <th>Nume Student</th>
                <th>Grupă</th>
                <th>Specializare</th>
                <th>Examene Susținute</th>
                <th>Media Ponderată</th>
                <th>Credite ECTS Promovate</th>
              </tr>
            </thead>
            <tbody>
              {studentSummaries.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: '600' }}>{s.name}</td>
                  <td>{s.group}</td>
                  <td>{s.specialization}</td>
                  <td>{s.examsCount}</td>
                  <td>
                    <span style={{ fontWeight: 'bold', color: s.gpa === '-' ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                      {s.gpa}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontWeight: 'bold' }}>{s.passedCredits} / {(s.year || 1) * 60}</span>
                      <div className="progress-bar-container" style={{ width: '60px', height: '6px', margin: 0 }}>
                        <div className="progress-bar-fill" style={{ width: `${Math.min((s.passedCredits / ((s.year || 1) * 60)) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingGrade ? 'Modifică Notă' : 'Înregistrează Notă'}</h2>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>✖</button>
            </div>

            <form onSubmit={handleSubmit}>
              {!editingGrade && (
                <div className="form-group">
                  <label className="form-label" htmlFor="student">Selectează Student</label>
                  <select
                    id="student"
                    className="form-select"
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    required
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (grupa {s.group})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editingGrade && (
                <div className="form-group">
                  <label className="form-label">Student</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingGrade.studentName}
                    disabled
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="subject">Disciplină / Materie</label>
                {user.subjects && user.subjects.length > 0 ? (
                  <select
                    id="subject"
                    className="form-select"
                    value={subject}
                    onChange={(e) => {
                      const newSub = e.target.value;
                      setSubject(newSub);
                      fetchStudents(newSub);
                    }}
                    required
                  >
                    {user.subjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    id="subject"
                    className="form-input"
                    placeholder="ex: Tehnologii Distribuite"
                    value={subject}
                    onChange={(e) => {
                      const newSub = e.target.value;
                      setSubject(newSub);
                      fetchStudents(newSub);
                    }}
                    required
                    maxLength="100"
                  />
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="gradeVal">Notă (1-10)</label>
                  <input
                    type="number"
                    id="gradeVal"
                    className="form-input"
                    placeholder="10"
                    min="1"
                    max="10"
                    value={gradeVal}
                    onChange={(e) => setGradeVal(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="credits">Puncte Credit</label>
                  <select
                    id="credits"
                    className="form-select"
                    value={credits}
                    onChange={(e) => setCredits(e.target.value)}
                    required
                  >
                    <option value="1">1 ECTS</option>
                    <option value="2">2 ECTS</option>
                    <option value="3">3 ECTS</option>
                    <option value="4">4 ECTS</option>
                    <option value="5">5 ECTS</option>
                    <option value="6">6 ECTS</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="date">Data acordării</label>
                <input
                  type="date"
                  id="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Anulează
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvează modificările
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Grades;
