const { readDB, writeDB } = require('../utils/db');

exports.getGrades = async (req, res) => {
  try {
    const db = await readDB();
    if (req.user.role === 'student') {
      const student = db.users.find(u => u.id === req.user.id);
      const studentYear = student ? (student.year || 1) : 1;
      
      const studentGrades = db.grades.filter(g => {
        if (g.studentId !== req.user.id) return false;
        const subInfo = db.subjects?.find(s => s.name === g.subject);
        const subYear = subInfo ? subInfo.year : 1;
        return subYear <= studentYear;
      });
      return res.json(studentGrades);
    } else if (req.user.role === 'teacher') {
      const teacher = db.users.find(u => u.id === req.user.id);
      const teacherSubjects = teacher ? (teacher.subjects || []) : [];
      
      const teacherGrades = db.grades.filter(g => teacherSubjects.includes(g.subject));
      
      const gradesWithStudents = teacherGrades.map(grade => {
        const student = db.users.find(u => u.id === grade.studentId);
        return {
          ...grade,
          studentName: student ? student.name : 'Necunoscut',
          studentGroup: student ? student.group : '-'
        };
      });
      return res.json(gradesWithStudents);
    } else {
      return res.status(403).json({ message: 'Rol invalid.' });
    }
  } catch (error) {
    console.error('getGrades error:', error);
    return res.status(500).json({ message: 'Eroare la citirea notelor.' });
  }
};

exports.addGrade = async (req, res) => {
  try {
    const { studentId, subject, grade, credits, date } = req.body;
    if (!studentId || !subject || grade === undefined || credits === undefined) {
      return res.status(400).json({ message: 'Toate câmpurile sunt obligatorii.' });
    }

    const numGrade = Number(grade);
    if (isNaN(numGrade) || numGrade < 1 || numGrade > 10 || !Number.isInteger(numGrade)) {
      return res.status(400).json({ message: 'Nota trebuie să fie un număr întreg între 1 și 10.' });
    }

    const numCredits = Number(credits);
    if (isNaN(numCredits) || numCredits < 1 || numCredits > 6 || !Number.isInteger(numCredits)) {
      return res.status(400).json({ message: 'Numărul de credite trebuie să fie un număr întreg între 1 și 6.' });
    }

    if (typeof subject !== 'string' || subject.trim().length === 0) {
      return res.status(400).json({ message: 'Numele materiei este obligatoriu.' });
    }

    if (subject.length > 100) {
      return res.status(400).json({ message: 'Numele materiei nu poate depăși 100 de caractere.' });
    }

    let resolvedDate = date || new Date().toISOString().split('T')[0];
    const parsedDate = new Date(resolvedDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Data examinării este invalidă.' });
    }
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Allow today
    if (parsedDate > today) {
      return res.status(400).json({ message: 'Data examinării nu poate fi în viitor.' });
    }

    const db = await readDB();
    const teacher = db.users.find(u => u.id === req.user.id);
    if (!teacher || !teacher.subjects || !teacher.subjects.includes(subject.trim())) {
      return res.status(403).json({ message: 'Nu aveți permisiunea de a adăuga note la această materie.' });
    }

    const student = db.users.find(u => u.id === studentId && u.role === 'student');
    if (!student) {
      return res.status(404).json({ message: 'Studentul specificat nu există.' });
    }

    const subInfo = db.subjects?.find(s => s.name === subject.trim());
    if (subInfo && student.year !== subInfo.year) {
      return res.status(400).json({ message: `Acest student este în anul ${student.year}, dar materia este pentru anul ${subInfo.year}.` });
    }

    const existingGrade = db.grades.find(g => g.studentId === studentId && g.subject === subject.trim());
    if (existingGrade) {
      return res.status(400).json({ message: 'Există deja o notă înregistrată pentru acest student la această materie. Vă rugăm să o editați pe cea existentă.' });
    }

    const newGrade = {
      id: 'g_' + Date.now(),
      studentId,
      subject: subject.trim(),
      grade: numGrade,
      credits: numCredits,
      date: resolvedDate
    };

    db.grades.push(newGrade);
    await writeDB(db);

    return res.status(201).json(newGrade);
  } catch (error) {
    console.error('addGrade error:', error);
    return res.status(500).json({ message: 'Eroare la adăugarea notei.' });
  }
};

