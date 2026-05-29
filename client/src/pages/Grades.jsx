import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Grades = () => {
  const { user, token } = useAuth();
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Stări pentru modulul modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);

  // Stări pentru câmpurile formularului
  const [selectedStudent, setSelectedStudent] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeVal, setGradeVal] = useState('');
  const [credits, setCredits] = useState('5');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchGrades = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('http://localhost:5001/api/grades', { headers });
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

  const fetchStudents = async () => {
    if (user.role !== 'teacher') return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('http://localhost:5001/api/grades/students', { headers });
      const data = await res.json();
      if (res.ok) {
        setStudents(data);
        if (data.length > 0) setSelectedStudent(data[0].id);
      }
    } catch (e) {
      console.error('Eroare preluare studenți:', e);
    }
  };

  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      await Promise.all([fetchGrades(), fetchStudents()]);
      setLoading(false);
    };
    initPage();
  }, [token]);

  const handleOpenAddModal = () => {
    setEditingGrade(null);
    setSubject('');
    setGradeVal('');
    setCredits('5');
    setDate(new Date().toISOString().split('T')[0]);
    if (students.length > 0) setSelectedStudent(students[0].id);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (grade) => {
    setEditingGrade(grade);
    setSelectedStudent(grade.studentId);
    setSubject(grade.subject);
    setGradeVal(grade.grade.toString());
    setCredits(grade.credits.toString());
    setDate(grade.date);
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
        res = await fetch(`http://localhost:5001/api/grades/${editingGrade.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('http://localhost:5001/api/grades', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchGrades();
      } else {
        setError(data.message || 'Eroare la salvarea notei.');
      }
    } catch (e) {
      setError('Eroare rețea la salvarea notei.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Sigur doriți să ștergeți această notă?')) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`http://localhost:5001/api/grades/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        fetchGrades();
      } else {
        const data = await res.json();
        setError(data.message || 'Eroare la ștergerea notei.');
      }
    } catch (e) {
      setError('Eroare rețea la ștergerea notei.');
    }
  };

  // Calcul medii doar pentru studenți sau la nivel agregat
  const totalCredits = grades.reduce((acc, curr) => acc + curr.credits, 0);
  const weightedSum = grades.reduce((acc, curr) => acc + (curr.grade * curr.credits), 0);
  const average = totalCredits > 0 ? (weightedSum / totalCredits).toFixed(2) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>{user.role === 'student' ? 'Situație Școlară' : 'Administrare Catalog'}</h1>
          <p className="subtitle">
            {user.role === 'student'
              ? `Media ponderată: ${average} | Total credite acumulate: ${totalCredits} ECTS`
              : 'Vizualizați, adăugați sau modificați notele acordate studenților'}
          </p>
        </div>
        {user.role === 'teacher' && (
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            ➕ Adaugă Notă
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

      {grades.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Nu există note înregistrate în acest moment.
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
              {grades.map((g) => (
                <tr key={g.id}>
                  {user.role === 'teacher' && (
                    <>
                      <td style={{ fontWeight: '600' }}>{g.studentName}</td>
                      <td>{g.studentGroup}</td>
                    </>
                  )}
                  <td>{g.subject}</td>
                  <td>
                    <span className={`badge ${g.grade >= 5 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.9rem' }}>
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

      {/* Modal Adăugare / Editare Notă */}
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
                <input
                  type="text"
                  id="subject"
                  className="form-input"
                  placeholder="ex: Tehnologii Distribuite"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
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
