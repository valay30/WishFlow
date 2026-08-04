import { createClient } from '@supabase/supabase-js';

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
        return {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name,
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

// ─── Database helpers ─────────────────────────────────────────────────────────
export const db = {
  categories: {
    getAll: async () => {
      const id = await getUserId();
      if (!id) return [];

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
        link: item.link,
        image: item.image,
      };

      const { data, error } = await supabase.from('items').insert([newItem]).select();
      if (error) throw error;

      if (data?.[0]) {
        if (__itemCache) {
          __itemCache = [...__itemCache, data[0]];
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
      const id = await getUserId();
      if (!id) return;

      // Delete from collection_items first to prevent foreign key constraint errors
      await supabase.from('collection_items').delete().eq('item_id', itemId);

      const { error } = await supabase.from('items').delete().eq('id', itemId).eq('user_id', id);
      if (error) throw error;
      if (__itemCache) {
        __itemCache = __itemCache.filter(i => i.id !== itemId);
      }
    },

    getById: async (itemId) => {
      const id = await getUserId();
      if (!id || !itemId) return null;

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemId)
        .eq('user_id', id)
        .single();

      if (error) throw error;
      return data;
    },
  },
};
