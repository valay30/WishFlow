import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db, supabase } from '../db';
import { Search, X, Upload, ArrowRight, Sparkles, ShoppingBag, Crown } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useSettings } from '../context/SettingsContext';
import ProductCard from '../components/ProductCard';
import AddProductModal from '../components/AddProductModal';
import ItemCard from '../components/ItemCard';

const ORANGE = '#10367D';
const SURFACE = '#FFFFFF';
const SURFACE2 = '#F5F5F5';
const BORDER = '#D1D5DB';

/* ── Category emoji map ── */
const CAT_EMOJI = {
    electronics: '🖥️', tech: '💻', clothing: '👕', fashion: '👗',
    shoes: '👟', food: '🍔', grocery: '🛒', travel: '✈️',
    games: '🎮', gaming: '🎮', books: '📚', beauty: '💄',
    home: '🏠', furniture: '🪑', sports: '⚽', fitness: '💪',
    toys: '🧸', music: '🎵', health: '💊', default: '🏷️',
};
const getEmoji = (name = '') => {
    const key = name.toLowerCase();
    return Object.entries(CAT_EMOJI).find(([k]) => key.includes(k))?.[1] ?? CAT_EMOJI.default;
};

/* ══════════════════════════════════════
   HOME PAGE
══════════════════════════════════════ */
export default function Home() {
    const { user } = useAuth();
    const { viewMode } = useSettings();
    const [searchParams, setSearchParams] = useSearchParams();

    const showAddModal = searchParams.get('add') === 'true';
    const selectedCategory = searchParams.get('category') ? parseInt(searchParams.get('category')) : null;

    const [items, setItems] = useState([]);
    const [categories, setCats] = useState([]);
    const [search, setSearch] = useState('');
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    useEffect(() => {
        const load = async () => {
            setItems(await db.items.getAll());
            setCats(await db.categories.getAll());
        };
        load();
    }, []);

    const openModal = () => setSearchParams(p => { const n = new URLSearchParams(p); n.set('add', 'true'); return n; });
    const closeModal = () => setSearchParams(p => { const n = new URLSearchParams(p); n.delete('add'); return n; });

    const selectCat = (id) => {
        const n = new URLSearchParams(searchParams);
        if (id === null || id === selectedCategory) { n.delete('category'); } else { n.set('category', id); }
        n.delete('add');
        setSearchParams(n);
    };

    const handleAdd = async (data) => {
        // Bypass cache — directly query Supabase for the real count
        const { count, error: countError } = await supabase
            .from('items')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user?.id);

        if (!countError && count >= 5 && user?.isPremium !== true) {
            setShowPremiumModal(true);
            return false;
        }
        await db.items.add(data);
        setItems(await db.items.getAll());
        return true;
    };

    const handleUpgradeToPremium = async () => {
        try {
            const orderRes = await fetch('http://localhost:5000/api/payment/create-order', { method: 'POST' });
            const orderData = await orderRes.json();

            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "WishFlow",
                description: "Lifetime Premium Subscription",
                order_id: orderData.id,
                config: { display: { hide: [{ method: 'paylater' }] } },
                handler: async function (response) {
                    const verificationRes = await fetch('http://localhost:5000/api/payment/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            userId: user?.id
                        })
                    });
                    const verificationData = await verificationRes.json();
                    if (verificationData.success) {
                        alert('Payment Successful! Please re-login to activate your Premium features.');
                        setShowPremiumModal(false);
                        window.location.reload();
                    } else {
                        alert('Payment verification failed.');
                    }
                },
                theme: { color: "#10367D" }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                alert('Payment Failed. Please try again.');
            });
            rzp.open();
        } catch (error) {
            console.error(error);
            alert("Payment initiation failed. Please check your backend.");
        }
    };

    const filtered = items.filter(i => {
        if (i.is_purchased) return false;
        if (selectedCategory && i.category_id !== selectedCategory) return false;
        if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const firstName = user?.name?.split(' ')[0] || 'there';

    /* ── BUILD "ALL" + each category card ── */
    const allCat = { id: null, name: 'All Items' };
    const catCards = [allCat, ...categories];

    return (
        <>
            {/* ── Modal ── */}
            {showAddModal && <AddProductModal categories={categories} onAdd={handleAdd} onClose={closeModal} />}

            {/* ══════════ MOBILE: hero + sheet layout ══════════ */}
            <div className="d-mobile-layout">
                {/* ORANGE HERO */}
                <div className="home-hero">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>Hi there 👋</p>
                            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{firstName}'s WishFlow</h1>
                        </div>
                        {/* Avatar with tier indicator */}
                        <div
                            onClick={() => navigate('/profile')}
                            style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}
                        >
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                background: user?.isPremium
                                    ? 'linear-gradient(135deg, #d97706, #f59e0b)'
                                    : 'rgba(255,255,255,0.15)',
                                border: user?.isPremium
                                    ? '2.5px solid rgba(251,191,36,0.6)'
                                    : '2.5px solid rgba(255,255,255,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 900, fontSize: '1.1rem',
                                boxShadow: user?.isPremium ? '0 4px 16px rgba(217,119,6,0.5)' : 'none',
                                transition: 'all 0.2s',
                            }}>
                                {user?.name?.[0]?.toUpperCase() || '?'}
                            </div>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                        {[
                            { label: 'Items', val: items.filter(i => !i.is_purchased).length },
                            { label: 'Categories', val: categories.length },
                            { label: 'Total', val: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(items.filter(i => !i.is_purchased).reduce((s, i) => s + (i.price || 0), 0)) },
                        ].map(s => (
                            <div key={s.label} style={{ flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.15)', borderRadius: '14px', padding: '0.65rem 0.65rem' }}>
                                <p style={{ fontWeight: 900, fontSize: '1rem', color: '#fff', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.val}</p>
                                <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* DARK SHEET */}
                <div className="home-sheet">
                    {/* ── Category chips (horizontal scroll) ── */}
                    <div style={{
                        display: 'flex', gap: '0.5rem',
                        overflowX: 'auto', paddingBottom: '0.25rem',
                        marginBottom: '1.25rem',
                        scrollbarWidth: 'none', msOverflowStyle: 'none',
                    }}>
                        {catCards.map(cat => {
                            const isActive = cat.id === null ? selectedCategory === null : selectedCategory === cat.id;
                            return (
                                <button
                                    key={cat.id ?? 'all'}
                                    onClick={() => selectCat(cat.id)}
                                    style={{
                                        flexShrink: 0,
                                        padding: '0.45rem 1.1rem',
                                        borderRadius: '99px',
                                        border: isActive ? 'none' : `1.5px solid ${BORDER}`,
                                        background: isActive ? ORANGE : '#F5F5F5',
                                        color: isActive ? '#fff' : '#6B7280',
                                        fontWeight: isActive ? 800 : 600,
                                        fontSize: '0.88rem',
                                        fontFamily: 'inherit',
                                        cursor: 'pointer',
                                        transition: 'all 0.18s ease',
                                        whiteSpace: 'nowrap',
                                        boxShadow: isActive ? '0 2px 10px rgba(0,0,0,0.4)' : 'none',
                                    }}
                                >
                                    {cat.name}
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Search bar ── */}
                    <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                        <Search size={17} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#555', pointerEvents: 'none' }} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem', background: SURFACE, border: `1.5px solid ${BORDER}`, borderRadius: '99px', color: '#111', fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                            onFocus={e => e.target.style.borderColor = ORANGE}
                            onBlur={e => e.target.style.borderColor = BORDER}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* ── Items list ── */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                        <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#111' }}>
                            {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'All Items'}
                        </h2>
                        <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
                    </div>

                    {filtered.length > 0 ? (
                        <div className={viewMode === 'card' ? "category-grid" : "list-view-container"} style={viewMode === 'list' ? { display: 'flex', flexDirection: 'column', gap: '0.75rem' } : {}}>
                            {filtered.map(item => (
                                viewMode === 'card' ? (
                                    <ItemCard
                                        key={item.id}
                                        item={item}
                                        categoryName={categories.find(c => c.id === item.category_id)?.name || 'Other'}
                                    />
                                ) : (
                                    <ProductCard
                                        key={item.id}
                                        item={item}
                                        categoryName={categories.find(c => c.id === item.category_id)?.name || 'Other'}
                                    />
                                )
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
                            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${BORDER}` }}>
                                <ShoppingBag size={28} color={ORANGE} />
                            </div>
                            <p style={{ fontWeight: 700, color: '#111', fontSize: '1rem' }}>Nothing here yet!</p>
                            <p style={{ fontSize: '0.82rem', color: '#6B7280', maxWidth: '220px' }}>
                                {search ? 'No results found. Try a different search.' : 'Tap the + button to add your first item.'}
                            </p>
                            {!search && (
                                <button onClick={openModal} style={{ marginTop: '0.5rem', padding: '0.7rem 1.5rem', background: ORANGE, color: '#fff', border: 'none', borderRadius: '99px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(16,54,125,0.35)' }}>
                                    + Add First Item
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Upgrade Modal */}
            {showPremiumModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '24px', padding: '2.5rem',
                        maxWidth: '400px', width: '90%', textAlign: 'center',
                        boxShadow: '0 24px 48px rgba(0,0,0,0.2)', position: 'relative'
                    }}>
                        <button
                            onClick={() => setShowPremiumModal(false)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <X size={24} color="#666" />
                        </button>

                        <div style={{
                            width: '64px', height: '64px', background: 'linear-gradient(135deg, #10367D, #4963E8)',
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.5rem', color: '#fff'
                        }}>
                            <Crown size={32} />
                        </div>

                        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem', color: '#111' }}>Unlock Limitless</h2>
                        <p style={{ color: '#666', marginBottom: '2rem', lineHeight: '1.5' }}>
                            You have reached the free tier limit of 5 items. Upgrade to WishFlow Premium for ₹100 and add unlimited wishes forever!
                        </p>

                        <button
                            onClick={handleUpgradeToPremium}
                            style={{
                                width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #10367D, #4963E8)',
                                color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 800, fontSize: '1.1rem',
                                cursor: 'pointer', boxShadow: '0 8px 24px rgba(73,99,232,0.3)', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            Upgrade for ₹100
                        </button>

                        <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#999' }}>One-time payment. Lifetime access.</p>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(40px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                @media (min-width: 1024px) {
                    .home-hero { padding: 2.5rem 2.5rem 2rem; border-radius: 0 0 24px 24px; }
                    /* Keep overlay full-screen but center modal within content area */
                    .modal-backdrop {
                        padding-left: 260px !important;
                        align-items: center !important;
                        justify-content: center !important;
                    }
                    .modal-card {
                        border-radius: 24px !important;
                        border-bottom: 1px solid #2A2A2A !important;
                        box-shadow: 0 24px 60px rgba(0,0,0,0.8) !important;
                        max-height: 88vh !important;
                        width: 520px !important;
                    }
                }
                @media (min-width: 768px) {
                    .home-sheet { padding: 1.5rem 2rem 2rem; }
                }
            `}</style>
        </>
    );
}
