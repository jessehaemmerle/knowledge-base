const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const pageRoutes = require('./routes/pages');
const tagRoutes = require('./routes/tags');
const commentRoutes = require('./routes/comments'); // Neu

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Routen für Authentifizierung, Seiten, Tags und Kommentare
app.use('/api/auth', authRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/comments', commentRoutes); // Neu

app.listen(PORT, () => {
  console.log(`Backend läuft auf Port ${PORT}`);
});
