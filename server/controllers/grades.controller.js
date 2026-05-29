const { readDB, writeDB } = require('../utils/db');

exports.getGrades = async (req, res) => {
  try {
    const db = await readDB();
    if (req.user.role === 'student') {
      const studentGrades = db.grades.filter(g => g.studentId === req.user.id);
      return res.json(studentGrades);
    } else if (req.user.role === 'teacher') {
      const gradesWithStudents = db.grades.map(grade => {
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
    if (!studentId || !subject || !grade || !credits) {
      return res.status(400).json({ message: 'Toate câmpurile sunt obligatorii.' });
    }

    const db = await readDB();
    const student = db.users.find(u => u.id === studentId && u.role === 'student');
    if (!student) {
      return res.status(404).json({ message: 'Studentul specificat nu există.' });
    }

    const newGrade = {
      id: 'g_' + Date.now(),
      studentId,
      subject,
      grade: Number(grade),
      credits: Number(credits),
      date: date || new Date().toISOString().split('T')[0]
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

    if (subject) db.grades[gradeIdx].subject = subject;
    if (grade !== undefined) db.grades[gradeIdx].grade = Number(grade);
    if (credits !== undefined) db.grades[gradeIdx].credits = Number(credits);
    if (date) db.grades[gradeIdx].date = date;

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
    const db = await readDB();
    const students = db.users
      .filter(u => u.role === 'student')
      .map(({ password, ...studentInfo }) => studentInfo);
    return res.json(students);
  } catch (error) {
    console.error('getStudentsList error:', error);
    return res.status(500).json({ message: 'Eroare la citirea listei de studenți.' });
  }
};
