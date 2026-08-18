import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../db';
import { Package, Search, Link2, Check, ChevronDown, ArrowRight } from 'lucide-react';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function fmt(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n);
}

function getDay(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = target - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/* ─── Shimmer skeleton ────────────────────────────────────────────────────── */
function Skeleton({ w = '100%', h = '16px', r = '8px', style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'sc-shimmer 1.4s ease-in-out infinite',
      ...style,
    }} />
  );
}

/* ─── Search overlay ─────────────────────────────────────────────────────── */
function SearchOverlay({ items, onClose }) {
  const [q, setQ] = useState('');
  const filtered = q.trim()
    ? items.filter(i => i.name?.toLowerCase().includes(q.toLowerCase()))
    : items;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', flexDirection: 'column',
    }} onClick={onClose}>
      <div style={{
        background: '#fff', padding: '1rem',
        borderRadius: '0 0 20px 20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          background: '#f5f5f5', borderRadius: '14px', padding: '0.75rem 1rem',
        }}>
          <Search size={18} color="#888" />
          <input
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search items…"
            style={{
              border: 'none', background: 'none', outline: 'none',
              fontSize: '1rem', fontFamily: 'inherit', flex: 1, color: '#111',
            }}
          />
        </div>
        <div style={{ marginTop: '1rem', maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.length === 0 && (
            <p style={{ textAlign: 'center', color: '#999', padding: '2rem', margin: 0 }}>No items found</p>
          )}
          {filtered.map(item => (
            <a
              key={item.id}
              href={item.link || '#'}
              target={item.link ? '_blank' : '_self'}
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem', borderRadius: '12px', background: '#fafafa',
                textDecoration: 'none', color: '#111',
              }}
            >
              {item.image
                ? <img src={item.image} alt={item.name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }} />
                : <div style={{ width: 44, height: 44, borderRadius: '10px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Package size={20} color="#ccc" /></div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                {item.price > 0 && <p style={{ margin: 0, fontSize: '0.85rem', color: '#E85C2C', fontWeight: 700 }}>{fmt(item.price)}</p>}
              </div>
              {item.link && <ArrowRight size={16} color="#E85C2C" />}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Mobile item card (portrait, 2-col grid) ────────────────────────────── */
function MobileItemCard({ item }) {
  const purchased = !!item.is_purchased;
  return (
    <div style={{
      background: '#fff',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
      display: 'flex',
      flexDirection: 'column',
      opacity: purchased ? 0.7 : 1,
      padding: '0.35rem',
      border: '1px solid #f9f9f9',
    }}>
      <div style={{
        aspectRatio: '1 / 1',
        background: '#f7f7f7',
        overflow: 'hidden',
        position: 'relative',
        borderRadius: '16px',
      }}>
        {item.image
          ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={40} color="#ddd" /></div>
        }
        {purchased && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem',
          }}>✓</div>
        )}
      </div>
      <div style={{ padding: '0.75rem 0.5rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        <p style={{
          margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#111',
          lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{item.name}</p>

        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          {item.price > 0 && (
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#111' }}>{fmt(item.price)}</span>
          )}
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#fff',
                border: '1.5px solid #f0f0f0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, textDecoration: 'none',
                transition: 'all 0.2s',
              }}
            >
              <ArrowRight size={16} color="#E85C2C" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Desktop item card (horizontal layout) ─────────────────────────────── */
function DesktopItemCard({ item }) {
  const purchased = !!item.is_purchased;
  return (
    <div style={{
      background: '#fff',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      display: 'flex',
      flexDirection: 'row',
      minHeight: '160px',
      opacity: purchased ? 0.7 : 1,
    }}>
      <div style={{
        width: '45%', maxWidth: '200px', flexShrink: 0,
        background: '#f7f7f7', overflow: 'hidden',
        position: 'relative',
      }}>
        {item.image
          ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={40} color="#ddd" /></div>
        }
        {purchased && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem',
          }}>✓</div>
        )}
      </div>
      <div style={{
        flex: 1, padding: '1.5rem',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        <p style={{
          margin: 0, fontWeight: 700, fontSize: '1.05rem', color: '#111',
          lineHeight: 1.4,
        }}>{item.name}</p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '1rem' }}>
          {item.price > 0 && (
            <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#111' }}>{fmt(item.price)}</span>
          )}
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: 42, height: 42, borderRadius: '50%',
                background: '#FFF0EB',
                border: '1.5px solid rgba(232,92,44,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, textDecoration: 'none',
                transition: 'all 0.2s',
              }}
            >
              <ArrowRight size={18} color="#E85C2C" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── helpers ──────────────────────────────────────────────────────────────── */
