import express from 'express';
import { exportPdf } from '../controllers/export.controller.js';

const router = express.Router();

router.post('/pdf', exportPdf);

export default router;
