import React, { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { API_URL as API } from '../config';
import AdUnit from '../components/AdUnit';
import { Clock, ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { blogPosts as staticPosts } from '../data/blogPosts';

const PRIMARY = '#E97451';
const FONT = "'Outfit', 'Inter', sans-serif";

/* ── Content section renderer ────────────────────────────────────────────── */
function ContentSection({ section, postIndex }) {
  const baseText = {
    fontFamily: FONT,
    color: 'var(--text-dim, #374151)',
    fontSize: 'clamp(1rem, 2vw, 1.08rem)',
    lineHeight: 1.8,
    margin: 0,
  };

  switch (section.type) {
    case 'p':
      return <p style={{ ...baseText, marginBottom: '1.25rem' }}>{section.text}</p>;

    case 'h2':
      return (
        <h2 style={{
          fontFamily: FONT, fontWeight: 800,
          fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
          color: 'var(--text, #111)', letterSpacing: '-0.02em',
          margin: '2.5rem 0 0.75rem 0', lineHeight: 1.3,
        }}>
          {section.text}
        </h2>
      );

    case 'h3':
      return (
        <h3 style={{
          fontFamily: FONT, fontWeight: 700,
          fontSize: '1.1rem',
          color: 'var(--text, #111)',
          margin: '1.75rem 0 0.5rem 0', lineHeight: 1.4,
        }}>
          {section.text}
        </h3>
      );

    case 'list':
      return (
        <ul style={{
          paddingLeft: '1.5rem', margin: '0.5rem 0 1.25rem',
          display: 'flex', flexDirection: 'column', gap: '0.6rem',
        }}>
          {section.items.map((item, i) => (
            <li key={i} style={{ ...baseText, paddingLeft: '0.25rem' }}>{item}</li>
          ))}
        </ul>
      );

    case 'callout':
      return (
        <div style={{
          background: 'rgba(233,116,81,0.06)',
          border: `1px solid rgba(233,116,81,0.25)`,
          borderLeft: `4px solid ${PRIMARY}`,
          borderRadius: '12px', padding: '1.25rem 1.5rem',
          margin: '1.5rem 0',
        }}>
          <p style={{ ...baseText, color: 'var(--text, #222)', margin: 0 }}>{section.text}</p>
        </div>
      );

    case 'tip':
      return (
        <div style={{
          background: 'linear-gradient(135deg, rgba(41,128,185,0.07) 0%, rgba(41,128,185,0.03) 100%)',
          border: '1px solid rgba(41,128,185,0.2)',
          borderRadius: '14px', padding: '1.25rem 1.5rem',
          margin: '2rem 0',
        }}>
          <p style={{ ...baseText, color: 'var(--text, #1a1a2e)', margin: 0, fontStyle: 'italic' }}>
            {section.text}
          </p>
        </div>
      );

    case 'ad':
      return (
        <div style={{ margin: '2.5rem 0' }}>
          <AdUnit
            slot="5218446276"
            style={{ minHeight: '90px', borderRadius: '12px' }}
          />
        </div>
      );

    default:
      return null;
  }
}

/* ── Related Articles ────────────────────────────────────────────────────── */
function RelatedCard({ post }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <Link
      to={`/blog/${post.slug}`}
      id={`related-${post.slug}`}
      style={{ textDecoration: 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        background: 'var(--surface, #fff)',
        border: '1px solid var(--border, #eee)',
        borderRadius: '16px', overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? '0 12px 32px rgba(0,0,0,0.1)' : '0 2px 10px rgba(0,0,0,0.04)',
        display: 'flex', flexDirection: 'column', height: '100%',
      }}>
        <div style={{ aspectRatio: '16/9', overflow: 'hidden', background: '#f5f5f5' }}>
          <img
            src={post.coverImage} alt={post.coverAlt} loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover',
              transition: 'transform 0.35s ease',
              transform: hovered ? 'scale(1.05)' : 'scale(1)',
            }}
          />
        </div>
        <div style={{ padding: '1.1rem' }}>
          <span style={{
            display: 'inline-block',
            background: post.categoryColor, color: '#fff',
            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase', padding: '3px 10px', borderRadius: '999px',
            marginBottom: '0.6rem', fontFamily: FONT,
          }}>
            {post.category}
          </span>
          <p style={{
            fontFamily: FONT, fontWeight: 700, fontSize: '0.95rem',
            color: 'var(--text, #111)', lineHeight: 1.4, margin: '0 0 0.5rem',
          }}>
            {post.title}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={12} color="var(--text-dim, #88909D)" />
            <span style={{ fontFamily: FONT, fontSize: '0.73rem', color: 'var(--text-dim, #88909D)' }}>
              {post.readTime}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── BlogPost Page ───────────────────────────────────────────────────────── */
export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(() => {
    try {
      const cached = localStorage.getItem(`wishflow_blog_post_${slug}`);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return staticPosts.find(p => p.slug === slug) || null;
  });

  const [related, setRelated] = useState(() => {
    try {
      const cached = localStorage.getItem('wishflow_blog_cache');
      if (cached) {
         return JSON.parse(cached).filter(p => p.slug !== slug).slice(0, 2);
      }
    } catch (e) {}
    return staticPosts.filter(p => p.slug !== slug).slice(0, 2);
  });

  const [loading, setLoading] = useState(!post);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (!post) setLoading(true);

    Promise.all([
      fetch(`${API}/api/blog/${slug}`).then(r => r.ok ? r.json() : null),
      fetch(`${API}/api/blog`).then(r => r.ok ? r.json() : [])
    ]).then(([postData, allPosts]) => {
      if (postData && postData.slug) {
        setPost(postData);
        localStorage.setItem(`wishflow_blog_post_${slug}`, JSON.stringify(postData));
      }
      if (allPosts && allPosts.length > 0) {
        setRelated(allPosts.filter(p => p.slug !== slug).slice(0, 2));
        localStorage.setItem('wishflow_blog_cache', JSON.stringify(allPosts));
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>Loading post...</div>;
  }

  if (!post) return <Navigate to="/blog" replace />;

  return (
    <div style={{ fontFamily: FONT, minHeight: '100vh', background: 'var(--bg, #f9f9f9)' }}>

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
        padding: 'clamp(2.5rem, 6vw, 5rem) 1.5rem 0',
      }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '2rem', flexWrap: 'wrap',
          }}>
            <Link to="/" id="breadcrumb-home" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontFamily: FONT, fontSize: '0.82rem', fontWeight: 500 }}>
              Home
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>›</span>
            <Link to="/blog" id="breadcrumb-blog" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontFamily: FONT, fontSize: '0.82rem', fontWeight: 500 }}>
              Blog
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>›</span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontFamily: FONT, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
              {post.title}
            </span>
          </div>

          {/* Category + Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <span style={{
              background: post.categoryColor, color: '#fff',
              fontFamily: FONT, fontSize: '0.73rem', fontWeight: 700,
              padding: '5px 14px', borderRadius: '999px', letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              {post.category}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={13} color="rgba(255,255,255,0.4)" />
              <span style={{ fontFamily: FONT, fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                {post.readTime} · {post.publishedAt}
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: FONT, fontWeight: 900,
            fontSize: 'clamp(1.75rem, 4.5vw, 2.8rem)',
            color: '#fff', letterSpacing: '-0.03em',
            lineHeight: 1.2, margin: '0 0 1.5rem 0',
          }}>
            {post.title}
          </h1>

          {/* Excerpt */}
          <p style={{
            fontFamily: FONT, color: 'rgba(255,255,255,0.65)',
            fontSize: 'clamp(1rem, 2.5vw, 1.12rem)', lineHeight: 1.7,
            margin: '0 0 2.5rem 0',
          }}>
            {post.excerpt}
          </p>
        </div>

        {/* Cover image — bleeds into content */}
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{
            borderRadius: '20px 20px 0 0', overflow: 'hidden',
            aspectRatio: '16/7', boxShadow: '0 -4px 40px rgba(0,0,0,0.3)',
          }}>
            <img
              src={post.coverImage} alt={post.coverAlt}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
      </div>

      {/* ── Article Body ── */}
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <article>
          {/* Top-of-article ad — highest revenue position */}
          <div style={{ margin: '0 0 2.5rem' }}>
            <AdUnit
              slot="5218446276"
              format="horizontal"
              style={{ minHeight: '90px', borderRadius: '12px' }}
            />
          </div>

          {post.content.map((section, i) => (
            <ContentSection key={i} section={section} postIndex={i} />
          ))}
        </article>

        {/* Author / Back */}
        <div style={{
          marginTop: '3rem', paddingTop: '2rem',
          borderTop: '1px solid var(--border, #eee)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: `linear-gradient(135deg, ${PRIMARY}, #f4a261)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <BookOpen size={18} color="#fff" />
            </div>
            <div>
              <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '0.9rem', color: 'var(--text, #111)', margin: 0 }}>
                {post.author}
              </p>
              <p style={{ fontFamily: FONT, fontSize: '0.78rem', color: 'var(--text-dim, #88909D)', margin: 0 }}>
                {post.publishedAt}
              </p>
            </div>
          </div>

          <Link
            to="/blog"
            id="back-to-blog"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              color: PRIMARY, fontFamily: FONT, fontWeight: 700,
              fontSize: '0.88rem', textDecoration: 'none',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <ArrowLeft size={15} /> Back to Blog
          </Link>
        </div>

        {/* Bottom Ad */}
        <div style={{ margin: '2.5rem 0' }}>
          <AdUnit slot="5218446276" style={{ minHeight: '90px', borderRadius: '12px' }} />
        </div>
      </div>

      {/* ── Related Articles ── */}
      {related.length > 0 && (
        <div style={{
          borderTop: '1px solid var(--border, #eee)',
          padding: '3rem 1.5rem 5rem',
          background: 'var(--surface, #fff)',
        }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: '1.25rem', color: 'var(--text, #111)', margin: 0 }}>
                More Articles
              </h2>
              <Link to="/blog" id="see-all-articles" style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                color: PRIMARY, fontFamily: FONT, fontWeight: 700, fontSize: '0.88rem',
                textDecoration: 'none',
              }}>
                See all <ArrowRight size={14} />
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
              {related.map((p) => <RelatedCard key={p.slug} post={p} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
