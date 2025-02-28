const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();
const SECRET_KEY = 'dein_geheimes_schluessel';

let users = [
  { id: 1, username: 'admin', password: 'admin', role: 'admin' },
  { id: 2, username: 'editor', password: 'editor', role: 'editor' },
  { id: 3, username: 'viewer', password: 'viewer', role: 'viewer' }
];

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Ungültige Anmeldedaten' });
  }
});

// Registrierung
router.post('/register', (req, res) => {
  const { username, password, role } = req.body;
  if (users.find(u => u.username === username)) {
    return res.status(409).json({ message: 'Nutzer existiert bereits' });
  }
  const newUser = {
    id: users.length + 1,
    username,
    password, // In Produktion: Passwörter immer hashen!
    role: role || 'viewer'
  };
  users.push(newUser);
  const token = jwt.sign({ id: newUser.id, role: newUser.role }, SECRET_KEY, { expiresIn: '1h' });
  res.status(201).json({ token });
});

module.exports = router;
