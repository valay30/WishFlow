import { createClient } from '@supabase/supabase-js';

// Get these from your Supabase Dashboard -> Project Settings -> API
// And put them inside your .env file at the root of the project:
// VITE_SUPABASE_URL=your-supabase-url
// VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const auth = {
  // Returns user if active session
  getCurrentUser: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      return {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name
      };
    }
    return null;
  },

  signup: async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      // Seed default categories for this user 
      // (This requires the 'categories' table to be set up)
      const defaultCategories = [
        { user_id: data.user.id, name: 'Electronics' },
        { user_id: data.user.id, name: 'Clothes' },
        { user_id: data.user.id, name: 'Books' },
        { user_id: data.user.id, name: 'Gadgets' },
      ];
      await supabase.from('categories').insert(defaultCategories);

      const user = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name
      };
      return { success: true, user };
    }
    return { success: true, user: null };
  },

  login: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const user = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name
    };
    return { success: true, user };
  },

  logout: async () => {
    await supabase.auth.signOut();
  },
};

const getUserId = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id;
};

// Global in-memory cache to make page transitions instant
let __categoryCache = null;
let __itemCache = null;
let __fetchingCategories = null;
let __fetchingItems = null;

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
    add: async (item) => {
      const id = await getUserId();
      if (!id) return;

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
      if (data?.[0] && __itemCache) {
        __itemCache = [data[0], ...__itemCache];
      }
      return data?.[0];
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
    }
  },
};
