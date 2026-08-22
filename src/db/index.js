import { createClient } from '@supabase/supabase-js';
import { addToSyncQueue } from './syncQueue'; 
import { API_URL } from '../config';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── In-memory cache (must be declared before auth uses clearDbCache) ───────
let __categoryCache = null;
let __itemCache = null;
let __collectionCache = null;
let __collectionItemsCache = null;
let __fetchingCategories = null;
let __fetchingItems = null;
let __fetchingCollections = null;
let __fetchingCollectionItems = null;

// Clears cache so the next getAll() does a fresh Supabase fetch.
// Must be called on logout / user-switch so the new user doesn't see stale data.
export const clearDbCache = () => {
  __categoryCache = null;
  __itemCache = null;
  __collectionCache = null;
  __collectionItemsCache = null;
  __fetchingCategories = null;
  __fetchingItems = null;
  __fetchingCollections = null;
  __fetchingCollectionItems = null;
};

// ─── Auth helpers ─────────────────────────────────────────────────────────────
export const auth = {
  signInWithGoogle: async () => {
    clearDbCache();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  getCurrentUser: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Supabase getSession error:", error);
        return null;
      }
      const session = data?.session;
      if (session) {
        // Fetch username from profiles
        let username = null;
        try {
          const { data: profile } = await supabase.from('profiles').select('username').eq('id', session.user.id).single();
          if (profile) username = profile.username;
        } catch (err) {
          console.error("Error fetching username:", err);
        }

        return {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name,
          username,
          isPremium: session.user.user_metadata?.is_premium || false,
          isAdmin: session.user.user_metadata?.is_admin || false,
        };
      }
    } catch (error) {
      console.error("Unexpected error getting session:", error);
    }
    return null;
  },

  signup: async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) return { success: false, error: error.message };

    if (data.user) {
      const defaultCategories = [
        { user_id: data.user.id, name: 'Gadgets' },
        { user_id: data.user.id, name: 'Clothes' },
        { user_id: data.user.id, name: 'Footwear' },
        { user_id: data.user.id, name: 'Accessories' },
        { user_id: data.user.id, name: 'Perfume' },
        { user_id: data.user.id, name: 'Other' },
      ];
      await supabase.from('categories').insert(defaultCategories);

      const user = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name,
        isPremium: data.user.user_metadata?.is_premium || false,
        isAdmin: data.user.user_metadata?.is_admin || false,
      };
      return { success: true, user };
    }
    return { success: true, user: null };
  },

  login: async ({ email, password }) => {
    clearDbCache(); // ensure previous user's cache is wiped
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return { success: false, error: error.message };

    const user = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name,
      isPremium: data.user.user_metadata?.is_premium || false,
      isAdmin: data.user.user_metadata?.is_admin || false,
    };
    return { success: true, user };
  },

  logout: async () => {
    clearDbCache(); // ✅ now safe — clearDbCache is declared above
    await supabase.auth.signOut();
  },

  resetPassword: async (email) => {
    const redirectTo = `${window.location.origin}/auth`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },
};

// ─── Internal helper ──────────────────────────────────────────────────────────
const getUserId = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id;
};

const normalizeUrl = (url) => {
  if (!url) return url;
  url = url.trim();
  if (url.length === 0) return url;
  if (!/^https?:\/\//i.test(url)) {
    return 'https://' + url;
  }
  return url;
};

