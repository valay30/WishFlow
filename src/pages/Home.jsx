import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db, supabase } from '../db';
import { Search, X, Upload, ArrowRight, Sparkles, ShoppingBag, Crown, Monitor, Shirt, Watch, Tag, Footprints } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useSettings } from '../context/SettingsContext';
import ProductCard from '../components/ProductCard';
import AddProductModal from '../components/AddProductModal';
import ItemCard from '../components/ItemCard';
import confetti from 'canvas-confetti';
import AlertModal from '../components/AlertModal';
import { API_URL } from '../config';

const ORANGE = 'var(--primary)';
const SURFACE = 'var(--surface)';
const SURFACE2 = 'var(--surface-2)';
const BORDER = 'var(--border)';

/* ── Category icon map ── */
const GetCategoryIcon = ({ name, size = 16, color, className }) => {
    const key = name.toLowerCase();
    if (key.includes('electronic') || key.includes('tech') || key.includes('computer')) return <Monitor size={size} color={color} className={className} />;
    if (key.includes('cloth') || key.includes('fashion') || key.includes('apparel')) return <Shirt size={size} color={color} className={className} />;
    if (key.includes('gadget') || key.includes('watch')) return <Watch size={size} color={color} className={className} />;
    if (key.includes('accessory') || key.includes('bag')) return <ShoppingBag size={size} color={color} className={className} />;
    if (key.includes('shoe') || key.includes('footwear')) return <Footprints size={size} color={color} className={className} />;
    return <Tag size={size} color={color} className={className} />;
};

