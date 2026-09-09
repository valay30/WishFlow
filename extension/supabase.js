// ── WishFlow Minimal Supabase Client ───────────────────────────────────────────
// Uses raw fetch() against the Supabase REST API — no npm package needed.

const SUPABASE_URL = 'https://ykzskxdaxpqiwumybqrw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrenNreGRheHBxaXd1bXlicXJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NTU5ODUsImV4cCI6MjA4NzIzMTk4NX0.pAJyTl6AxdcI6nbrS2Fv8gq9miIE6rqNZnNpvfqZRjk';

// ── Helpers ─────────────────────────────────────────────────────────────────────

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`,
  };
}

async function supabaseFetch(path, { method = 'GET', token, body, params } = {}) {
  let url = `${SUPABASE_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    url += (url.includes('?') ? '&' : '?') + qs;
  }
  const res = await fetch(url, {
    method,
    headers: {
      ...authHeaders(token),
      'Prefer': method === 'POST' ? 'return=representation' : undefined,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || err.error_description || res.statusText);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ── Auth ────────────────────────────────────────────────────────────────────────

/**
 * Sign in with email + password.
 * Returns { access_token, refresh_token, user } or throws.
 */
export async function signIn(email, password) {
  const data = await supabaseFetch('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email, password },
  });
  return data;
}

/**
 * Sign up with name, email and password.
 * Returns { needsVerification: true } if email confirmation is required,
 * or { session, user } if auto-confirmed (e.g. disabled email confirm in Supabase).
 */
export async function signUp(name, email, password) {
  const data = await supabaseFetch('/auth/v1/signup', {
    method: 'POST',
    body: {
      email,
      password,
      data: { name },               // stored in user_metadata.name
    },
  });

  // Supabase returns user with identities=[] when email confirmation is needed
  const needsVerification = !data?.access_token;

  // If auto-confirmed, seed default categories immediately
  if (data?.access_token && data?.user?.id) {
    const defaultCategories = [
      { user_id: data.user.id, name: 'Gadgets' },
      { user_id: data.user.id, name: 'Clothes' },
      { user_id: data.user.id, name: 'Footwear' },
      { user_id: data.user.id, name: 'Accessories' },
      { user_id: data.user.id, name: 'Perfume' },
      { user_id: data.user.id, name: 'Other' },
    ];
    await supabaseFetch('/rest/v1/categories', {
      method: 'POST',
      token: data.access_token,
      body: defaultCategories,
    }).catch(() => {}); // non-fatal
  }

  return { ...data, needsVerification };
}

/**
 * Refresh an expired access token using the refresh_token.
 */
export async function refreshSession(refreshToken) {
  const data = await supabaseFetch('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    body: { refresh_token: refreshToken },
  });
  return data;
}

/**
 * Get the current user from a valid access token.
 */
export async function getUser(token) {
  return supabaseFetch('/auth/v1/user', { token });
}

// ── Database ────────────────────────────────────────────────────────────────────

/**
 * Fetch all categories for the current user.
 */
export async function getCategories(token, userId) {
  return supabaseFetch(`/rest/v1/categories?select=id,name&user_id=eq.${userId}&order=id.asc`, { token });
}

/**
 * Fetch all collections for the current user.
 */
export async function getCollections(token, userId) {
  return supabaseFetch(`/rest/v1/collections?select=id,name,emoji&user_id=eq.${userId}&order=id.asc`, { token });
}

/**
 * Insert a new item into the items table.
 * Returns the inserted row.
 */
export async function addItem(token, { user_id, name, price, image, link, category_id }) {
  const rows = await supabaseFetch('/rest/v1/items', {
    method: 'POST',
    token,
    body: { user_id, name, price, image, link, category_id },
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

/**
 * Assign an item to a collection via the collection_items junction table.
 */
export async function addCollectionItem(token, { user_id, collection_id, item_id }) {
  await supabaseFetch('/rest/v1/collection_items', {
    method: 'POST',
    token,
    body: { user_id, collection_id, item_id },
  });
}
