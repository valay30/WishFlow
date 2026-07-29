import express from 'express';
import { adminGuard } from '../middleware/adminGuard.js';
import { getAllUsers, grantPremium, revokePremium, deleteUser } from '../controllers/admin.controller.js';

const router = express.Router();

// Apply admin token check to all routes in this file
router.use(adminGuard);

router.get('/users', getAllUsers);
router.post('/grant-premium', grantPremium);
router.post('/revoke-premium', revokePremium);
router.delete('/users/:userId', deleteUser);

export default router;
