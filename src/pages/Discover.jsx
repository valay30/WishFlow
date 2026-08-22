import { useState, useEffect, useMemo } from 'react';
import { db } from '../db';
import { Search, Package, Compass, Bookmark, X, Globe, Check } from 'lucide-react';

const ORANGE = 'var(--primary)';
const FONT = "'Inter', 'Segoe UI', sans-serif";

const CATEGORIES = [
    { id: 'all', label: '✨ All' },
    { id: 'tech', label: '💻 Tech' },
    { id: 'fashion', label: '👗 Fashion' },
    { id: 'home', label: '🏠 Home' },
    { id: 'beauty', label: '💄 Beauty' },
    { id: 'books', label: '📚 Books' },
    { id: 'fitness', label: '🏋️ Fitness' },
    { id: 'gifts', label: '🎁 Gifts' },
];

const CATEGORY_KEYWORDS = {
    tech: ['laptop', 'phone', 'iphone', 'samsung', 'macbook', 'airpod', 'headphone', 'earphone', 'cable', 'charger', 'camera', 'tablet', 'keyboard', 'mouse', 'monitor', 'gpu', 'ram', 'speaker', 'gadget', 'electronic', 'watch', 'smartwatch'],
    fashion: ['shirt', 'tshirt', 't-shirt', 'jeans', 'trouser', 'kurta', 'dress', 'saree', 'lehenga', 'jacket', 'hoodie', 'sneaker', 'shoe', 'sandal', 'bag', 'handbag', 'purse', 'wallet', 'belt', 'cap', 'hat', 'sunglasses', 'watch', 'jewellery', 'necklace', 'ring', 'earring', 'clothes', 'clothing', 'fashion', 'outfit', 'nike', 'adidas', 'puma', 'levi'],
    home: ['lamp', 'light', 'bulb', 'sofa', 'chair', 'table', 'desk', 'shelf', 'bed', 'mattress', 'pillow', 'curtain', 'rug', 'carpet', 'decor', 'decoration', 'plant', 'pot', 'kitchen', 'cookware', 'pan', 'pressure cooker', 'blender', 'mixer', 'air purifier', 'fan', 'heater', 'organizer', 'storage'],
    beauty: ['serum', 'moisturizer', 'sunscreen', 'lipstick', 'mascara', 'foundation', 'concealer', 'toner', 'cleanser', 'shampoo', 'conditioner', 'perfume', 'deodorant', 'lotion', 'cream', 'skincare', 'makeup', 'beauty', 'hair oil', 'face mask'],
    books: ['book', 'novel', 'textbook', 'fiction', 'non-fiction', 'biography', 'autobiography', 'self-help', 'comic', 'manga', 'kindle', 'reader'],
    fitness: ['protein', 'supplement', 'dumbbell', 'barbell', 'band', 'yoga mat', 'gym', 'fitness', 'treadmill', 'cycle', 'whey', 'creatine', 'pre-workout', 'bottle', 'shaker'],
};

function guessCategory(name) {
    const lower = (name || '').toLowerCase();
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(kw => lower.includes(kw))) return cat;
    }
    return 'gifts'; // fallback
}

