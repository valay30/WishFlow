import './env.js';
import express from 'express';
import cors from 'cors';

// Import Routes
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import scraperRoutes from './routes/scraper.routes.js';
import blogRoutes from './routes/blog.routes.js';
import { initScheduler } from './jobs/cronScheduler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-admin-secret'],
}));
app.use(express.json());

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running!' });
});

// Public settings route
app.get("/api/public/features", async (req, res) => {
    try {
        const { supabase } = await import("./config/supabase.js");
        const { data } = await supabase.from("app_settings").select("key, value").in("key", ["roast_feature_enabled", "refresh_feature_enabled", "roast_enabled_themes", "custom_cursor_enabled"]);
        const features = {};
        if (data) {
            data.forEach(d => { 
                if (d.key === "roast_enabled_themes") {
                    try {
                        features[d.key] = JSON.parse(d.value);
                    } catch (e) {
                        features[d.key] = [];
                    }
                } else {
                    features[d.key] = d.value === "true"; 
                }
            });
        }
        res.json(features);
    } catch (e) {
        res.status(500).json({});
    }
});

// API Routes
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/blog', blogRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  // Start the price drop cron scheduler
  initScheduler().catch(err => console.error('[Scheduler] Failed to init:', err.message));
});

