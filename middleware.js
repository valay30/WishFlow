/**
 * middleware.js — Vercel Edge Middleware for Open Graph social preview injection
 *
 * Runs at the CDN edge BEFORE serving any page.
 * For social media bots visiting /shared/collection/:id, /shared/item/:id, or /blog/:slug,
 * it fetches metadata from Supabase and injects Open Graph <meta> tags into the HTML.
 *
 * For real users — passes through instantly with zero overhead.
 */

import { next } from '@vercel/edge';

// ─── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL      = process.env.VITE_SUPABASE_URL     || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SITE_URL          = 'https://wishflow.shop';
const DEFAULT_IMAGE     = `${SITE_URL}/512x512.png`;
const DEFAULT_TITLE     = 'WishFlow — Track & Share Your Wishlists';
const DEFAULT_DESC      = 'Save products, organize wishlists, and share with friends. Never forget what you want.';

// ─── Social bot User-Agent patterns ──────────────────────────────────────────
const BOT_PATTERNS = [
  'whatsapp', 'facebookexternalhit', 'facebot',
  'twitterbot', 'telegrambot', 'slackbot',
  'discordbot', 'linkedinbot', 'pinterestbot',
  'applebot', 'google', 'bingbot', 'curl',
];

function isSocialBot(userAgent = '') {
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some(p => ua.includes(p));
}

// ─── Supabase REST helper (no SDK needed in Edge runtime) ─────────────────────
async function supabaseGet(table, column, value, select = '*') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${encodeURIComponent(value)}&select=${encodeURIComponent(select)}&limit=1`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Accept': 'application/json',
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) ? data[0] ?? null : null;
}

// ─── Build OG tag block ───────────────────────────────────────────────────────
function buildOgTags({ title, description, image, url }) {
  const safeTitle = (title || DEFAULT_TITLE).replace(/"/g, '&quot;');
  const safeDesc  = (description || DEFAULT_DESC).replace(/"/g, '&quot;');
  let safeImage = image || DEFAULT_IMAGE;
  const safeUrl   = url || SITE_URL;

  // Optimize ImageKit URLs for exact 1200x630 Open Graph dimensions
  if (safeImage.includes('ik.imagekit.io')) {
    const sep = safeImage.includes('?') ? '&' : '?';
    safeImage = `${safeImage}${sep}tr=w-1200,h-630,fo-auto,c-at_max`;
  }

  return `
    <!-- Open Graph (injected by WishFlow Edge Middleware) -->
    <meta property="og:type"         content="website" />
    <meta property="og:site_name"    content="WishFlow" />
    <meta property="og:url"          content="${safeUrl}" />
    <meta property="og:title"        content="${safeTitle}" />
    <meta property="og:description"  content="${safeDesc}" />
    <meta property="og:image"        content="${safeImage}" />
    <meta property="og:image:width"  content="1200" />
    <meta property="og:image:height" content="630" />
    <!-- Twitter Card -->
    <meta name="twitter:card"        content="summary_large_image" />
    <meta name="twitter:title"       content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    <meta name="twitter:image"       content="${safeImage}" />
    <!-- General -->
    <meta name="description"         content="${safeDesc}" />
    <title>${safeTitle}</title>`;
}

// ─── Per-route metadata fetchers ──────────────────────────────────────────────
async function getCollectionMeta(id, requestUrl) {
  const collection = await supabaseGet('collections', 'id', id, 'id,name,description,cover_image');
  if (!collection) return null;

  const title       = `${collection.name} — WishFlow`;
  const description = collection.description
    ? `${collection.description} · Shared wishlist on WishFlow`
    : `Check out this wishlist on WishFlow`;
  const image = collection.cover_image || DEFAULT_IMAGE;

  return { title, description, image, url: requestUrl };
}

async function getItemMeta(id, requestUrl) {
  const item = await supabaseGet('items', 'id', id, 'id,name,price,image,link');
  if (!item) return null;

  const priceStr = item.price
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.price)
    : null;

  const title       = priceStr
    ? `${item.name} — ${priceStr} · WishFlow`
    : `${item.name} · WishFlow`;
  const description = priceStr
    ? `${item.name} is available for ${priceStr}. Saved on WishFlow.`
    : `${item.name} — saved on WishFlow. Click to view and save this item.`;
  const image = item.image || DEFAULT_IMAGE;

  return { title, description, image, url: requestUrl };
}

async function getBlogMeta(slug, requestUrl) {
  const post = await supabaseGet('blog_posts', 'slug', slug, 'slug,title,excerpt,cover_image,meta_description');
  if (!post) return null;

  const title       = `${post.title} · WishFlow Blog`;
  const description = post.meta_description || post.excerpt || DEFAULT_DESC;
  const image       = post.cover_image || DEFAULT_IMAGE;

  return { title, description, image, url: requestUrl };
}

// ─── Main middleware export ───────────────────────────────────────────────────
export default async function middleware(request) {
  const { pathname } = new URL(request.url);
  const ua = request.headers.get('user-agent') || '';

  // Only intercept bots — real users pass through immediately
  if (!isSocialBot(ua)) {
    return next();
  }

  // Match routes
  let meta = null;
  try {
    const collectionMatch = pathname.match(/^\/shared\/collection\/([^/]+)$/);
    const itemMatch       = pathname.match(/^\/shared\/item\/([^/]+)$/);
    const blogMatch       = pathname.match(/^\/blog\/([^/]+)$/);

    if (collectionMatch) {
      meta = await getCollectionMeta(collectionMatch[1], `${SITE_URL}${pathname}`);
    } else if (itemMatch) {
      meta = await getItemMeta(itemMatch[1], `${SITE_URL}${pathname}`);
    } else if (blogMatch) {
      meta = await getBlogMeta(blogMatch[1], `${SITE_URL}${pathname}`);
    }
  } catch (err) {
    // If anything fails, fall through to normal page — never break users
    console.error('[OG Middleware] Error:', err.message);
  }

  // No matching route or data not found → serve normally
  if (!meta) return next();

  // Fetch the base index.html from Vercel's origin
  const response = await fetch(request.url);
  const html     = await response.text();

  // Strip out the existing static tags so we don't end up with duplicates
  const cleanHtml = html
    .replace(/<title>.*?<\/title>/gi, '')
    .replace(/<meta[^>]*name="description"[^>]*>/gi, '')
    .replace(/<meta[^>]*property="og:[^>]*>/gi, '')
    .replace(/<meta[^>]*name="twitter:[^>]*>/gi, '');

  // Inject our dynamic OG tags right after <head>
  const ogBlock  = buildOgTags(meta);
  const injected = cleanHtml.replace('<head>', `<head>${ogBlock}`);

  return new Response(injected, {
    status: response.status,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'content-type': 'text/html; charset=utf-8',
      // Tell CDN not to cache bot responses (they are dynamic)
      'cache-control': 'no-store',
    },
  });
}

// ─── Route matcher config — only run on these paths ──────────────────────────
export const config = {
  matcher: [
    '/shared/collection/:id*',
    '/shared/item/:id*',
    '/blog/:slug*',
  ],
};
