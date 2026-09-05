import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { db } from '../db';
import { Search, Package, Compass, Bookmark, X, Globe, Check, SlidersHorizontal } from 'lucide-react';
import AdUnit from '../components/AdUnit';

const ORANGE = 'var(--primary)';
const FONT = "'Inter', 'Segoe UI', sans-serif";

function fmt(n) {
    if (!n || n <= 0) return null;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

/* ── Immersive Full-Bleed Product card for Discover feed ── */
function DiscoverCard({ item, onSave, isSaving, isSaved }) {
    const [hovered, setHovered] = useState(false);
    const price = fmt(item.price);

    return (
        <div
            style={{
                position: 'relative',
                background: 'var(--surface)',
                borderRadius: '20px',
                overflow: 'hidden',
                border: `1px solid ${isSaved ? ORANGE : 'var(--border)'}`,
                transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: isSaved
                    ? `0 8px 24px rgba(var(--primary-rgb),0.2)`
                    : hovered ? '0 16px 40px rgba(var(--primary-rgb),0.12)' : '0 4px 16px rgba(0,0,0,0.04)',
                cursor: 'default',
                display: 'flex',
                flexDirection: 'column',
                aspectRatio: '3/4', // Tall immersive layout
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Background Image */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg)' }}>
                {item.image
                    ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease', transform: hovered ? 'scale(1.08)' : 'scale(1)' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={40} color="var(--border)" /></div>
                }
            </div>

            {/* Gradient Overlay for Text Readability */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.85) 100%)',
                pointerEvents: 'none',
                zIndex: 1
            }} />

            {/* Save Button Overlay (Top Right) */}
            {!item.is_mine && (
                <button
                    id={`save-item-${item.id}`}
                    onClick={(e) => { e.stopPropagation(); onSave(item, isSaved); }}
                    disabled={isSaving}
                    style={{
                        position: 'absolute', top: '0.75rem', right: '0.75rem',
                        background: isSaved ? ORANGE : isSaving ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%',
                        width: '36px', height: '36px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: isSaving ? 'default' : 'pointer',
                        transition: 'background 0.2s ease, transform 0.15s ease',
                        transform: hovered && !isSaved ? 'scale(1.1)' : 'scale(1)',
                        zIndex: 2,
                    }}
                    title={isSaved ? 'Saved to wishlist (click to unsave)' : 'Save to my wishlist'}
                >
                    {isSaving
                        ? <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'disc-spin 0.7s linear infinite' }} />
                        : isSaved
                            ? <Check size={16} color="#fff" strokeWidth={3} />
                            : <Bookmark size={16} color="#fff" fill={hovered ? '#fff' : 'none'} />
                    }
                </button>
            )}

            {/* Content (Bottom aligned) */}
            <div style={{ 
                position: 'relative', zIndex: 2, marginTop: 'auto', 
                padding: '1.25rem 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' 
            }}>
                <p style={{
                    fontWeight: 800, fontSize: '0.95rem', color: '#ffffff',
                    margin: 0, lineHeight: 1.35,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    textShadow: '0 2px 8px rgba(0,0,0,0.5)'
                }}>
                    {item.name}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.2rem' }}>
                    {price
                        ? <span style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{price}</span>
                        : <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>No price</span>
                    }
                    {item.link && (
                        <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ 
                                fontSize: '0.72rem', color: '#ffffff', textDecoration: 'none', fontWeight: 700,
                                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                                padding: '0.35rem 0.85rem', borderRadius: '99px',
                                border: '1px solid rgba(255,255,255,0.15)',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                            onClick={e => e.stopPropagation()}
                        >
                            View →
                        </a>
                    )}
                </div>

                {/* Shared by you badge */}
                {item.is_mine && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        marginTop: '0.5rem', paddingTop: '0.6rem',
                        borderTop: '1px solid rgba(255,255,255,0.15)',
                    }}>
                        <Globe size={11} color="rgba(255,255,255,0.9)" />
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>
                            Shared by you
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Immersive Skeleton loader ── */
function SkeletonCard() {
    return (
        <div style={{ position: 'relative', aspectRatio: '3/4', background: 'linear-gradient(90deg, var(--border) 25%, var(--surface) 50%, var(--border) 75%)', backgroundSize: '200% 100%', animation: 'disc-shimmer 1.4s ease-in-out infinite', borderRadius: '20px', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ height: '16px', borderRadius: '6px', background: 'rgba(0,0,0,0.1)', width: '90%' }} />
                <div style={{ height: '16px', borderRadius: '6px', background: 'rgba(0,0,0,0.1)', width: '65%' }} />
                <div style={{ height: '14px', borderRadius: '6px', background: 'rgba(0,0,0,0.1)', width: '40%', marginTop: '0.25rem' }} />
            </div>
        </div>
    );
}

