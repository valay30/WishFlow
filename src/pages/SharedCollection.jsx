import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../db';
import {
  ShoppingBag, ExternalLink, Calendar, Package,
  Sparkles, CheckCircle2, ChevronRight, Copy, Check,
} from 'lucide-react';

/* ─── helpers ──────────────────────────────────────────────────────────────── */
function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

function fmt(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n);
}

/* ─── Skeleton card ─────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border)', overflow: 'hidden',
    }}>
      <div style={{ height: '180px', background: 'var(--surface-2)', animation: 'wf-shimmer 1.5s infinite' }} />
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <div style={{ height: '16px', borderRadius: '8px', background: 'var(--surface-3)', width: '70%', animation: 'wf-shimmer 1.5s infinite' }} />
        <div style={{ height: '14px', borderRadius: '8px', background: 'var(--surface-2)', width: '40%', animation: 'wf-shimmer 1.5s infinite' }} />
        <div style={{ height: '36px', borderRadius: '10px', background: 'var(--surface-2)', marginTop: '0.5rem', animation: 'wf-shimmer 1.5s infinite' }} />
      </div>
    </div>
  );
}

/* ─── Single item card (public, read-only) ──────────────────────────────────── */
function PublicItemCard({ item }) {
  const purchased = !!item.is_purchased;
  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${purchased ? '#22c55e' : 'var(--border)'}`,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        transition: 'var(--transition)',
        position: 'relative',
        boxShadow: purchased ? '0 0 20px rgba(34,197,94,0.1)' : '0 4px 12px rgba(0,0,0,0.03)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = purchased ? '0 8px 30px rgba(34,197,94,0.2)' : '0 16px 40px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = purchased ? '0 0 20px rgba(34,197,94,0.1)' : '0 4px 12px rgba(0,0,0,0.03)';
      }}
    >
      {/* Gifted ribbon */}
      {purchased && (
        <div style={{
          position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 2,
          background: '#22c55e', backdropFilter: 'blur(8px)',
          borderRadius: '99px', padding: '0.25rem 0.75rem',
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          fontSize: '0.75rem', fontWeight: 800, color: '#fff', letterSpacing: '0.02em',
          boxShadow: '0 4px 12px rgba(34,197,94,0.3)'
        }}>
          <CheckCircle2 size={12} /> Gifted ✓
        </div>
      )}

      {/* Image */}
      <div style={{
        height: '190px',
        background: 'var(--surface-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        filter: purchased ? 'grayscale(0.4) brightness(0.9)' : 'none',
        transition: 'filter 0.3s',
      }}>
        {item.image
          ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Package size={48} style={{ opacity: 0.2, color: 'var(--text)' }} />}
      </div>

      {/* Body */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        <p style={{
          fontWeight: 700, color: 'var(--text)', fontSize: '1rem',
          margin: 0, lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {item.name}
        </p>

        {item.price > 0 && (
          <p style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--primary)', margin: 0 }}>
            {fmt(item.price)}
          </p>
        )}

        {/* Buy / View button */}
        <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
          {item.link ? (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                background: purchased
                  ? 'rgba(34,197,94,0.1)'
                  : 'var(--primary)',
                color: purchased ? '#22c55e' : '#fff',
                border: purchased ? '1px solid rgba(34,197,94,0.2)' : 'none',
                borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem',
                fontWeight: 700, fontSize: '0.9rem',
                textDecoration: 'none', fontFamily: 'inherit',
                transition: 'var(--transition)',
                boxShadow: purchased ? 'none' : '0 4px 12px rgba(var(--primary-rgb), 0.3)'
              }}
              onMouseEnter={e => {
                if (!purchased) e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                if (!purchased) e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {purchased ? <CheckCircle2 size={15} /> : <ExternalLink size={15} />}
              {purchased ? 'Already Gifted' : 'View / Buy'}
            </a>
          ) : (
            <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
              No link added
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SHARED COLLECTION PAGE  —  /shared/collection/:id
   Public, no authentication required.
══════════════════════════════════════════════════════════════════════════════ */
export default function SharedCollection() {
  const { id } = useParams();
  const [collection, setCollection] = useState(null);
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);
  const [copied, setCopied]         = useState(false);

  useEffect(() => {
    (async () => {
      const [col, its] = await Promise.all([
        db.shared.getCollection(id),
        db.shared.getCollectionItems(id),
      ]);
      if (!col) { setNotFound(true); setLoading(false); return; }
      setCollection(col);
      setItems(its || []);
      setLoading(false);
    })();
  }, [id]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* ignore */ }
  };

  const days      = collection ? daysUntil(collection.target_date) : null;
  const isExpired = days !== null && days < 0;
  const isSoon    = days !== null && days >= 0 && days <= 7;
  const totalVal  = items.reduce((s, i) => s + (i.price || 0), 0);
  const giftedCnt = items.filter(i => i.is_purchased).length;

  /* shared styles */
  const ANIM = `
    @keyframes wf-shimmer { 0%,100%{opacity:.5} 50%{opacity:.8} }
    @keyframes wf-fadeup  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes wf-pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(var(--primary-rgb),.4)} 60%{box-shadow:0 0 0 16px rgba(var(--primary-rgb),0)} }
    @keyframes wf-blob    { 0%{transform:scale(1) translate(0px, 0px);} 33%{transform:scale(1.1) translate(20px, -20px);} 66%{transform:scale(0.9) translate(-20px, 20px);} 100%{transform:scale(1) translate(0px, 0px);} }
    
    @media (max-width: 768px) {
      .hero-left-col { align-items: center !important; text-align: center !important; width: 100% !important; }
      .hero-title-row { justify-content: center !important; flex-direction: column !important; gap: 1rem !important; }
      .hero-right-col { align-items: center !important; width: 100% !important; }
      .hero-stats-row { justify-content: center !important; }
    }
  `;

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '0 0 4rem', fontFamily: 'var(--font-main)' }}>
      <style>{ANIM}</style>
      <div style={{ background: 'var(--surface)', padding: '4rem 1.5rem 6rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {[1,2].map(k => (
            <div key={k} style={{ height: k === 1 ? '56px' : '24px', borderRadius: '12px', background: 'var(--surface-2)', marginBottom: '1.25rem', animation: 'wf-shimmer 1.5s infinite', width: k === 1 ? '60%' : '35%' }} />
          ))}
        </div>
      </div>
      <div style={{ maxWidth: '1400px', margin: '-3rem auto 0', padding: '0 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1.5rem', marginTop: '4rem' }}>
          {[1,2,3,4].map(k => <SkeletonCard key={k} />)}
        </div>
      </div>
    </div>
  );

  /* ── Not found ── */
  if (notFound) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem', padding: '2rem', fontFamily: 'var(--font-main)' }}>
      <div style={{ fontSize: '6rem', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))' }}>🔍</div>
      <h1 style={{ color: 'var(--text)', fontWeight: 900, fontSize: '2rem', margin: 0 }}>Collection not found</h1>
      <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 0, fontSize: '1.1rem' }}>
        This link may be invalid or the collection was deleted.
      </p>
      <Link to="/" style={{
        marginTop: '1.5rem', padding: '1rem 2.5rem',
        background: 'var(--primary)',
        color: '#fff', borderRadius: 'var(--radius-xl)', textDecoration: 'none', fontWeight: 800,
        boxShadow: '0 8px 24px rgba(var(--primary-rgb), 0.3)',
        transition: 'var(--transition)'
      }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
        Create your own WishFlow
      </Link>
    </div>
  );

  /* ── Main page ── */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-main)' }}>
      <style>{ANIM}</style>

      {/* ══ HERO HEADER ══ */}
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '3rem 1.5rem 6rem',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Animated Glow Blobs */}
        <div style={{
          position: 'absolute', top: '-150px', right: '-10%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(var(--primary-rgb),0.08) 0%, transparent 60%)',
          pointerEvents: 'none', animation: 'wf-blob 15s infinite alternate ease-in-out',
        }} />
        <div style={{
          position: 'absolute', bottom: '-200px', left: '-5%',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(var(--primary-rgb),0.05) 0%, transparent 60%)',
          pointerEvents: 'none', animation: 'wf-blob 20s infinite alternate-reverse ease-in-out',
        }} />

        <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '3rem' }}>
          
          {/* ── LEFT COLUMN ── */}
          <div className="hero-left-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: '1 1 min-content' }}>
            {/* WishFlow badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: 'var(--primary-lt)', border: '1px solid rgba(var(--primary-rgb), 0.15)',
              borderRadius: '99px', padding: '0.35rem 1rem',
              fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)',
              marginBottom: '1.5rem', letterSpacing: '0.06em', textTransform: 'uppercase',
              boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.08)'
            }}>
              <Sparkles size={12} /> WishFlow Collection
            </div>

            {/* Emoji + Title Row */}
            <div className="hero-title-row" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{
                width: '100px', height: '100px', borderRadius: '32px',
                background: 'var(--primary-lt)', border: '2px solid rgba(var(--primary-rgb), 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '4rem', flexShrink: 0,
                boxShadow: '0 12px 40px rgba(var(--primary-rgb), 0.15)',
                animation: 'wf-pulse 3s infinite',
              }}>
                {collection.emoji}
              </div>
              
              <div>
                <h1 style={{
                  fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900,
                  color: 'var(--text)', margin: 0, letterSpacing: '-0.03em', lineHeight: 1.1,
                }}>
                  {collection.name}
                </h1>

                {/* Countdown badge */}
                {days !== null && (
                  <div style={{ marginTop: '1rem' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.4rem 1.25rem', borderRadius: '99px',
                      fontSize: '0.9rem', fontWeight: 800,
                      background: isExpired ? 'rgba(239,68,68,0.1)' : isSoon ? 'rgba(245,158,11,0.1)' : 'var(--primary-lt)',
                      color:      isExpired ? '#ef4444'              : isSoon ? '#f59e0b'              : 'var(--primary)',
                      border: `1px solid ${isExpired ? 'rgba(239,68,68,0.2)' : isSoon ? 'rgba(245,158,11,0.2)' : 'rgba(var(--primary-rgb),0.15)'}`,
                    }}>
                      <Calendar size={15} />
                      {isExpired ? 'Date passed' : days === 0 ? '🎉 Today!' : `${days} days left`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="hero-right-col" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Stats row */}
            <div className="hero-stats-row" style={{ 
              display: 'flex', flexWrap: 'wrap', gap: '2rem',
              padding: '1.5rem 2rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border)'
            }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600 }}>
                <span style={{ color: 'var(--text)', fontWeight: 900, fontSize: '1.25rem', display: 'block' }}>{items.length}</span> 
                {items.length === 1 ? 'Item' : 'Items'}
              </span>
              {totalVal > 0 && (
                <span style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600 }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '1.25rem', display: 'block' }}>{fmt(totalVal)}</span> 
                  Total Value
                </span>
              )}
              {giftedCnt > 0 && (
                <span style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600 }}>
                  <span style={{ color: '#22c55e', fontWeight: 900, fontSize: '1.25rem', display: 'block' }}>{giftedCnt}</span> 
                  Already Gifted 🎁
                </span>
              )}
            </div>

            {/* Copy link button */}
            <button
              id="shared-copy-link-btn"
              onClick={copyLink}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                background: copied ? '#22c55e' : 'var(--primary)',
                border: 'none',
                color: '#fff',
                borderRadius: 'var(--radius-xl)', padding: '1.1rem 2rem',
                fontWeight: 800, fontSize: '1.05rem',
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: copied ? '0 8px 24px rgba(34,197,94,0.3)' : '0 8px 24px rgba(var(--primary-rgb), 0.3)',
                width: '100%'
              }}
              onMouseEnter={e => { if (!copied) e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { if (!copied) e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Link Copied to Clipboard!' : 'Copy Shareable Link'}
            </button>
          </div>
        </div>
      </div>

      {/* ══ ITEMS PANEL ══ */}
      <div style={{ maxWidth: '1440px', margin: '-3.5rem auto 0', padding: '0 1.25rem 0', position: 'relative', zIndex: 2 }}>
        <div style={{
          background: 'rgba(var(--surface-rgb, 255, 255, 255), 0.8)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          border: '1px solid var(--border)',
          borderBottom: 'none',
          padding: '2.5rem 2rem',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--primary-lt)', padding: '0.6rem', borderRadius: '12px' }}>
              <ShoppingBag size={20} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
              Wishes Collection
            </h2>
            <span style={{
              marginLeft: 'auto', fontSize: '0.85rem', fontWeight: 800,
              color: 'var(--primary)', background: 'var(--primary-lt)',
              borderRadius: '99px', padding: '0.25rem 0.85rem',
            }}>
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', border: '2px dashed var(--border)' }}>
              <Package size={64} style={{ opacity: 0.2, color: 'var(--text)', marginBottom: '1.5rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.5rem' }}>Empty Collection</h3>
              <p style={{ fontWeight: 500, margin: 0, color: 'var(--text-muted)' }}>No items have been added to this wishlist yet.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '1.5rem',
            }}>
              {items.map((item, i) => (
                <div key={item.id} style={{ animation: `wf-fadeup 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) ${i * 0.08}s both` }}>
                  <PublicItemCard item={item} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══ CTA BANNER ══ */}
        <div style={{
          background: 'var(--primary-lt)',
          border: '1px solid rgba(var(--primary-rgb), 0.15)',
          borderTop: 'none',
          borderRadius: '0 0 var(--radius-xl) var(--radius-xl)',
          padding: '2.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '1.5rem',
          marginBottom: '4rem',
        }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)',
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem',
            }}>
              <Sparkles size={12} /> Powered by WishFlow
            </div>
            <h3 style={{ color: 'var(--text)', fontWeight: 900, fontSize: '1.5rem', margin: 0, lineHeight: 1.2 }}>
              Create your own wishlist for free
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: '0.5rem 0 0', fontWeight: 500 }}>
              Organize, track &amp; share your wishes with friends &amp; family.
            </p>
          </div>
          <Link
            to="/auth"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'var(--primary)',
              color: '#fff', borderRadius: 'var(--radius-lg)', padding: '1rem 2rem',
              fontWeight: 800, fontSize: '1rem',
              textDecoration: 'none', whiteSpace: 'nowrap',
              boxShadow: '0 8px 24px rgba(var(--primary-rgb), 0.3)',
              transition: 'var(--transition)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(var(--primary-rgb), 0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(var(--primary-rgb), 0.3)'; }}
          >
            Get Started Free <ChevronRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
