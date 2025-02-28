const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();
const SECRET_KEY = 'dein_geheimes_schluessel';

// Dummy-Datenbank (später durch ein echtes DB-Modell ersetzen)
let pages = [
  { id: 1, title: 'Startseite', content: 'Willkommen in der Knowledge Base', tags: ['allgemein'], parentId: null, versions: [] }
];

// Middleware zum Überprüfen des Tokens und der Rechte
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: 'Token fehlt' });
  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Ungültiges Token' });
  }
}

// Alle Seiten abrufen
router.get('/', (req, res) => {
  res.json(pages);
});

// Eine Seite abrufen
router.get('/:id', (req, res) => {
  const page = pages.find(p => p.id == req.params.id);
  if (page) {
    res.json(page);
  } else {
    res.status(404).json({ message: 'Seite nicht gefunden' });
  }
});

// Neue Seite erstellen (nur Admin/Editor)
router.post('/', authenticate, (req, res) => {
  if (!['admin', 'editor'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Keine Berechtigung' });
  }
  const newPage = {
    id: pages.length + 1,
    title: req.body.title,
    content: req.body.content,
    tags: req.body.tags || [],
    parentId: req.body.parentId || null,
    versions: [] // Versionshistorie
  };
  pages.push(newPage);
  res.status(201).json(newPage);
});

// Seite aktualisieren mit Versionierung
router.put('/:id', authenticate, (req, res) => {
  if (!['admin', 'editor'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Keine Berechtigung' });
  }
  const pageIndex = pages.findIndex(p => p.id == req.params.id);
  if (pageIndex > -1) {
    // Alte Version speichern
    const oldVersion = {
      title: pages[pageIndex].title,
      content: pages[pageIndex].content,
      tags: pages[pageIndex].tags,
      updatedAt: new Date()
    };
    pages[pageIndex].versions.push(oldVersion);
    // Aktualisieren
    pages[pageIndex] = { ...pages[pageIndex], ...req.body };
    res.json(pages[pageIndex]);
  } else {
    res.status(404).json({ message: 'Seite nicht gefunden' });
  }
});

module.exports = router;
