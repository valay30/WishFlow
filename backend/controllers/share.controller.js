import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';

export const generateShareKey = async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    const shareKey = uuidv4();

    try {
        const { data, error } = await supabase
            .from('shares')
            .upsert([{ user_id: userId, share_key: shareKey }], { onConflict: 'user_id' })
            .select();

        if (error) throw error;
        res.json({ shareKey });
    } catch (error) {
        console.error('Error generating share key:', error);
        res.status(500).json({ error: 'Failed to generate share key' });
    }
};

export const getSharedItems = async (req, res) => {
    const { key } = req.params;

    try {
        const { data: shareData, error: shareError } = await supabase
            .from('shares')
            .select('user_id')
            .eq('share_key', key)
            .single();

        if (shareError || !shareData) return res.status(404).json({ error: 'Invalid share key' });

        const { data: items, error: itemsError } = await supabase
            .from('items')
            .select('*, categories(name)')
            .eq('user_id', shareData.user_id);

        if (itemsError) throw itemsError;
        res.json(items);
    } catch (error) {
        console.error('Error fetching shared items:', error);
        res.status(500).json({ error: 'Failed to fetch shared items' });
    }
};
