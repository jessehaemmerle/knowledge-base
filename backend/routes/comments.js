const express = require('express');
const router = express.Router();

// Dummy-Datenbank für Kommentare
// Struktur: { id, pageId, author, content, timestamp }
let comments = [];

// Alle Kommentare für eine bestimmte Seite abrufen
router.get('/page/:pageId', (req, res) => {
  const pageComments = comments.filter(c => c.pageId == req.params.pageId);
  res.json(pageComments);
});

// Neuen Kommentar hinzufügen (nur angemeldete Nutzer)
router.post('/', (req, res) => {
  const { pageId, author, content } = req.body;
  if (!pageId || !author || !content) {
    return res.status(400).json({ message: 'Fehlende Felder' });
  }
  const newComment = {
    id: comments.length + 1,
    pageId,
    author,
    content,
    timestamp: new Date()
  };
  comments.push(newComment);
  res.status(201).json(newComment);
});

module.exports = router;
