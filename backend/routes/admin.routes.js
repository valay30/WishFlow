import express from 'express';
import { adminGuard } from '../middleware/adminGuard.js';
import { getAllUsers, grantPremium, revokePremium, deleteUser, getActivityFeed, getAllItems, getAllBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost, toggleBlogPublish, runPriceDropNow, runTargetedPriceDrop, getPriceDropStatusLive, toggleGlobalFeature, updateGlobalSetting, broadcastNotification, getBroadcastHistory, deleteBroadcastHistory, updateItemDetails } from '../controllers/admin.controller.js';

const router = express.Router();

// Apply admin token check to all routes in this file
router.use(adminGuard);

router.get('/users', getAllUsers);
router.post('/grant-premium', grantPremium);
router.post('/revoke-premium', revokePremium);
router.delete('/users/:userId', deleteUser);
router.get('/activity', getActivityFeed);
// Items
router.get('/items', getAllItems);
router.patch('/items/:id', updateItemDetails);

// Blog CMS
router.get('/blog', getAllBlogPosts);
router.post('/blog', createBlogPost);
router.put('/blog/:id', updateBlogPost);
router.delete('/blog/:id', deleteBlogPost);
router.patch('/blog/:id/publish', toggleBlogPublish);

// Price Drop Alerts
router.post('/price-drop/run', runPriceDropNow);
router.post('/price-drop/run-targeted', runTargetedPriceDrop);
router.get('/price-drop/status-live', getPriceDropStatusLive);
router.patch('/feature/toggle', toggleGlobalFeature);
router.patch('/setting/update', updateGlobalSetting);
router.post('/broadcast-notification', broadcastNotification);
router.get('/broadcast-history', getBroadcastHistory);
router.delete('/broadcast-history', deleteBroadcastHistory);

export default router;
