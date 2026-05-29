const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const gradesRoutes = require('./routes/grades.routes');
const announcementsRoutes = require('./routes/announcements.routes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware-uri globale
app.use(cors());
app.use(express.json());

// Înregistrare rute API
app.use('/api/auth', authRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/api/announcements', announcementsRoutes);

// Rută de bază (Health check / test)
app.get('/', (req, res) => {
  res.json({ message: 'Serverul UTCN Portal funcționează.' });
});

// Pornire server
app.listen(PORT, () => {
  console.log(`[SERVER] Serverul rulează la adresa: http://localhost:${PORT}`);
});
