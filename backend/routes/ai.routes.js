import express from 'express';
import { generateRoast } from '../controllers/ai.controller.js';

const router = express.Router();

// POST /api/ai/roast
// Body: { items: [{ name, price }], currency: string }
router.post('/roast', generateRoast);

export default router;
