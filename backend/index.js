// backend/index.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Sicherheits-Middleware
app.use(helmet());

// CORS-Konfiguration
app.use(cors());

// Logging
app.use(morgan('combined'));

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API-Routen
app.use('/api', routes);

// Fehlerbehandlung Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

export default app;
