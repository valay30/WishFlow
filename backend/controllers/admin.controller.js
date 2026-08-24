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
        // 1. Fetch user's collections to get their IDs
        const { data: userCollections } = await supabase
            .from('collections')
            .select('id')
            .eq('user_id', userId);
        const colIds = userCollections?.map(c => c.id) || [];

        // 2. Fetch user's items to get their IDs
        const { data: userItems } = await supabase
            .from('items')
            .select('id')
            .eq('user_id', userId);
        const itemIds = userItems?.map(i => i.id) || [];

        // 3. Delete collection_items linked to user's collections or items
        if (colIds.length > 0) {
            await supabase.from('collection_items').delete().in('collection_id', colIds);
        }
        if (itemIds.length > 0) {
            await supabase.from('collection_items').delete().in('item_id', itemIds);
        }

        // 4. Delete collection_shares linked to user or user's collections
        await supabase.from('collection_shares').delete().eq('sender_id', userId);
        await supabase.from('collection_shares').delete().eq('recipient_id', userId);
        if (colIds.length > 0) {
            await supabase.from('collection_shares').delete().in('collection_id', colIds);
        }

        // 5. Delete items
        const { error: itemsErr } = await supabase.from('items').delete().eq('user_id', userId);
        if (itemsErr) console.warn('Warning deleting items for user:', itemsErr);

        // 6. Delete collections
        const { error: colErr } = await supabase.from('collections').delete().eq('user_id', userId);
        if (colErr) console.warn('Warning deleting collections for user:', colErr);

        // 7. Delete categories
        const { error: catErr } = await supabase.from('categories').delete().eq('user_id', userId);
        if (catErr) console.warn('Warning deleting categories for user:', catErr);

        // 8. Delete push subscriptions
        const { error: pushErr } = await supabase.from('push_subscriptions').delete().eq('user_id', userId);
        if (pushErr) console.warn('Warning deleting push subscriptions for user:', pushErr);

        // 9. Delete profile
        const { error: profErr } = await supabase.from('profiles').delete().eq('id', userId);
        if (profErr) console.warn('Warning deleting profile for user:', profErr);

        // 10. Delete from Supabase Auth
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
            .select('id, name, image, user_id, price, created_at, link, is_purchased')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(items || []);
    } catch (err) {
        console.error('Admin list items error:', err.message);
        res.status(500).json({ error: err?.message || 'Failed to list items' });
    }
};
