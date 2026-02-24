import express from 'express';
import { generateShareKey, getSharedItems } from '../controllers/share.controller.js';

const router = express.Router();

router.post('/generate', generateShareKey);
router.get('/:key', getSharedItems);

export default router;
