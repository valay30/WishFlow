import express from 'express';
import { extractMetadata } from '../controllers/scraper.controller.js';

const router = express.Router();

// POST /api/scraper/extract
// Body: { url: string, categories: [{ id, name }] }
router.post('/extract', extractMetadata);

export default router;