exports.updateGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, grade, credits, date } = req.body;

    const db = await readDB();
    const gradeIdx = db.grades.findIndex(g => g.id === id);

    if (gradeIdx === -1) {
      return res.status(404).json({ message: 'Nota nu a fost găsită.' });
    }

    const teacher = db.users.find(u => u.id === req.user.id);
    const existingGrade = db.grades[gradeIdx];
    if (!teacher || !teacher.subjects || !teacher.subjects.includes(existingGrade.subject)) {
      return res.status(403).json({ message: 'Nu aveți permisiunea de a modifica note la această materie.' });
    }

    if (grade !== undefined) {
      const numGrade = Number(grade);
      if (isNaN(numGrade) || numGrade < 1 || numGrade > 10 || !Number.isInteger(numGrade)) {
        return res.status(400).json({ message: 'Nota trebuie să fie un număr întreg între 1 și 10.' });
      }
      db.grades[gradeIdx].grade = numGrade;
    }

    if (credits !== undefined) {
      const numCredits = Number(credits);
      if (isNaN(numCredits) || numCredits < 1 || numCredits > 6 || !Number.isInteger(numCredits)) {
        return res.status(400).json({ message: 'Numărul de credite trebuie să fie un număr întreg între 1 și 6.' });
      }
      db.grades[gradeIdx].credits = numCredits;
    }

    if (subject !== undefined) {
      if (typeof subject !== 'string' || subject.trim().length === 0) {
        return res.status(400).json({ message: 'Numele materiei este obligatoriu.' });
      }
      if (subject.length > 100) {
        return res.status(400).json({ message: 'Numele materiei nu poate depăși 100 de caractere.' });
      }
      if (!teacher.subjects.includes(subject.trim())) {
        return res.status(403).json({ message: 'Nu aveți permisiunea de a schimba materia la una pe care nu o predați.' });
      }
      db.grades[gradeIdx].subject = subject.trim();
    }

    if (date !== undefined && date !== null) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Data examinării este invalidă.' });
      }
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (parsedDate > today) {
        return res.status(400).json({ message: 'Data examinării nu poate fi în viitor.' });
      }
      db.grades[gradeIdx].date = date;
    }

    await writeDB(db);
    return res.json(db.grades[gradeIdx]);
  } catch (error) {
    console.error('updateGrade error:', error);
    return res.status(500).json({ message: 'Eroare la modificarea notei.' });
  }
};

exports.deleteGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDB();

    const gradeIdx = db.grades.findIndex(g => g.id === id);
    if (gradeIdx === -1) {
      return res.status(404).json({ message: 'Nota nu a fost găsită.' });
    }

    const teacher = db.users.find(u => u.id === req.user.id);
    const grade = db.grades[gradeIdx];
    if (!teacher || !teacher.subjects || !teacher.subjects.includes(grade.subject)) {
      return res.status(403).json({ message: 'Nu aveți permisiunea de a șterge note la această materie.' });
    }

    db.grades.splice(gradeIdx, 1);
    await writeDB(db);

    return res.json({ message: 'Nota a fost ștearsă cu succes.' });
  } catch (error) {
    console.error('deleteGrade error:', error);
    return res.status(500).json({ message: 'Eroare la ștergerea notei.' });
  }
};

exports.getStudentsList = async (req, res) => {
  try {
    const { subject } = req.query;
    const db = await readDB();
    
    let targetYear = null;
    if (subject) {
      const subInfo = db.subjects?.find(s => s.name === subject.trim());
      if (subInfo) {
        targetYear = subInfo.year;
      }
    }
    
    let students = db.users.filter(u => u.role === 'student');
    if (targetYear !== null) {
      students = students.filter(s => s.year === targetYear);
    }
    
    const sanitizedStudents = students.map(({ password, ...studentInfo }) => studentInfo);
    return res.json(sanitizedStudents);
  } catch (error) {
    console.error('getStudentsList error:', error);
    return res.status(500).json({ message: 'Eroare la citirea listei de studenți.' });
  }
};

exports.getSubjectsList = async (req, res) => {
  try {
    const db = await readDB();
    const subjects = db.subjects || [];
    return res.json(subjects);
  } catch (error) {
    console.error('getSubjectsList error:', error);
    return res.status(500).json({ message: 'Eroare la citirea listei de materii.' });
  }
};
