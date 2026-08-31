import express from 'express';
import { getPublishedPosts, getPublishedPostBySlug } from '../controllers/blog.controller.js';

const router = express.Router();

// Public — no auth required
router.get('/', getPublishedPosts);
router.get('/:slug', getPublishedPostBySlug);

export default router;
