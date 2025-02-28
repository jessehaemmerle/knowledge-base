// backend/routes/index.js
import { Router } from 'express';
import sampleRouter from './sample.js';

const router = Router();

router.use('/sample', sampleRouter);

export default router;
