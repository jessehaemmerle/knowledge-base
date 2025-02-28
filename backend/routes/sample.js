// backend/routes/sample.js
import { Router } from 'express';

const router = Router();

// Beispielroute
router.get('/', async (req, res, next) => {
  try {
    // Hier könnte eine asynchrone Operation stattfinden
    res.json({ message: 'Beispielroute funktioniert!' });
  } catch (error) {
    next(error);
  }
});

export default router;
