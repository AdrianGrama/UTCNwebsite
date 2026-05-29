const jwt = require('jsonwebtoken');
const JWT_SECRET = 'utcn-secret-key-12345'; // În producție, folosiți o variabilă de mediu (process.env.JWT_SECRET)

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Autentificare necesară. Token lipsă.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ message: 'Sesiune expirată sau token invalid.' });
    }
    req.user = decodedUser;
    next();
  });
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Neautentificat.' });
    }
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acces neautorizat pentru acest rol.' });
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole, JWT_SECRET };