/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE  —  /shared/collection/:id  (public, no auth)
══════════════════════════════════════════════════════════════════════════════ */
export default function SharedCollection() {
  const { id } = useParams();
  const [collection, setCollection] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

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

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* ignore */ }
  }, []);

  const totalVal = items.reduce((s, i) => s + (i.price || 0), 0);
  const day = collection ? getDay(collection.target_date) : null;

  const STYLES = `
    @keyframes sc-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    @keyframes sc-fadeup {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .sc-page {
      min-height: 100vh;
      background: #fff;
      font-family: 'Outfit', sans-serif;
      padding-bottom: 120px;
    }
    .sc-header {
      background: #fff;
      padding: 1.1rem 1.25rem;
      display: flex;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .sc-header-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
    }
    .sc-title {
      font-size: 1.75rem;
      font-weight: 900;
      color: #111;
      letter-spacing: -0.02em;
      margin: 0;
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .sc-stats-pill {
      display: inline-flex;
      align-items: center;
      background: #fafafa;
      border: 1px solid #f0f0f0;
      border-radius: 99px;
      overflow: hidden;
      font-size: 0.85rem;
      font-weight: 700;
    }
    .sc-stats-items { padding: 0.35rem 0.75rem; color: #111; }
    .sc-stats-divider { width: 1px; height: 16px; background: #e8e8e8; }
    .sc-stats-price { padding: 0.35rem 0.75rem; color: #E85C2C; }
    .sc-calendar-wrapper {
      position: relative;
      width: 50px;
      height: 48px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.4);
      padding: 3px;
      box-shadow: 0 8px 24px rgba(255, 90, 70, 0.25), inset 0 0 0 1px rgba(255,255,255,0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      flex-shrink: 0;
    }
    .sc-calendar-inner {
      width: 100%;
      height: 100%;
      border-radius: 10px;
      background: #fff;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: inset 0 2px 4px rgba(255, 255, 255, 1);
    }
    .sc-calendar-top {
      height: 30%;
      background: linear-gradient(135deg, #FF9A5A 0%, #FF3D3D 100%);
      position: relative;
    }
    .sc-calendar-top::before,
    .sc-calendar-top::after {
      content: '';
      position: absolute;
      top: -3px;
      width: 5px;
      height: 11px;
      background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.4));
      border-radius: 4px;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.1), 0 1px 1px rgba(255,255,255,0.9);
      z-index: 2;
    }
    .sc-calendar-top::before { left: 10px; }
    .sc-calendar-top::after { right: 10px; }
    .sc-calendar-bottom {
      height: 50%;
      background: linear-gradient(180deg, #ffffff 0%, #f7f7f7 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .sc-calendar-day {
      font-size: 1.25rem;
      font-weight: 700;
      color: #111;
      line-height: 1;
      margin-top: 6px;
      position: relative;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      letter-spacing: -0.5px;
    }
    .sc-calendar-day::after {
      content: attr(data-day);
      position: absolute;
      left: 0; right: 0; text-align: center;
      top: 96%;
      transform: scaleY(-1);
      background: linear-gradient(180deg, rgba(0,0,0,0.12) 0%, transparent 40%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      pointer-events: none;
    }
    /* mobile: stats pill below header */
    .sc-stats-mobile {
      display: flex; align-items: center; justify-content: center;
      padding: 0.7rem 1.5rem;
  font-size: 1rem;
  
    }
    /* desktop: stats in header, hide mobile pill */
    .sc-stats-desktop { display: none; }
    @media (min-width: 640px) {
      .sc-header { padding: 1.25rem 2rem; border-bottom: 1px solid #f0f0f0; }
      .sc-title { font-size: 2rem; }
      .sc-stats-mobile { display: none; }
      .sc-stats-desktop { display: flex; }
    }
    @media (min-width: 900px) {
      .sc-title { font-size: 2.25rem; }
    }
    /* item grids */
    .sc-grid-mobile {
      display: grid; grid-template-columns: repeat(2, 1fr);
      gap: 1rem; padding: 1rem 1.25rem;
    }
    .sc-grid-desktop { display: none; }
    @media (min-width: 640px) {
      .sc-grid-mobile { display: none; }
      .sc-grid-desktop {
        display: grid; grid-template-columns: repeat(2, 1fr);
        gap: 1rem; padding: 1.25rem 1.5rem 0;
      }
    }
    @media (min-width: 1024px) {
      .sc-grid-desktop { gap: 1.25rem; padding: 1.5rem 2rem 0; }
    }
    @media (min-width: 1280px) {
      .sc-grid-desktop { grid-template-columns: repeat(3, 1fr); }
    }
    /* CTA banner */
    .sc-cta {
      margin: 1rem 1.25rem;
      background: linear-gradient(135deg, #FFF4F1 0%, #FFF9F7 100%);
      border-radius: 20px;
      padding: 1.75rem 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;
    }
    @media (min-width: 640px) {
      .sc-cta {
        margin: 1.5rem 1.5rem 0; padding: 1.75rem 2rem;
        flex-direction: row; align-items: center;
        justify-content: space-between; gap: 2rem;
      }
    }
    @media (min-width: 1024px) {
      .sc-cta { margin: 1.5rem 2rem 0; }
    }
    .sc-cta-powered {
      display: inline-flex; align-items: center; gap: 0.4rem;
      font-size: 0.75rem; font-weight: 800; color: #E85C2C;
      letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.75rem;
    }
    .sc-cta-title {
      font-size: 1.75rem; font-weight: 900; color: #111;
      margin: 0 0 0.5rem; line-height: 1.15;
    }
    @media (min-width: 640px) { .sc-cta-title { font-size: 2rem; } }
    .sc-cta-sub { font-size: 1rem; color: #666; margin: 0; font-weight: 500; line-height: 1.5; }
    .sc-cta-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
      background: linear-gradient(180deg, #fff 0%, #fff 100%);
      box-shadow: 0 8px 24px rgba(232,92,44,0.15), inset 0 -2px 0 rgba(232,92,44,0.05);
      border: 1px solid rgba(232,92,44,0.2);
      color: #E85C2C; border-radius: 99px;
      padding: 1rem 1.75rem;
      font-weight: 800; font-size: 1.05rem; font-family: 'Outfit', sans-serif;
      cursor: pointer; text-decoration: none; white-space: nowrap;
      flex-shrink: 0; transition: all 0.2s;
      width: 100%;
    }
    @media (min-width: 640px) {
      .sc-cta-btn { width: auto; }
    }
    .sc-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(232,92,44,0.2); }
    /* bottom bar */
    .sc-bottom {
      position: fixed; bottom: 20px; left: 0; right: 0; z-index: 200;
      padding: 0 1.25rem;
      display: flex; align-items: center; justify-content: space-between;
      pointer-events: none;
    }
    .sc-copy-btn {
      display: inline-flex; align-items: center; gap: 0.5rem;
      background: #fafafa; border: 1.5px solid #f0f0f0; border-radius: 99px;
      padding: 0.75rem 1.25rem; font-size: 0.95rem; font-weight: 700; color: #111;
      font-family: 'Outfit', sans-serif; cursor: pointer; transition: all 0.18s;
      pointer-events: auto;
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    }
    .sc-copy-btn:hover { background: #fff; transform: translateY(-2px); }
    .sc-search-btn {
      background: #fafafa; border: 1.5px solid #f0f0f0; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      width: 48px; height: 48px; border-radius: 50%; color: #111;
      transition: all 0.18s; pointer-events: auto;
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    }
    .sc-search-btn:hover { background: #fff; transform: translateY(-2px); color: #E85C2C; }
    .sc-content { max-width: 1200px; margin: 0 auto; }
    .sc-notfound {
      min-height: 100vh; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 1rem;
      padding: 2rem; font-family: 'Outfit', sans-serif; background: #fff;
    }
  `;

  /* ── Loading ── */
  if (loading) return (
    <div className="sc-page">
      <style>{STYLES}</style>
      <div className="sc-header">
        <div className="sc-header-inner">
          <Skeleton w="200px" h="36px" r="10px" />
          <div style={{ marginLeft: 'auto' }}><Skeleton w="140px" h="34px" r="99px" /></div>
          <Skeleton w="44px" h="44px" r="12px" />
        </div>
      </div>
      <div className="sc-content">
        <div className="sc-grid-mobile">
          {[1, 2, 3, 4].map(k => (
            <div key={k} style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden' }}>
              <Skeleton h="160px" r="0" />
              <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Skeleton h="14px" w="80%" /><Skeleton h="14px" w="50%" />
              </div>
            </div>
          ))}
        </div>
        <div className="sc-grid-desktop">
          {[1, 2].map(k => (
            <div key={k} style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', display: 'flex' }}>
              <Skeleton w="45%" h="160px" r="0" />
              <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Skeleton h="16px" w="70%" /><Skeleton h="14px" w="40%" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── Not found ── */
  if (notFound) return (
    <div className="sc-notfound">
      <style>{STYLES}</style>
      <div style={{ fontSize: '5rem' }}>🔍</div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111', margin: 0 }}>Collection not found</h1>
      <p style={{ color: '#666', textAlign: 'center', margin: 0, maxWidth: '320px' }}>
        This link may be invalid or the collection was deleted.
      </p>
      <Link to="/auth" style={{
        marginTop: '1rem', padding: '0.85rem 2rem',
        background: '#E85C2C', color: '#fff', borderRadius: '99px',
        textDecoration: 'none', fontWeight: 800, fontSize: '1rem',
      }}>
        Create your own WishFlow
      </Link>
    </div>
  );

  /* ── Main ── */
  return (
    <div className="sc-page">
      <style>{STYLES}</style>

      {showSearch && <SearchOverlay items={items} onClose={() => setShowSearch(false)} />}

      {/* Header */}
      <header className="sc-header">
        <div className="sc-header-inner">
          <h1 className="sc-title">
            {collection.name}
            <ChevronDown size={18} style={{ opacity: 0.45, flexShrink: 0 }} strokeWidth={2.5} />
          </h1>

          {/* Stats — desktop only */}
          <div className="sc-stats-desktop">
            <div className="sc-stats-pill">
              <span className="sc-stats-items">{items.length} {items.length === 1 ? 'Item' : 'Items'}</span>
              {totalVal > 0 && <>
                <div className="sc-stats-divider" />
                <span className="sc-stats-price">{fmt(totalVal)}</span>
              </>}
            </div>
          </div>

          {/* Calendar icon */}
          {day !== null && (
            <div className="sc-calendar-wrapper">
              <div className="sc-calendar-inner">
                <div className="sc-calendar-top" />
                <div className="sc-calendar-bottom">
                  <span className="sc-calendar-day" data-day={day}>{day}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Stats pill — mobile only */}
      <div className="sc-stats-mobile">
        <div className="sc-stats-pill">
          <span className="sc-stats-items">{items.length} {items.length === 1 ? 'Item' : 'Items'}</span>
          {totalVal > 0 && <>
            <div className="sc-stats-divider" />
            <span className="sc-stats-price">{fmt(totalVal)}</span>
          </>}
        </div>
      </div>

      <div className="sc-content">
        {items.length === 0 ? (
          <div style={{
            margin: '1rem 1.25rem', padding: '3rem 1.5rem',
            background: '#fff', borderRadius: '20px', textAlign: 'center',
          }}>
            <Package size={48} color="#ddd" style={{ marginBottom: '1rem' }} />
            <h3 style={{ color: '#111', fontWeight: 800, margin: '0 0 0.5rem' }}>Empty Collection</h3>
            <p style={{ color: '#888', margin: 0 }}>No items have been added yet.</p>
          </div>
        ) : (
          <>
            {/* Mobile 2-col grid */}
            <div className="sc-grid-mobile">
              {items.map((item, i) => (
                <div key={item.id} style={{ animation: `sc-fadeup 0.4s ease ${i * 0.06}s both` }}>
                  <MobileItemCard item={item} />
                </div>
              ))}
            </div>

            {/* Desktop horizontal grid */}
            <div className="sc-grid-desktop">
              {items.map((item, i) => (
                <div key={item.id} style={{ animation: `sc-fadeup 0.4s ease ${i * 0.06}s both` }}>
                  <DesktopItemCard item={item} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* CTA Banner */}
        <div className="sc-cta">
          <div>
            <div className="sc-cta-powered">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1V13M1 7H13M2.5 2.5L11.5 11.5M11.5 2.5L2.5 11.5" stroke="#E85C2C" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Powered by WishFlow
            </div>
            <h2 className="sc-cta-title">Create your own<br />wishlist for free</h2>
            <p className="sc-cta-sub">Organize, track &amp; share your wishes<br />with friends &amp; family.</p>
          </div>
          <Link to="/auth" className="sc-cta-btn">
            Get Started Free <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="sc-bottom">
        <button id="sc-copy-link-btn" onClick={copyLink} className="sc-copy-btn">
          {copied ? <Check size={16} color="#22c55e" /> : <Link2 size={16} />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <button id="sc-search-btn" className="sc-search-btn" onClick={() => setShowSearch(true)} aria-label="Search items">
          <Search size={22} />
        </button>
      </div>
    </div>
  );
}
