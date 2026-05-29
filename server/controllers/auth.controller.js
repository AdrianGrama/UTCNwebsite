const { readDB } = require('../utils/db');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth.middleware');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username și parola sunt obligatorii.' });
    }

    const db = await readDB();
    const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Username sau parolă incorectă.' });
    }

    // Generăm token-ul cu rol și date utile
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Înlăturăm parola din răspuns
    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Eroare internă de server.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const db = await readDB();
    const user = db.users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilizatorul nu a fost găsit.' });
    }

    const { password: _, ...userWithoutPassword } = user;
    return res.json(userWithoutPassword);
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({ message: 'Eroare internă de server.' });
  }
};
