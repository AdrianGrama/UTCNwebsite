const express = require('express');
const router = express.Router();
const announcementsController = require('../controllers/announcements.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

router.get('/', authenticateToken, announcementsController.getAnnouncements);
router.post('/', authenticateToken, requireRole('teacher'), announcementsController.addAnnouncement);
router.delete('/:id', authenticateToken, requireRole('teacher'), announcementsController.deleteAnnouncement);

module.exports = router;