/* ══════════════════════════════════════
   HOME PAGE
══════════════════════════════════════ */
export default function Home() {
    const { user } = useAuth();
    const { viewMode, currency } = useSettings();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const showAddModal = searchParams.get('add') === 'true';
    const selectedCategory = searchParams.get('category') ? parseInt(searchParams.get('category')) : null;

    const [items, setItems] = useState([]);
    const [categories, setCats] = useState([]);
    const [search, setSearch] = useState('');
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState({ isOpen: false, success: false, title: '', message: '' });

    useEffect(() => {
        const load = async () => {
            setItems(await db.items.getAll());
            setCats(await db.categories.getAll());
        };
        load();
    }, []);

    useEffect(() => {
        if (searchParams.get('celebrate') === 'true') {
            // A nice screen-wide confetti explosion (side cannons burst)
            const duration = 2 * 1000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 4,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0, y: 0.8 }
                });
                confetti({
                    particleCount: 4,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1, y: 0.8 }
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();

            // Clear celebrate query param so it doesn't fire again on refresh/back
            setSearchParams(p => {
                const n = new URLSearchParams(p);
                n.delete('celebrate');
                return n;
            }, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const openModal = async () => {
        if (user?.isPremium !== true) {
            const currentItems = items.length > 0 ? items : await db.items.getAll();
            if (currentItems.length >= 5) {
                setShowPremiumModal(true);
                return;
            }
        }
        setSearchParams(p => { const n = new URLSearchParams(p); n.set('add', 'true'); return n; });
    };
    const closeModal = () => setSearchParams(p => { const n = new URLSearchParams(p); n.delete('add'); return n; });

    useEffect(() => {
        const checkLimitOnAdd = async () => {
            if (showAddModal && user?.isPremium !== true) {
                const currentItems = items.length > 0 ? items : await db.items.getAll();
                if (currentItems.length >= 5) {
                    closeModal();
                    setShowPremiumModal(true);
                }
            }
        };
        checkLimitOnAdd();
    }, [showAddModal, items, user]);

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
            const orderRes = await fetch(`${API_URL}/api/payment/create-order`, { method: 'POST' });
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
                    const verificationRes = await fetch(`${API_URL}/api/payment/verify`, {
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
                        setPaymentStatus({
                            isOpen: true,
                            success: true,
                            title: 'wishflowlist.vercel.app says',
                            message: 'Payment Successful! Please relogin to activate your Premium features.'
                        });
                    } else {
                        setPaymentStatus({
                            isOpen: true,
                            success: false,
                            title: 'Payment Verification Failed',
                            message: 'We could not verify your payment. Please contact support.'
                        });
                    }
                },
                theme: { color: 'var(--primary)' },
                modal: {
                    ondismiss: function() {
                        document.body.style.overflow = '';
                        const rzpContainers = document.querySelectorAll('.razorpay-container');
                        rzpContainers.forEach(container => container.remove());
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                setPaymentStatus({
                    isOpen: true,
                    success: false,
                    title: 'Payment Failed',
                    message: 'Payment Failed. Please try again.'
                });
            });
            rzp.open();
        } catch (error) {
            console.error(error);
            setPaymentStatus({
                isOpen: true,
                success: false,
                title: 'Error',
                message: 'Payment initiation failed. Please check your backend.'
            });
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

    const isFreeLimitReached = user?.isPremium !== true && items.length >= 5;
    const shouldShowAddModal = showAddModal && !isFreeLimitReached;
    const shouldShowPremiumModal = showPremiumModal || (showAddModal && isFreeLimitReached);

    const handleClosePremiumModal = () => {
        setShowPremiumModal(false);
        if (showAddModal) closeModal();
    };

    return (
        <>
            {/* ── Modal ── */}
            {shouldShowAddModal && <AddProductModal categories={categories} onAdd={handleAdd} onClose={closeModal} />}

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
                            { label: 'Total', val: new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 0 }).format(items.filter(i => !i.is_purchased).reduce((s, i) => s + (i.price || 0), 0)) },
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
                        display: 'flex', gap: '0.65rem',
                        overflowX: 'auto', paddingBottom: '0.75rem',
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
                                        display: 'flex', alignItems: 'center', gap: '0.55rem',
                                        padding: '0.65rem 1.25rem',
                                        borderRadius: '99px',
                                        border: isActive ? 'none' : `1px solid rgba(0,0,0,0.04)`,
                                        background: isActive ? ORANGE : '#FFFFFF',
                                        color: isActive ? '#fff' : '#4B5563',
                                        fontWeight: 800,
                                        fontSize: '0.9rem',
                                        fontFamily: 'inherit',
                                        cursor: 'pointer',
                                        transition: 'all 0.18s ease',
                                        whiteSpace: 'nowrap',
                                        boxShadow: isActive ? '0 4px 14px rgba(var(--primary-rgb),0.4)' : '0 1px 4px rgba(0,0,0,0.03)',
                                    }}
                                >
                                    {cat.id !== null && <GetCategoryIcon name={cat.name} size={16} color={isActive ? '#fff' : ORANGE} />}
                                    {cat.name}
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Search bar ── */}
                    <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                        <Search size={17} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem', background: SURFACE, border: `1.5px solid ${BORDER}`, borderRadius: '99px', color: 'var(--text)', fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
                            onFocus={e => e.target.style.borderColor = ORANGE}
                            onBlur={e => e.target.style.borderColor = BORDER}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* ── Items list ── */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                        <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)' }}>
                            {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'All Items'}
                        </h2>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
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
                            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${BORDER}` }}>
                                <ShoppingBag size={28} color={ORANGE} />
                            </div>
                            <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1rem' }}>Nothing here yet!</p>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', maxWidth: '235px' }}>
                                {search ? 'No results found. Try a different search.' : 'Tap the + button to add your first item.'}
                            </p>
                            {!search && (
                                <button onClick={openModal} style={{ marginTop: '0.5rem', padding: '0.7rem 1.5rem', background: ORANGE, color: '#fff', border: 'none', borderRadius: '99px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(var(--primary-rgb),0.35)' }}>
                                    + Add First Item
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Upgrade Modal */}
            {shouldShowPremiumModal && createPortal(
                <div className="premium-modal-overlay" onClick={handleClosePremiumModal}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'var(--surface)', borderRadius: '24px', padding: '2.5rem',
                        maxWidth: '400px', width: '90%', textAlign: 'center',
                        boxShadow: '0 24px 48px rgba(0,0,0,0.2)', position: 'relative',
                        animation: 'slideUp 0.25s cubic-bezier(0.2,0.8,0.4,1)'
                    }}>
                        <button
                            onClick={handleClosePremiumModal}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <X size={24} color="#666" />
                        </button>

                        <div style={{
                            width: '64px', height: '64px', background: 'linear-gradient(135deg, var(--primary), var(--primary-dk))',
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.5rem', color: '#fff', boxShadow: '0 6px 20px rgba(var(--primary-rgb),0.3)'
                        }}>
                            <Crown size={32} />
                        </div>

                        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text)' }}>Unlock Limitless</h2>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '2rem', lineHeight: '1.5' }}>
                            You have reached the free tier limit of 5 items. Upgrade to WishFlow Premium for {new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 0 }).format(100)} and add unlimited wishes forever!
                        </p>

                        <button
                            onClick={handleUpgradeToPremium}
                            style={{
                                width: '100%', padding: '1rem', background: 'linear-gradient(135deg, var(--primary), var(--primary-dk))',
                                color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 800, fontSize: '1.1rem',
                                cursor: 'pointer', boxShadow: '0 8px 24px rgba(var(--primary-rgb),0.35)', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            Upgrade for {new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 0 }).format(100)}
                        </button>

                        <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>One-time payment. Lifetime access.</p>
                    </div>
                </div>,
                document.body
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(40px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                @media (min-width: 1024px) {
                    .home-hero { padding: 2.5rem 2.5rem 2rem; border-radius: 0 0 24px 24px; }
                }
                @media (min-width: 768px) {
                    .home-sheet { padding: 1.5rem 2rem 2rem; }
                }
            `}</style>

            <AlertModal
                isOpen={paymentStatus.isOpen}
                title={paymentStatus.title}
                message={paymentStatus.message}
                onConfirm={() => {
                    setPaymentStatus({ ...paymentStatus, isOpen: false });
                    if (paymentStatus.success) {
                        setShowPremiumModal(false);
                        window.location.reload();
                    }
                }}
            />
        </>
    );
}
