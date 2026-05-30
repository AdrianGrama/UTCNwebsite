const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const gradesRoutes = require('./routes/grades.routes');
const announcementsRoutes = require('./routes/announcements.routes');

const app = express();
const PORT = process.env.PORT || 5001;

// Configurare CORS restrictiv pentru securitate
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://utc-nwebsite.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permite cereri fără origine (cum ar fi instrumente de testare, Postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'Politica CORS blochează accesul de la originea specificată.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// Înregistrare rute API
app.use('/api/auth', authRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/api/announcements', announcementsRoutes);

// Rută de bază (Health check / test)
app.get('/', (req, res) => {
  res.json({ message: 'Serverul UTCN Portal funcționează.' });
});

// Pornim ascultarea pe port doar dacă nu suntem în mediu de testare
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[SERVER] Serverul rulează la adresa: http://localhost:${PORT}`);
  });
}

module.exports = app;