// ─── Database helpers ─────────────────────────────────────────────────────────
export const db = {
  categories: {
    getAll: async () => {
      const id = await getUserId();
      if (!id) return [];

      if (__categoryCache !== null) return __categoryCache;

      if (!__fetchingCategories) {
        __fetchingCategories = supabase
          .from('categories')
          .select('*')
          .eq('user_id', id)
          .order('id', { ascending: true })
          .then(({ data, error }) => {
            __fetchingCategories = null;
            if (!error) __categoryCache = data || [];
            return __categoryCache;
          });
      }

      return __categoryCache !== null ? __categoryCache : __fetchingCategories;
    },

    add: async (name) => {
      const id = await getUserId();
      if (!id) return;

      const { data, error } = await supabase
        .from('categories')
        .insert([{ user_id: id, name }])
        .select();

      if (error) throw error;
      if (data?.[0] && __categoryCache) {
        __categoryCache = [...__categoryCache, data[0]];
      }
      return data?.[0];
    },

    delete: async (catId) => {
      const id = await getUserId();
      if (!id) return;
      const { error } = await supabase.from('categories').delete().eq('id', catId).eq('user_id', id);
      if (error) throw error;
      if (__categoryCache) {
        __categoryCache = __categoryCache.filter(c => c.id !== catId);
      }
    },

    update: async (catId, name) => {
      const id = await getUserId();
      if (!id) return;
      const { error } = await supabase.from('categories').update({ name }).eq('id', catId).eq('user_id', id);
      if (error) throw error;
      if (__categoryCache) {
        __categoryCache = __categoryCache.map(c => c.id === catId ? { ...c, name } : c);
      }
    },
  },

  collections: {
    getAll: async () => {
      const id = await getUserId();
      if (!id) return [];

      if (__collectionCache !== null) return __collectionCache;

      if (!__fetchingCollections) {
        __fetchingCollections = supabase
          .from('collections')
          .select('*')
          .eq('user_id', id)
          .order('created_at', { ascending: true })
          .then(({ data, error }) => {
            __fetchingCollections = null;
            if (error) {
              console.error("Collections error (SQL missing?):", error);
              return [];
            }
            __collectionCache = data || [];
            return __collectionCache;
          });
      }
      return __collectionCache !== null ? __collectionCache : __fetchingCollections;
    },

    add: async ({ name, emoji = '🎁', target_date = null }) => {
      const id = await getUserId();
      if (!id) return;
      const { data, error } = await supabase
        .from('collections')
        .insert([{ user_id: id, name, emoji, target_date }])
        .select();
      if (error) throw error;
      if (data?.[0] && __collectionCache) {
        __collectionCache = [...__collectionCache, data[0]];
      }
      return data?.[0];
    },

    update: async (colId, updates) => {
      const id = await getUserId();
      if (!id) return;
      const { error } = await supabase
        .from('collections')
        .update(updates)
        .eq('id', colId)
        .eq('user_id', id);
      if (error) throw error;
      if (__collectionCache) {
        __collectionCache = __collectionCache.map(c => c.id === colId ? { ...c, ...updates } : c);
      }
    },

    delete: async (colId) => {
      const id = await getUserId();
      if (!id) return;
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', colId)
        .eq('user_id', id);
      if (error) throw error;
      if (__collectionCache) {
        __collectionCache = __collectionCache.filter(c => c.id !== colId);
      }
      if (__collectionItemsCache) {
        __collectionItemsCache = __collectionItemsCache.filter(ci => ci.collection_id !== colId);
      }
    },
  },

  collectionItems: {
    getAll: async () => {
      const id = await getUserId();
      if (!id) return [];

      if (__collectionItemsCache !== null) return __collectionItemsCache;

      if (!__fetchingCollectionItems) {
        __fetchingCollectionItems = supabase
          .from('collection_items')
          .select('*')
          .eq('user_id', id)
          .then(({ data, error }) => {
            __fetchingCollectionItems = null;
            if (error) {
              console.error("Collection_items error (SQL missing?):", error);
              return [];
            }
            __collectionItemsCache = data || [];
            return __collectionItemsCache;
          });
      }
      return __collectionItemsCache !== null ? __collectionItemsCache : __fetchingCollectionItems;
    },

    add: async (collection_id, item_id) => {
      const id = await getUserId();
      if (!id) return;
      const { data, error } = await supabase
        .from('collection_items')
        .insert([{ user_id: id, collection_id, item_id }])
        .select();
      if (error) throw error;
      if (data?.[0] && __collectionItemsCache) {
        __collectionItemsCache = [...__collectionItemsCache, data[0]];
      }
    },

    remove: async (collection_id, item_id) => {
      const id = await getUserId();
      if (!id) return;
      const { error } = await supabase
        .from('collection_items')
        .delete()
        .match({ user_id: id, collection_id, item_id });
      if (error) throw error;
      if (__collectionItemsCache) {
        __collectionItemsCache = __collectionItemsCache.filter(
          ci => !(ci.collection_id === collection_id && ci.item_id === item_id)
        );
      }
    }
  },

  items: {
    getAll: async () => {
      const id = await getUserId();
      if (!id) return [];

      if (__itemCache !== null) return __itemCache;

      if (!__fetchingItems) {
        __fetchingItems = supabase
          .from('items')
          .select('*')
          .eq('user_id', id)
          .order('created_at', { ascending: false })
          .then(({ data, error }) => {
            __fetchingItems = null;
            if (!error) __itemCache = data || [];
            return __itemCache;
          });
      }

      return __itemCache !== null ? __itemCache : __fetchingItems;
    },

    add: async (item, targetCollectionId = null) => {
      const id = await getUserId();
      if (!id) return;
      const finalCollectionId = targetCollectionId || item.collection_id;
      const newItem = {
        user_id: id,
        category_id: item.category_id,
        name: item.name,
        price: item.price,
        link: normalizeUrl(item.link),
        image: item.image,
      };

      if (!navigator.onLine) {
        // Offline: Add to Dexie sync queue and optimistic cache
        const tempItem = {
          ...newItem,
          id: 'temp_' + Date.now(),
          created_at: new Date().toISOString()
        };
        await addToSyncQueue('ADD_ITEM', { item: newItem, targetCollectionId: finalCollectionId });

        if (__itemCache) {
          __itemCache = [tempItem, ...__itemCache];
        }

        if (finalCollectionId) {
          try {
            await db.collectionItems.add(finalCollectionId, tempItem.id);
          } catch (e) {
            console.error("Failed optimistic collection assign:", e);
          }
        }
        return tempItem;
      }

      const { data, error } = await supabase.from('items').insert([newItem]).select();
      if (error) throw error;

      if (data?.[0]) {
        if (__itemCache) {
          __itemCache = [data[0], ...__itemCache];
        }

        // If a target collection is provided, insert into junction table
        if (finalCollectionId) {
          try {
            await db.collectionItems.add(finalCollectionId, data[0].id);
          } catch (e) {
            console.error("Failed to assign item to collection", e);
          }
        }

        return data[0];
      }
    },

    update: async (itemId, updates) => {
      const id = await getUserId();
      if (!id) return null;

      if (updates.link !== undefined) {
        updates.link = normalizeUrl(updates.link);
      }

      const { data, error } = await supabase
        .from('items')
        .update(updates)
        .eq('id', itemId)
        .eq('user_id', id)
        .select();

      if (error) throw error;
      if (data?.[0] && __itemCache) {
        __itemCache = __itemCache.map(i => i.id === itemId ? data[0] : i);
      }
      return data?.[0];
    },

    delete: async (itemId) => {
      // Optimistically remove from cache so UI updates immediately
      if (__itemCache) {
        __itemCache = __itemCache.filter(i => i.id !== itemId);
      }

      const id = await getUserId();
      if (!id) return;

      try {
        // Delete from collection_items first to prevent foreign key constraint errors
        await supabase.from('collection_items').delete().eq('item_id', itemId);

        const { error } = await supabase.from('items').delete().eq('id', itemId).eq('user_id', id);
        if (error) throw error;
      } catch (err) {
        // Rollback cache on error
        __itemCache = null;
        throw err;
      }
    },

    getById: async (itemId) => {
      if (!itemId) return null;

      const normalizedId = String(itemId);
      if (__itemCache) {
        const cached = __itemCache.find(i => String(i.id) === normalizedId);
        if (cached) return cached;
      }

      const id = await getUserId();
      if (!id) return null;

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .eq('user_id', id)
        .single();

      if (error) return null;
      return data;
    },
  },

  shared: {
    getCollection: async (collectionId) => {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('id', collectionId)
        .single();
      if (error) return null;
      return data;
    },
    getCollectionItems: async (collectionId) => {
      const { data: pivot, error: pivotErr } = await supabase
        .from('collection_items')
        .select('item_id')
        .eq('collection_id', collectionId);
      
      if (pivotErr || !pivot || pivot.length === 0) return [];
      
      const itemIds = pivot.map(p => p.item_id);
      const { data: items, error: itemsErr } = await supabase
        .from('items')
        .select('*')
        .in('id', itemIds);
        
      if (itemsErr) return [];
      return items;
    },
    // New direct sharing methods
    sendShareRequest: async (collectionId, username) => {
      // 1. Find user by username
      const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .single();
        
      if (profErr || !profile) return { success: false, error: 'User not found' };
      
      const senderId = await getUserId();
      if (!senderId) return { success: false, error: 'Not authenticated' };
      if (senderId === profile.id) return { success: false, error: 'Cannot share with yourself' };

      // 2. Insert share request
      const { error } = await supabase
        .from('collection_shares')
        .insert({
          collection_id: collectionId,
          sender_id: senderId,
          recipient_id: profile.id,
          status: 'pending'
        });
        
      if (error) {
        if (error.code === '23505') return { success: false, error: 'Already shared with this user' };
        return { success: false, error: error.message };
      }

      // Trigger push notification via backend
      try {
        const { data: senderProfile } = await supabase.from('profiles').select('username').eq('id', senderId).single();
        const { data: collection } = await supabase.from('collections').select('name').eq('id', collectionId).single();
        
        await fetch(`${API_URL}/api/notifications/notify-share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientId: profile.id,
            collectionName: collection?.name || 'a collection',
            senderName: senderProfile?.username || 'Someone'
          })
        });
      } catch (err) {
        console.error("Failed to trigger push notification", err);
      }

      return { success: true };
    },
    getSharedWithMe: async () => {
      const id = await getUserId();
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('collection_shares')
        .select(`
          id,
          status,
          collection_id,
          sender_id
        `)
        .eq('recipient_id', id)
        .neq('status', 'declined');
        
      if (error) {
        console.error("Supabase getSharedWithMe Error:", error);
        return [];
      }

      if (!data || data.length === 0) return [];

      // Fetch profiles and collections manually
      const senderIds = data.map(d => d.sender_id);
      const collectionIds = data.map(d => d.collection_id);
      
      const [ { data: profiles }, { data: collections } ] = await Promise.all([
        supabase.from('profiles').select('id, username').in('id', senderIds),
        supabase.from('collections').select('*').in('id', collectionIds)
      ]);
      
      return data.map(share => ({
        ...share,
        profiles: profiles?.find(p => p.id === share.sender_id) || null,
        collections: collections?.find(c => c.id === share.collection_id) || null
      }));
    },
    updateShareStatus: async (shareId, status) => {
      const { error } = await supabase
        .from('collection_shares')
        .update({ status })
        .eq('id', shareId);
      return !error;
    },
    getCollectionShares: async (collectionId) => {
      const id = await getUserId();
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('collection_shares')
        .select(`
          id,
          status,
          recipient_id,
          created_at
        `)
        .eq('collection_id', collectionId)
        .eq('sender_id', id);
        
      if (error) {
        console.error("Supabase getCollectionShares Error:", error);
        return [];
      }

      // Fetch profiles for recipients
      if (data.length === 0) return [];
      const recipientIds = data.map(d => d.recipient_id);
      const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', recipientIds);
      
      return data.map(share => ({
        ...share,
        profiles: profiles?.find(p => p.id === share.recipient_id) || null
      }));
    },
    removeShare: async (shareId) => {
      const { error } = await supabase
        .from('collection_shares')
        .delete()
        .eq('id', shareId);
      return !error;
    }
  },

  profiles: {
    getProfile: async () => {
      const id = await getUserId();
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error && error.code !== 'PGRST116') return null; // PGRST116 is "No rows found"
      return data;
    },
    updateUsername: async (username) => {
      const id = await getUserId();
      if (!id) return { success: false, error: 'Not authenticated' };
      
      // Upsert profile
      const { error } = await supabase
        .from('profiles')
        .upsert({ id, username: username.toLowerCase(), updated_at: new Date().toISOString() });
        
      if (error) {
        if (error.code === '23505') return { success: false, error: 'Username is already taken' };
        return { success: false, error: error.message };
      }
      return { success: true };
    }
  },

  discover: {
    // Fetch all individually public items for the Discover feed (anonymous)
    getPublicFeed: async () => {
      const { data: publicItems, error } = await supabase
        .from('items')
        .select('id, name, price, image, link, user_id')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        console.error('Discover feed error:', error);
        return [];
      }
      
      const currentUserId = await getUserId();
      
      return (publicItems || []).map(item => {
        const { user_id, ...rest } = item;
        return {
          ...rest,
          is_mine: user_id === currentUserId
        };
      });
    },

    // Toggle is_public on a single item (owner only)
    setPublic: async (itemId, isPublic) => {
      const id = await getUserId();
      if (!id) return { success: false };
      const { error } = await supabase
        .from('items')
        .update({ is_public: isPublic })
        .eq('id', itemId)
        .eq('user_id', id);
      if (error) return { success: false, error: error.message };
      // Update local cache
      if (__itemCache) {
        __itemCache = __itemCache.map(i => i.id === itemId ? { ...i, is_public: isPublic } : i);
      }
      return { success: true };
    },

    // Clone a discovered item directly into the current user's wishlist (no collection)
    saveItem: async (item) => {
      const id = await getUserId();
      if (!id) return { success: false };
      const newItem = {
        user_id: id,
        name: item.name,
        price: item.price,
        image: item.image,
        link: item.link,
      };
      const { data, error } = await supabase.from('items').insert([newItem]).select();
      if (error) return { success: false, error: error.message };
      if (data?.[0] && __itemCache) {
        __itemCache = [data[0], ...__itemCache];
      }
      return { success: true, item: data?.[0] };
    },
  },
};


