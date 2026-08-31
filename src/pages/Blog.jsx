import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Clock, ArrowRight, BookOpen } from 'lucide-react';
import { API_URL as API } from '../config';
import { blogPosts as staticPosts } from '../data/blogPosts';

const PRIMARY = '#E97451';
const FONT = "'Outfit', 'Inter', sans-serif";

/* ── Metadata for SEO ────────────────────────────────────────────────────── */
// Note: React doesn't support <head> manipulation natively without a library.
// For proper SEO, consider adding react-helmet-async or handling in your SSR/meta layer.

/* ── Hero Section ────────────────────────────────────────────────────────── */
function BlogHero() {
  return (
    <section
      style={{
        background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`,
        padding: 'clamp(4rem, 10vw, 7rem) 1.5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative blobs */}
      <div style={{
        position: 'absolute', top: '-60px', right: '-60px',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(233,116,81,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-80px', left: '-40px',
        width: '250px', height: '250px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(233,116,81,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px', margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(233,116,81,0.15)', border: '1px solid rgba(233,116,81,0.3)',
          borderRadius: '999px', padding: '6px 16px', marginBottom: '1.5rem',
        }}>
          <BookOpen size={14} color={PRIMARY} />
          <span style={{ color: PRIMARY, fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            WishFlow Blog
          </span>
        </div>

        <h1 style={{
          fontFamily: FONT, fontWeight: 900,
          fontSize: 'clamp(2rem, 5vw, 3.2rem)',
          letterSpacing: '-0.03em', margin: '0 0 1rem 0',
          color: '#fff', lineHeight: 1.15,
        }}>
          Gift Guides, Shopping Tips &amp; Wishlist Inspiration
        </h1>

        <p style={{
          fontFamily: FONT, color: 'rgba(255,255,255,0.65)',
          fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
          lineHeight: 1.7, margin: 0,
        }}>
          Thoughtful articles on gifting, smart shopping, and making the most of your wishlists — for every occasion and budget.
        </p>
      </div>
    </section>
  );
}

/* ── Article Card ────────────────────────────────────────────────────────── */
function ArticleCard({ post, featured = false }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <Link
      to={`/blog/${post.slug}`}
      id={`blog-card-${post.slug}`}
      style={{ textDecoration: 'none', display: 'block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <article
        style={{
          background: 'var(--surface, #fff)',
          borderRadius: '20px',
          overflow: 'hidden',
          border: '1px solid var(--border, #eee)',
          transition: 'transform 0.25s ease, box-shadow 0.25s ease',
          transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
          boxShadow: hovered
            ? '0 20px 50px rgba(0,0,0,0.12)'
            : '0 4px 20px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* Cover Image */}
        <div style={{
          position: 'relative',
          aspectRatio: featured ? '16/7' : '16/9',
          overflow: 'hidden',
          background: '#f5f5f5',
          flexShrink: 0,
        }}>
          <img
            src={post.coverImage}
            alt={post.coverAlt}
            loading="lazy"
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transition: 'transform 0.4s ease',
              transform: hovered ? 'scale(1.05)' : 'scale(1)',
            }}
          />
          {/* Category badge */}
          <span style={{
            position: 'absolute', top: '12px', left: '12px',
            background: post.categoryColor,
            color: '#fff', fontFamily: FONT,
            fontSize: '0.7rem', fontWeight: 700,
            padding: '4px 12px', borderRadius: '999px',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            {post.category}
          </span>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={13} color="var(--text-dim, #88909D)" />
            <span style={{ fontFamily: FONT, fontSize: '0.78rem', color: 'var(--text-dim, #88909D)', fontWeight: 500 }}>
              {post.readTime} · {post.publishedAt}
            </span>
          </div>

          <h2 style={{
            fontFamily: FONT, fontWeight: 800,
            fontSize: featured ? 'clamp(1.2rem, 2.5vw, 1.5rem)' : '1.1rem',
            color: 'var(--text, #111)', lineHeight: 1.35, margin: 0,
            letterSpacing: '-0.02em',
          }}>
            {post.title}
          </h2>

          <p style={{
            fontFamily: FONT, color: 'var(--text-dim, #555)',
            fontSize: '0.93rem', lineHeight: 1.65, margin: 0,
            flex: 1,
          }}>
            {post.excerpt}
          </p>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            color: PRIMARY, fontFamily: FONT, fontWeight: 700, fontSize: '0.88rem',
            marginTop: 'auto', transition: 'gap 0.2s ease',
            ...(hovered ? { gap: '10px' } : {}),
          }}>
            Read Article <ArrowRight size={15} />
          </div>
        </div>
      </article>
    </Link>
  );
}

/* ── Main Blog Page ──────────────────────────────────────────────────────── */
import React from 'react';

export default function Blog() {
  const [posts, setPosts] = useState(() => {
    try {
      const cached = localStorage.getItem('wishflow_blog_cache');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    // Fallback to static data if no cache, avoiding empty skeleton
    return staticPosts || [];
  });
  
  const [loading, setLoading] = useState(posts.length === 0);

  useEffect(() => {
    fetch(`${API}/api/blog`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPosts(data);
          localStorage.setItem('wishflow_blog_cache', JSON.stringify(data));
        } else if (posts.length === 0) {
          setPosts([]);
        }
      })
      .catch(() => {
        if (posts.length === 0) setPosts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const [featured, ...rest] = posts;

  return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', background: 'var(--bg, #f9f9f9)' }}>
      {/* Page title for SEO */}
      <title>Blog — Gift Guides & Shopping Tips | WishFlow</title>

      <BlogHero />

      <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '3.5rem 1.5rem 5rem' }}>

        {loading ? (
          /* Loading skeleton */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '1.75rem' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border, #eee)', background: 'var(--surface, #fff)' }}>
                <div style={{ aspectRatio: '16/9', background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ height: '12px', width: '30%', borderRadius: '6px', background: '#f0f0f0' }} />
                  <div style={{ height: '20px', width: '90%', borderRadius: '6px', background: '#f0f0f0' }} />
                  <div style={{ height: '14px', width: '70%', borderRadius: '6px', background: '#f0f0f0' }} />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <BookOpen size={48} color="#e2e8f0" style={{ marginBottom: '1rem' }} />
            <p style={{ fontFamily: FONT, fontWeight: 700, color: '#94a3b8' }}>No articles published yet.</p>
          </div>
        ) : (
          <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem',
          }}>
            <div style={{ width: '3px', height: '22px', background: PRIMARY, borderRadius: '2px' }} />
            <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: '0.8rem', color: PRIMARY, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Featured Article
            </span>
          </div>
          <ArticleCard post={featured} featured />

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '2.5rem',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border, #eee)' }} />
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-dim, #88909D)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            More Articles
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border, #eee)' }} />
        </div>

        {/* Article grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
          gap: '1.75rem',
        }}>
          {rest.map((post) => (
            <ArticleCard key={post.slug} post={post} />
          ))}
        </div>
        </>
        )}

        {/* Bottom CTA */}
        <div style={{
          marginTop: '4rem', textAlign: 'center',
          background: `linear-gradient(135deg, rgba(233,116,81,0.08) 0%, rgba(233,116,81,0.03) 100%)`,
          border: '1px solid rgba(233,116,81,0.2)',
          borderRadius: '24px', padding: '3rem 2rem',
        }}>
          <h3 style={{ fontFamily: FONT, fontWeight: 800, fontSize: '1.5rem', margin: '0 0 0.75rem 0', color: 'var(--text, #111)' }}>
            Start Your Wishlist Today
          </h3>
          <p style={{ fontFamily: FONT, color: 'var(--text-dim, #666)', lineHeight: 1.7, margin: '0 0 1.5rem 0', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
            Add items from any website, organise into collections, and share with friends and family — completely free.
          </p>
          <Link
            to="/auth"
            id="blog-cta-signup"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: PRIMARY, color: '#fff',
              fontFamily: FONT, fontWeight: 700, fontSize: '0.95rem',
              padding: '0.85rem 2rem', borderRadius: '12px',
              textDecoration: 'none',
              boxShadow: `0 4px 20px rgba(233,116,81,0.35)`,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 28px rgba(233,116,81,0.45)`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 20px rgba(233,116,81,0.35)`; }}
          >
            Get Started Free <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
