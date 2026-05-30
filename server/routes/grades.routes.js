const express = require('express');
const router = express.Router();
const gradesController = require('../controllers/grades.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

router.get('/', authenticateToken, gradesController.getGrades);
router.get('/students', authenticateToken, requireRole('teacher'), gradesController.getStudentsList);
router.get('/subjects', authenticateToken, gradesController.getSubjectsList);
router.post('/', authenticateToken, requireRole('teacher'), gradesController.addGrade);
router.put('/:id', authenticateToken, requireRole('teacher'), gradesController.updateGrade);
router.delete('/:id', authenticateToken, requireRole('teacher'), gradesController.deleteGrade);

module.exports = router;