/* ══════════════════════════════════════
   DISCOVER PAGE
══════════════════════════════════════ */
export default function Discover() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [feed, setFeed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQ, setSearchQ] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [activeSort, setActiveSort] = useState('trending');
    const [activeStore, setActiveStore] = useState('all');
    const [activeBudget, setActiveBudget] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [myItems, setMyItems] = useState([]);
    const [savingItemId, setSavingItemId] = useState(null); // id of item currently saving
    const [showSavedToast, setShowSavedToast] = useState({ show: false, message: '' });
    const [saveError, setSaveError] = useState('');

    // Dynamic Island Scroll State
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [forceExpand, setForceExpand] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const current = window.scrollY;
            if (current > 80) {
                setIsCollapsed(true);
            } else {
                setIsCollapsed(false);
                setForceExpand(false);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const actuallyCollapsed = isCollapsed && !forceExpand;
    const islandRef = useRef(null);

    // Click outside to collapse
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (forceExpand && islandRef.current && !islandRef.current.contains(event.target)) {
                setForceExpand(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        }
    }, [forceExpand]);

    useEffect(() => {
        Promise.all([
            db.discover.getPublicFeed(),
            db.items.getAll()
        ]).then(([feedData, myItemsData]) => {
            setFeed(feedData || []);
            setMyItems(myItemsData || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    // Feed is a flat list of public items
    const allCards = useMemo(() => {
        return feed.map(item => ({
            ...item,
        }));
    }, [feed]);

    // Filter by search + category + advanced filters + sorting
    const filtered = useMemo(() => {
        let cards = [...allCards];

        if (searchQ.trim()) {
            const q = searchQ.toLowerCase();
            cards = cards.filter(c => c.name?.toLowerCase().includes(q));
        }

        if (activeBudget !== 'all') {
            cards = cards.filter(c => {
                if (!c.price) return false;
                if (activeBudget === 'under500') return c.price < 500;
                if (activeBudget === '500to2000') return c.price >= 500 && c.price <= 2000;
                if (activeBudget === '2000to5000') return c.price > 2000 && c.price <= 5000;
                if (activeBudget === 'above5000') return c.price > 5000;
                return true;
            });
        }

        // Sort
        if (activeSort === 'trending') {
            cards.sort((a, b) => (b.saveCount || 1) - (a.saveCount || 1));
        } else if (activeSort === 'newest') {
            cards.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else if (activeSort === 'priceAsc') {
            cards.sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (activeSort === 'priceDesc') {
            cards.sort((a, b) => (b.price || 0) - (a.price || 0));
        }

        return cards;
    }, [allCards, activeCategory, searchQ, activeStore, activeBudget, activeSort]);

    const handleSave = async (item, isCurrentlySaved) => {
        if (!user) {
            navigate('/auth', { state: { message: '🔒 Please login / signup to save items' } });
            return;
        }

        if (savingItemId === item.id) return;
        setSavingItemId(item.id);
        setSaveError('');

        if (isCurrentlySaved) {
            // Find the personal item matching the link/name
            const match = myItems.find(i => (i.link && i.link === item.link) || (!i.link && i.name === item.name));
            if (match) {
                try {
                    await db.items.delete(match.id);
                    setMyItems(prev => prev.filter(i => i.id !== match.id));
                    setShowSavedToast({ show: true, message: 'Removed from wishlist' });
                    setTimeout(() => setShowSavedToast({ show: false, message: '' }), 3000);
                } catch (e) {
                    setSaveError('Failed to remove item');
                    setTimeout(() => setSaveError(''), 3000);
                }
            }
            setSavingItemId(null);
            return;
        }

        const result = await db.discover.saveItem(item);
        setSavingItemId(null);
        if (result.success) {
            setMyItems(prev => [result.item, ...prev]);
            setShowSavedToast({ show: true, message: 'Saved to your wishlist!' });
            setTimeout(() => {
                setShowSavedToast({ show: false, message: '' });
            }, 3000);
        } else {
            setSaveError(result.error || 'Failed to save');
            setTimeout(() => setSaveError(''), 3000);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 'calc(var(--bottom-nav) + 1rem)', fontFamily: FONT }}>
            <style>{`
                @keyframes disc-shimmer {
                    0%   { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                @keyframes disc-fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes disc-spin {
                    to { transform: rotate(360deg); }
                }
                .discover-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 1.25rem;
                }
                .pill-scroll {
                    display: flex;
                    gap: 0.5rem;
                    overflow-x: auto;
                    padding-bottom: 0.5rem;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                .pill-scroll::-webkit-scrollbar {
                    display: none;
                }
                @media (max-width: 480px) {
                    .discover-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 0.85rem;
                    }
                }
            `}</style>

            {/* ── Page Header (Static) ── */}
            <div style={{
                padding: '2rem 1.5rem 0.5rem',
                background: 'var(--bg)', 
            }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: `rgba(var(--primary-rgb),0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Compass size={20} color={ORANGE} />
                        </div>
                        <div>
                            <h1 style={{ fontWeight: 900, fontSize: '1.4rem', color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>Discover</h1>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Browse public wishlists</p>
                        </div>
                    </div>
                    <Link
                        to="/blog"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            background: `rgba(var(--primary-rgb),0.1)`, color: ORANGE, textDecoration: 'none',
                            fontWeight: 700, fontSize: '0.85rem', padding: '0.5rem 1rem', borderRadius: '999px',
                            border: `1px solid rgba(var(--primary-rgb),0.2)`, whiteSpace: 'nowrap',
                            transition: 'background 0.2s, transform 0.15s', fontFamily: FONT,
                        }}
                    >
                        📝 Blog
                    </Link>
                </div>
            </div>

            {/* ── Dynamic Floating Island ── */}
            <div 
                ref={islandRef}
                style={{
                    position: 'sticky', top: '1rem', zIndex: 50,
                    display: 'flex', justifyContent: 'center',
                    padding: '0 1rem', pointerEvents: 'none',
                    marginBottom: '1rem', marginTop: '0.5rem'
                }}
            >
                <div 
                    onClick={() => { if (actuallyCollapsed) setForceExpand(true); }}
                    style={{
                    cursor: actuallyCollapsed ? 'pointer' : 'default',
                    pointerEvents: 'auto',
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0,0,0, 0.08)',
                    borderRadius: '24px', // Fixed radius to prevent 'egg' shape during animation
                    padding: actuallyCollapsed ? '0.6rem 1.25rem' : '1.25rem',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                    width: '100%',
                    maxWidth: actuallyCollapsed ? '200px' : '900px',
                    maxHeight: actuallyCollapsed ? '46px' : '350px',
                    transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                    alignItems: actuallyCollapsed ? 'center' : 'stretch',
                }}>
                    {actuallyCollapsed ? (
                        // Collapsed State
                        <div 
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'disc-fadeIn 0.2s ease both' }}
                        >
                            <Search size={16} color="var(--text-dim)" />
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dim)' }}>
                                {searchQ ? `Search: ${searchQ}` : 'Discover...'}
                            </span>
                        </div>
                    ) : (
                        // Expanded State
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'disc-fadeIn 0.3s ease both' }}>
                            {/* Search bar */}
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Search size={17} color="var(--text-dim)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                <input
                                    id="discover-search"
                                    value={searchQ}
                                    onChange={e => setSearchQ(e.target.value)}
                                    placeholder="Search products…"
                                    style={{
                                        width: '100%', boxSizing: 'border-box',
                                        padding: '0.75rem 2.75rem 0.75rem 2.75rem',
                                        borderRadius: '14px', border: '1.5px solid var(--border)',
                                        background: 'rgba(0,0,0,0.03)', color: 'var(--text)',
                                        fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none',
                                        transition: 'border-color 0.2s',
                                    }}
                                    onFocus={e => e.target.style.borderColor = ORANGE}
                                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                />
                                {searchQ && (
                                    <button
                                        onClick={() => setSearchQ('')}
                                        style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', display: 'flex' }}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Horizontal Pill Filters */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                {/* Sort Row */}
                                <div className="pill-scroll">
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', alignSelf: 'center', marginRight: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sort</span>
                                    {[
                                        { id: 'trending', label: '🌟 Trending' },
                                        { id: 'newest', label: '🕒 Newest' },
                                        { id: 'priceAsc', label: '💵 Low to High' },
                                        { id: 'priceDesc', label: '💎 High to Low' },
                                    ].map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => setActiveSort(s.id)}
                                            style={{
                                                padding: '0.4rem 0.9rem', borderRadius: '99px', flexShrink: 0,
                                                border: `1px solid ${activeSort === s.id ? ORANGE : 'var(--border)'}`,
                                                background: activeSort === s.id ? ORANGE : 'var(--surface)',
                                                color: activeSort === s.id ? '#fff' : 'var(--text-dim)',
                                                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                                                transition: 'all 0.2s', fontFamily: 'inherit'
                                            }}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Budget Row */}
                                <div className="pill-scroll">
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', alignSelf: 'center', marginRight: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Budget</span>
                                    {[
                                        { id: 'all', label: 'Any' },
                                        { id: 'under500', label: 'Under ₹500' },
                                        { id: '500to2000', label: '₹500 - ₹2,000' },
                                        { id: '2000to5000', label: '₹2,000 - ₹5,000' },
                                        { id: 'above5000', label: '₹5,000+' },
                                    ].map(b => (
                                        <button
                                            key={b.id}
                                            onClick={() => setActiveBudget(b.id)}
                                            style={{
                                                padding: '0.4rem 0.9rem', borderRadius: '99px', flexShrink: 0,
                                                border: `1px solid ${activeBudget === b.id ? ORANGE : 'var(--border)'}`,
                                                background: activeBudget === b.id ? ORANGE : 'var(--surface)',
                                                color: activeBudget === b.id ? '#fff' : 'var(--text-dim)',
                                                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                                                transition: 'all 0.2s', fontFamily: 'inherit'
                                            }}
                                        >
                                            {b.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Feed Content ── */}
            <div style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem' }}>
                {loading ? (
                    <div className="discover-grid">
                        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : allCards.length === 0 ? (
                    /* Empty state — no public collections yet */
                    <div style={{ textAlign: 'center', padding: '5rem 1rem', animation: 'disc-fadeIn 0.5s ease both' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `rgba(var(--primary-rgb),0.08)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                            <Globe size={36} color={ORANGE} strokeWidth={1.5} />
                        </div>
                        <h2 style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--text)', margin: '0 0 0.5rem' }}>Nothing here yet</h2>
                        <p style={{ color: 'var(--text-muted)', maxWidth: '320px', margin: '0 auto', lineHeight: 1.6, fontSize: '0.95rem' }}>
                            Be the first to share! Tap the globe icon on any item in your wishlist to share it on Discover.
                        </p>
                    </div>
                ) : filtered.length === 0 ? (
                    /* No results for current search/filter */
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', animation: 'disc-fadeIn 0.5s ease both' }}>
                        <Search size={40} color="var(--border)" style={{ marginBottom: '1rem' }} />
                        <p style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '1rem' }}>No products match "{searchQ}"</p>
                        <button onClick={() => { setSearchQ(''); setActiveCategory('all'); }} style={{ marginTop: '1rem', background: 'none', border: 'none', color: ORANGE, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit' }}>
                            Clear filters
                        </button>
                    </div>
                ) : (
                    <div className="discover-grid" style={{ animation: 'disc-fadeIn 0.4s ease both' }}>
                        {filtered.map(item => {
                            const isSaved = myItems.some(i => (i.link && i.link === item.link) || (!i.link && i.name === item.name));
                            return (
                                <DiscoverCard
                                    key={item.id}
                                    item={item}
                                    onSave={handleSave}
                                    isSaving={savingItemId === item.id}
                                    isSaved={isSaved}
                                />
                            );
                        })}
                    </div>
                )}

                {/* Item count */}
                {!loading && filtered.length > 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2rem' }}>
                        {filtered.length} product{filtered.length !== 1 ? 's' : ''} shared by the community
                    </p>
                )}

                {/* Ad Banner */}
                {!loading && filtered.length > 0 && (
                    <div style={{ maxWidth: '728px', margin: '1.5rem auto 0' }}>
                        <AdUnit
                            slot="1916178864"
                            format="auto"
                            style={{ minHeight: '90px', borderRadius: '14px' }}
                        />
                    </div>
                )}
            </div>

            {/* ── Error Toast ── */}
            {saveError && (
                <div style={{
                    position: 'fixed', bottom: 'calc(var(--bottom-nav) + 1rem)', left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#ef4444', borderRadius: '99px', padding: '0.65rem 1.25rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    boxShadow: '0 8px 24px rgba(239,68,68,0.3)',
                    animation: 'disc-fadeIn 0.3s ease both',
                    zIndex: 9998, whiteSpace: 'nowrap',
                }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>⚠️ {saveError}</span>
                </div>
            )}

            {/* ── Saved Toast ── */}
            {showSavedToast.show && (
                <div style={{
                    position: 'fixed', bottom: 'calc(var(--bottom-nav) + 1rem)', left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: '99px', padding: '0.65rem 1.25rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    animation: 'disc-fadeIn 0.3s ease both',
                    zIndex: 9998, whiteSpace: 'nowrap',
                }}>
                    <Bookmark size={16} color={ORANGE} fill={ORANGE} />
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>{showSavedToast.message}</span>
                </div>
            )}
        </div>
    );
}
