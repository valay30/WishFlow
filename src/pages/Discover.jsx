import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useIsland } from '../context/IslandContext';
import { db } from '../db';
import { Search, Package, Compass, Bookmark, X, Globe, Check, SlidersHorizontal } from 'lucide-react';
import AdUnit from '../components/AdUnit';

const ORANGE = 'var(--primary)';
const FONT = "'Inter', 'Segoe UI', sans-serif";

function fmt(n) {
    if (!n || n <= 0) return null;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

/* ── Standard Bento Card (portrait) ── */
function DiscoverCard({ item, onSave, isSaving, isSaved, isFeatured, index }) {
    const [hovered, setHovered] = useState(false);
    const price = fmt(item.price);

    if (isFeatured) {
        // Wide landscape feature card
        return (
            <div
                className="bento-feature-card"
                style={{
                    position: 'relative',
                    background: 'var(--surface)',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    border: `1.5px solid ${isSaved ? ORANGE : 'var(--border)'}`,
                    transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease, border-color 0.25s ease',
                    transform: hovered ? 'translateY(-5px) scale(1.01)' : 'translateY(0) scale(1)',
                    boxShadow: isSaved
                        ? `0 12px 40px rgba(var(--primary-rgb),0.25), inset 0 1px 0 rgba(255,255,255,0.1)`
                        : hovered ? '0 24px 56px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.08)' : '0 4px 20px rgba(0,0,0,0.06)',
                    display: 'flex',
                    flexDirection: 'row',
                    gridColumn: 'span 2',
                    minHeight: '200px',
                    animationDelay: `${(index % 5) * 60}ms`,
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {/* Left: Image */}
                <div style={{ position: 'relative', width: '42%', flexShrink: 0, overflow: 'hidden', borderRadius: '24px 0 0 24px' }}>
                    {item.image
                        ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)', transform: hovered ? 'scale(1.1)' : 'scale(1)' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}><Package size={48} color="var(--border)" /></div>
                    }
                    {/* Gradient right edge for blending */}
                    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '60px', background: 'linear-gradient(to right, transparent, var(--surface))', pointerEvents: 'none' }} />
                    {/* Feature badge */}

                </div>

                {/* Right: Details */}
                <div style={{ flex: 1, padding: '1.5rem 1.5rem 1.5rem 1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <p style={{
                            fontWeight: 900, fontSize: '1.5rem', color: 'var(--text)',
                            margin: 0, lineHeight: 1.25, letterSpacing: '-0.02em',
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>{item.name}</p>
                        {price && (
                            <p style={{ margin: 0, fontWeight: 800, fontSize: '1.4rem', color: ORANGE, letterSpacing: '-0.01em' }}>{price}</p>
                        )}
                        {item.is_mine && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Globe size={11} color="var(--text-muted)" />
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>Shared by you</span>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '1rem', flexWrap: 'nowrap' }}>
                        {item.link && (
                            <a
                                href={item.link} target="_blank" rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    padding: '0.75rem 1.6rem', borderRadius: '99px',
                                    background: ORANGE, color: '#fff',
                                    border: '1.5px solid transparent',
                                    fontSize: '0.82rem', fontWeight: 800, textDecoration: 'none',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                    boxShadow: '0 4px 14px rgba(var(--primary-rgb),0.35)',
                                    whiteSpace: 'nowrap',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(var(--primary-rgb),0.4)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(var(--primary-rgb),0.35)'; }}
                            >
                                View Product →
                            </a>
                        )}
                        {!item.is_mine && (
                            <button
                                id={`save-item-featured-${item.id}`}
                                onClick={(e) => { e.stopPropagation(); onSave(item, isSaved); }}
                                disabled={isSaving}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    padding: '0.75rem 1.4rem', borderRadius: '99px',
                                    background: isSaved ? 'rgba(var(--primary-rgb),0.1)' : 'var(--surface-2)',
                                    color: isSaved ? ORANGE : 'var(--text-muted)',
                                    border: `1.5px solid ${isSaved ? ORANGE : 'var(--border)'}`,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease', fontFamily: 'inherit',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {isSaving
                                    ? <div style={{ width: '16px', height: '16px', border: '2.5px solid var(--border)', borderTopColor: ORANGE, borderRadius: '50%', animation: 'disc-spin 0.7s linear infinite' }} />
                                    : isSaved ? <Check size={18} strokeWidth={3} /> : <Bookmark size={18} />
                                }
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Standard portrait card
    return (
        <div
            className="bento-card"
            style={{
                position: 'relative',
                background: 'var(--surface)',
                borderRadius: '20px',
                overflow: 'hidden',
                border: `1px solid ${isSaved ? ORANGE : 'var(--border)'}`,
                transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease, border-color 0.25s ease',
                transform: hovered ? 'translateY(-5px) scale(1.02)' : 'translateY(0) scale(1)',
                boxShadow: isSaved
                    ? `0 8px 24px rgba(var(--primary-rgb),0.2)`
                    : hovered ? '0 20px 48px rgba(0,0,0,0.13)' : '0 4px 16px rgba(0,0,0,0.04)',
                cursor: 'default',
                display: 'flex',
                flexDirection: 'column',
                aspectRatio: '3/4',
                animationDelay: `${(index % 5) * 60}ms`,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Background Image */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg)' }}>
                {item.image
                    ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)', transform: hovered ? 'scale(1.1)' : 'scale(1)' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={40} color="var(--border)" /></div>
                }
            </div>

            {/* Gradient overlay */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.88) 100%)',
                pointerEvents: 'none', zIndex: 1
            }} />

            {/* Save Button */}
            {!item.is_mine && (
                <button
                    id={`save-item-${item.id}`}
                    onClick={(e) => { e.stopPropagation(); onSave(item, isSaved); }}
                    disabled={isSaving}
                    style={{
                        position: 'absolute', top: '0.75rem', right: '0.75rem',
                        background: isSaved ? ORANGE : 'rgba(0,0,0,0.45)',
                        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                        border: `1px solid ${isSaved ? 'transparent' : 'rgba(255,255,255,0.2)'}`,
                        borderRadius: '50%', width: '36px', height: '36px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: isSaving ? 'default' : 'pointer',
                        transition: 'all 0.2s ease',
                        transform: hovered && !isSaved ? 'scale(1.12)' : 'scale(1)',
                        zIndex: 2,
                        boxShadow: isSaved ? '0 4px 12px rgba(var(--primary-rgb),0.4)' : 'none',
                    }}
                    title={isSaved ? 'Saved (click to unsave)' : 'Save to wishlist'}
                >
                    {isSaving
                        ? <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'disc-spin 0.7s linear infinite' }} />
                        : isSaved
                            ? <Check size={16} color="#fff" strokeWidth={3} />
                            : <Bookmark size={16} color="#fff" fill={hovered ? '#fff' : 'none'} />
                    }
                </button>
            )}

            {/* Bottom Content */}
            <div style={{
                position: 'relative', zIndex: 2, marginTop: 'auto',
                padding: '0.7rem 0.85rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.3rem'
            }}>
                <p style={{
                    fontWeight: 800, fontSize: '0.85rem', color: '#fff',
                    margin: 0, lineHeight: 1.3,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    textShadow: '0 2px 8px rgba(0,0,0,0.6)'
                }}>{item.name}</p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                    {price
                        ? <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.6)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{price}</span>
                        : <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', flex: 1 }}>No price</span>
                    }
                    {item.link && (
                        <a
                            href={item.link} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{
                                fontSize: '0.7rem', color: '#fff', textDecoration: 'none', fontWeight: 700,
                                background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
                                padding: '0.3rem 0.7rem', borderRadius: '99px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                transition: 'background 0.2s', flexShrink: 0, whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                        >View →</a>
                    )}
                </div>

                {item.is_mine && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                        <Globe size={11} color="rgba(255,255,255,0.85)" />
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>Shared by you</span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Skeleton loaders ── */
function SkeletonCard({ featured }) {
    return (
        <div style={{
            background: 'linear-gradient(90deg, var(--border) 25%, var(--surface) 50%, var(--border) 75%)',
            backgroundSize: '200% 100%', animation: 'disc-shimmer 1.4s ease-in-out infinite',
            borderRadius: '20px', overflow: 'hidden',
            gridColumn: featured ? 'span 2' : 'span 1',
            aspectRatio: featured ? '16/5' : '3/4',
        }}>
            {featured && (
                <div style={{ display: 'flex', height: '100%' }}>
                    <div style={{ width: '42%', background: 'rgba(0,0,0,0.05)' }} />
                    <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center' }}>
                        <div style={{ height: '20px', borderRadius: '8px', background: 'rgba(0,0,0,0.08)', width: '80%' }} />
                        <div style={{ height: '20px', borderRadius: '8px', background: 'rgba(0,0,0,0.08)', width: '55%' }} />
                        <div style={{ height: '16px', borderRadius: '8px', background: 'rgba(0,0,0,0.06)', width: '35%', marginTop: '0.5rem' }} />
                    </div>
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════
   DISCOVER PAGE
══════════════════════════════════════ */
export default function Discover() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showIsland } = useIsland();
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
    const [saveError, setSaveError] = useState('');

    // Dynamic Island Scroll State
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [forceExpand, setForceExpand] = useState(false);

    useEffect(() => {
        let rafId = null;
        // Hysteresis: collapse at >120px, expand only when back below 50px.
        // This dead zone prevents rapid toggling / page jerk when scrolling slowly.
        const COLLAPSE_AT = 120;
        const EXPAND_AT = 50;
        const handleScroll = () => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                const current = window.scrollY;
                setIsCollapsed(prev => {
                    if (!prev && current > COLLAPSE_AT) return true;  // expand → collapse
                    if (prev && current < EXPAND_AT) return false;    // collapse → expand
                    return prev; // no change in the dead zone
                });
                if (current < EXPAND_AT) setForceExpand(false);
            });
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []);

    const actuallyCollapsed = isCollapsed && !forceExpand;
    const islandRef = useRef(null);

    // Delayed content swap — let CSS transition start before swapping children
    // This prevents layout reflow mid-animation which causes lag on mobile
    const [displayCollapsed, setDisplayCollapsed] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setDisplayCollapsed(actuallyCollapsed), actuallyCollapsed ? 20 : 0);
        return () => clearTimeout(timer);
    }, [actuallyCollapsed]);

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
                    showIsland({
                        title: 'Item removed',
                        subtitle: 'Removed from your wishlist',
                        type: 'info',
                        duration: 3000
                    });
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
            showIsland({
                title: 'Saved!',
                subtitle: 'Added to your wishlist',
                type: 'success',
                duration: 3000
            });
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
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes disc-spin {
                    to { transform: rotate(360deg); }
                }
                /* ── Bento Box Grid ── */
                .discover-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1rem;
                }
                .bento-card {
                    animation: disc-fadeIn 0.45s ease both;
                }
                .bento-feature-card {
                    animation: disc-fadeIn 0.5s ease both;
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
                /* Tablet: 2 columns */
                @media (max-width: 768px) {
                    .discover-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 0.85rem;
                    }
                    .bento-feature-card {
                        flex-direction: column !important;
                        min-height: 280px !important;
                    }
                    .bento-feature-card > div:first-child {
                        width: 100% !important;
                        height: 160px;
                        border-radius: 24px 24px 0 0 !important;
                    }
                    .bento-feature-card > div:first-child > div:last-child {
                        /* hide right-edge gradient on mobile */
                        display: none;
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
                        borderRadius: '24px',
                        padding: actuallyCollapsed ? '0.55rem 1.2rem' : '1.25rem',
                        boxShadow: actuallyCollapsed
                            ? '0 4px 20px rgba(0,0,0,0.10)'
                            : '0 12px 40px rgba(0,0,0,0.12)',
                        width: '100%',
                        maxWidth: actuallyCollapsed ? '190px' : '900px',
                        maxHeight: actuallyCollapsed ? '50px' : '400px',
                        transition: [
                            'max-width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
                            'max-height 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
                            'padding 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                            'box-shadow 0.3s ease',
                        ].join(', '),
                        willChange: 'max-width, max-height',
                        overflow: 'hidden',
                        display: 'flex', flexDirection: 'column',
                        alignItems: actuallyCollapsed ? 'center' : 'stretch',
                    }}>
                    {displayCollapsed ? (
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
                        {/* Skeleton: every 5th slot is featured */}
                        {Array.from({ length: 9 }).map((_, i) => {
                            const pos = i + 1;
                            const featured = pos % 5 === 0;
                            return <SkeletonCard key={i} featured={featured} />;
                        })}
                    </div>
                ) : allCards.length === 0 ? (
                    /* Empty state */
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
                    /* No results */
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', animation: 'disc-fadeIn 0.5s ease both' }}>
                        <Search size={40} color="var(--border)" style={{ marginBottom: '1rem' }} />
                        <p style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '1rem' }}>No products match "{searchQ}"</p>
                        <button onClick={() => { setSearchQ(''); setActiveCategory('all'); }} style={{ marginTop: '1rem', background: 'none', border: 'none', color: ORANGE, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit' }}>
                            Clear filters
                        </button>
                    </div>
                ) : (
                    /* ── Bento Box Grid ── */
                    <div className="discover-grid">
                        {filtered.map((item, index) => {
                            const pos = index + 1;
                            // Every 5th item is a wide feature card
                            const isFeatured = pos % 5 === 0;
                            const isSaved = myItems.some(i => (i.link && i.link === item.link) || (!i.link && i.name === item.name));
                            return (
                                <DiscoverCard
                                    key={item.id}
                                    item={item}
                                    onSave={handleSave}
                                    isSaving={savingItemId === item.id}
                                    isSaved={isSaved}
                                    isFeatured={isFeatured}
                                    index={index}
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
        </div>
    );
}
