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
        
        // Fetch item counts for all users
        const { data: itemData, error: itemErr } = await supabase.from('items').select('user_id');
        const userItemCounts = {};
        if (!itemErr && itemData) {
            itemData.forEach(item => {
                if (item.user_id) {
                    userItemCounts[item.user_id] = (userItemCounts[item.user_id] || 0) + 1;
                }
            });
        }

        const mapped = users.map(u => ({
            id: u.id,
            email: u.email,
            name: u.user_metadata?.name || '',
            isPremium: u.user_metadata?.is_premium || false,
            isAdmin: u.user_metadata?.is_admin || false,
            createdAt: u.created_at,
            itemCount: userItemCounts[u.id] || 0
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

export const deleteUser = async (req, res) => {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    try {
        // Delete dependent data (items, categories) to bypass foreign key constraint errors
        const { error: itemsErr } = await supabase.from('items').delete().eq('user_id', userId);
        if (itemsErr) console.warn('Warning deleting items for user:', itemsErr);

        const { error: catErr } = await supabase.from('categories').delete().eq('user_id', userId);
        if (catErr) console.warn('Warning deleting categories for user:', catErr);

        // Delete from Auth
        const { error } = await supabase.auth.admin.deleteUser(userId);
        if (error) throw error;

        res.json({ success: true });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ error: 'Failed to delete user', details: err?.message || JSON.stringify(err) });
    }
};

export const getActivityFeed = async (req, res) => {
    try {
        const { data: recentItems, error: itemsErr } = await supabase
            .from('items')
            .select('id, name, created_at, user_id')
            .order('created_at', { ascending: false })
            .limit(20);

        const { data: recentCollections, error: colErr } = await supabase
            .from('collections')
            .select('id, name, created_at, user_id')
            .order('created_at', { ascending: false })
            .limit(20);

        if (itemsErr) console.warn("Items fetch err", itemsErr);
        if (colErr) console.warn("Collections fetch err", colErr);

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
        const users = body.users || body || [];
        const userMap = {};
        users.forEach(u => {
            userMap[u.id] = u.user_metadata?.name || u.email?.split('@')[0] || 'A user';
        });

        const activity = [];
        if (recentItems) {
            recentItems.forEach(item => {
                activity.push({
                    id: `item_${item.id}`,
                    type: 'item',
                    message: `${userMap[item.user_id] || 'Someone'} added item: ${item.name}`,
                    createdAt: item.created_at
                });
            });
        }
        if (recentCollections) {
            recentCollections.forEach(col => {
                activity.push({
                    id: `col_${col.id}`,
                    type: 'collection',
                    message: `${userMap[col.user_id] || 'Someone'} created collection: ${col.name}`,
                    createdAt: col.created_at
                });
            });
        }

        activity.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(activity.slice(0, 30));
    } catch (err) {
        console.error('Activity feed error:', err);
        res.status(500).json({ error: 'Failed to fetch activity feed' });
    }
};

export const getAllItems = async (req, res) => {
    try {
        const { data: items, error } = await supabase
            .from('items')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(items || []);
    } catch (err) {
        console.error('Admin list items error:', err.message);
        res.status(500).json({ error: err?.message || 'Failed to list items' });
    }
};