function fmt(n) {
    if (!n || n <= 0) return null;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function getStoreName(link) {
    if (!link) return null;
    try {
        const host = new URL(link).hostname.replace('www.', '');
        if (host.includes('amazon')) return 'Amazon';
        if (host.includes('flipkart')) return 'Flipkart';
        if (host.includes('myntra')) return 'Myntra';
        if (host.includes('meesho')) return 'Meesho';
        if (host.includes('ajio')) return 'Ajio';
        if (host.includes('nykaa')) return 'Nykaa';
        if (host.includes('snapdeal')) return 'Snapdeal';
        return host.split('.')[0].charAt(0).toUpperCase() + host.split('.')[0].slice(1);
    } catch { return null; }
}

/* ── Product card for Discover feed ── */
function DiscoverCard({ item, onSave, isSaving, isSaved }) {
    const [hovered, setHovered] = useState(false);
    const price = fmt(item.price);
    const store = getStoreName(item.link);

    return (
        <div
            style={{
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
                height: '100%',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Image */}
            <div style={{ position: 'relative', aspectRatio: '4/3', background: 'var(--bg)', overflow: 'hidden' }}>
                {item.image
                    ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s ease', transform: hovered ? 'scale(1.05)' : 'scale(1)' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={40} color="var(--border)" /></div>
                }

                {/* Store badge */}
                {store && (
                    <div style={{
                        position: 'absolute', top: '0.6rem', left: '0.6rem',
                        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                        color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                        padding: '0.2rem 0.55rem', borderRadius: '99px',
                    }}>
                        {store}
                    </div>
                )}

                {/* Save button (hidden if item belongs to current user) */}
                {!item.is_mine && (
                    <button
                        id={`save-item-${item.id}`}
                        onClick={(e) => { e.stopPropagation(); onSave(item, isSaved); }}
                        disabled={isSaving}
                        style={{
                            position: 'absolute', top: '0.55rem', right: '0.55rem',
                            background: isSaved ? ORANGE : isSaving ? 'rgba(0,0,0,0.6)' : hovered ? ORANGE : 'rgba(0,0,0,0.45)',
                            backdropFilter: 'blur(6px)',
                            border: 'none', borderRadius: '50%',
                            width: '34px', height: '34px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: isSaving ? 'default' : 'pointer',
                            transition: 'background 0.2s ease, transform 0.15s ease',
                            transform: hovered && !isSaved ? 'scale(1.1)' : 'scale(1)',
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
            </div>

            {/* Details */}
            <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <p style={{
                    fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)',
                    margin: '0 0 0.25rem', lineHeight: 1.35,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                    {item.name}
                </p>

                <div style={{ marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.4rem' }}>
                        {price
                            ? <span style={{ fontWeight: 800, fontSize: '0.95rem', color: ORANGE }}>{price}</span>
                            : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No price</span>
                        }
                        {item.link && (
                            <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textDecoration: 'none', fontWeight: 600 }}
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
                            marginTop: '0.6rem', paddingTop: '0.6rem',
                            borderTop: '1px solid var(--border)',
                        }}>
                            <Globe size={11} color={ORANGE} />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 700 }}>
                                Shared by you
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Skeleton loader ── */
function SkeletonCard() {
    return (
        <div style={{ background: 'var(--surface)', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ aspectRatio: '4/3', background: 'linear-gradient(90deg, var(--border) 25%, var(--surface) 50%, var(--border) 75%)', backgroundSize: '200% 100%', animation: 'disc-shimmer 1.4s ease-in-out infinite' }} />
            <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ height: '14px', borderRadius: '6px', background: 'var(--border)', width: '90%', animation: 'disc-shimmer 1.4s ease-in-out infinite' }} />
                <div style={{ height: '14px', borderRadius: '6px', background: 'var(--border)', width: '65%', animation: 'disc-shimmer 1.4s ease-in-out infinite' }} />
                <div style={{ height: '12px', borderRadius: '6px', background: 'var(--border)', width: '40%', marginTop: '0.25rem', animation: 'disc-shimmer 1.4s ease-in-out infinite' }} />
            </div>
        </div>
    );
}

/* ══════════════════════════════════════
   DISCOVER PAGE
══════════════════════════════════════ */
export default function Discover() {
    const [feed, setFeed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQ, setSearchQ] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [myItems, setMyItems] = useState([]);
    const [savingItemId, setSavingItemId] = useState(null); // id of item currently saving
    const [showSavedToast, setShowSavedToast] = useState({ show: false, message: '' });
    const [saveError, setSaveError] = useState('');

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
            guessedCategory: guessCategory(item.name),
        }));
    }, [feed]);

    // Filter by search + category
    const filtered = useMemo(() => {
        let cards = allCards;
        if (activeCategory !== 'all') {
            cards = cards.filter(c => c.guessedCategory === activeCategory);
        }
        if (searchQ.trim()) {
            const q = searchQ.toLowerCase();
            cards = cards.filter(c => c.name?.toLowerCase().includes(q));
        }
        return cards;
    }, [allCards, activeCategory, searchQ]);

    const handleSave = async (item, isCurrentlySaved) => {
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
                @media (max-width: 480px) {
                    .discover-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 0.85rem;
                    }
                }
            `}</style>

            {/* ── Page Header ── */}
            <div style={{
                padding: '2rem 1.5rem 1.5rem',
                background: 'var(--surface)',
                borderBottom: '1px solid var(--border)',
                position: 'sticky', top: 0, zIndex: 10,
            }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: `rgba(var(--primary-rgb),0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Compass size={20} color={ORANGE} />
                        </div>
                        <div>
                            <h1 style={{ fontWeight: 900, fontSize: '1.4rem', color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>Discover</h1>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Browse public wishlists from the community</p>
                        </div>
                    </div>

                    {/* Search bar */}
                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
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
                                background: 'var(--bg)', color: 'var(--text)',
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

                    {/* Category filter pills */}
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem', scrollbarWidth: 'none' }}>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                style={{
                                    padding: '0.4rem 0.9rem',
                                    borderRadius: '99px',
                                    border: `1.5px solid ${activeCategory === cat.id ? ORANGE : 'var(--border)'}`,
                                    background: activeCategory === cat.id ? `rgba(var(--primary-rgb),0.1)` : 'var(--bg)',
                                    color: activeCategory === cat.id ? ORANGE : 'var(--text-dim)',
                                    fontWeight: activeCategory === cat.id ? 800 : 600,
                                    fontSize: '0.8rem', cursor: 'pointer',
                                    fontFamily: 'inherit', whiteSpace: 'nowrap',
                                    transition: 'all 0.2s',
                                    flexShrink: 0,
                                }}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
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
