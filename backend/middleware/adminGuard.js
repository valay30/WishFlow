import { supabase } from '../config/supabase.js';

export const adminGuard = async (req, res, next) => {
    if (req.method === 'OPTIONS') return next();

    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    try {
        // Verify the JWT and get the user — this runs entirely on the server
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        // Check the is_admin flag set in Supabase user metadata
        const isAdmin = user.app_metadata?.is_admin === true
            || user.user_metadata?.is_admin === true;

        if (!isAdmin) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        // Attach user to request for downstream use if needed
        req.adminUser = user;
        next();
    } catch (err) {
        console.error('[adminGuard] error:', err.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
