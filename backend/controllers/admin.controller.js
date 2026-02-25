import { supabase } from '../config/supabase.js';

export const getAllUsers = async (req, res) => {
    try {
        // Direct REST call to Supabase Admin API — most reliable approach
        const response = await fetch(
            `${process.env.SUPABASE_URL}/auth/v1/admin/users?per_page=1000`,
            {
                headers: {
                    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        const body = await response.json();

        if (!response.ok) {
            throw new Error(body.message || body.error || 'Admin API error');
        }

        const users = body.users || body || [];
        const mapped = users.map(u => ({
            id: u.id,
            email: u.email,
            name: u.user_metadata?.name || '',
            isPremium: u.user_metadata?.is_premium || false,
            isAdmin: u.user_metadata?.is_admin || false,
            createdAt: u.created_at,
        }));
        res.json(mapped);
    } catch (err) {
        console.error('Admin list users error:', err.message);
        res.status(500).json({ error: err?.message || 'Failed to list users' });
    }
};

export const grantPremium = async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    try {
        const { error } = await supabase.auth.admin.updateUserById(userId, {
            user_metadata: { is_premium: true }
        });
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('Grant premium error:', err);
        res.status(500).json({ error: 'Failed to grant premium' });
    }
};

export const revokePremium = async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    try {
        const { error } = await supabase.auth.admin.updateUserById(userId, {
            user_metadata: { is_premium: false }
        });
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error('Revoke premium error:', err);
        res.status(500).json({ error: 'Failed to revoke premium' });
    }
};
