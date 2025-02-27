const express = require('express');

const router = express.Router();

// Dummy-Tagliste (in der Praxis dynamisch anhand von Seiteninhalten)
const tags = ['allgemein', 'tech', 'support', 'intern'];

router.get('/', (req, res) => {
  res.json(tags);
});

module.exports = router;
