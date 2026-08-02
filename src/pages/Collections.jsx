import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import { Plus, FolderHeart, Calendar, Package, ChevronRight, ArrowLeft, Pencil, Crown, X } from 'lucide-react';
import CollectionModal from '../components/CollectionModal';
import ItemCard from '../components/ItemCard';
import AddExistingItemsModal from '../components/AddExistingItemsModal';
import AddProductModal from '../components/AddProductModal';
import AlertModal from '../components/AlertModal';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/useAuth';
import { API_URL } from '../config';

const ORANGE = 'var(--primary)';
const SURFACE = 'var(--surface)';
const BORDER = 'var(--border)';
const BG = 'var(--bg)';

/* ── Days remaining until a target date ── */
function daysUntil(dateStr) {
    if (!dateStr) return null;
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/* ── Format currency ── */
const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

/* ══════════════════════════════════════
   COLLECTIONS PAGE
   Supports grid overview & item drill-down
══════════════════════════════════════ */
export default function Collections() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { viewMode } = useSettings();

    const [collections, setCollections] = useState([]);
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [collectionItems, setCollectionItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingCollection, setEditingCollection] = useState(null);
    const [showAddExistingModal, setShowAddExistingModal] = useState(false);
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState({ isOpen: false, success: false, title: '', message: '' });

    // Drill-down state
    const [activeCollection, setActiveCollection] = useState(null);

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
                theme: { color: 'var(--primary)' }
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

    // Scroll to top when page mounts or active collection drill-down changes
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, [activeCollection]);

    useEffect(() => {
        const load = async () => {
            const [cols, its, cats, citems] = await Promise.all([
                db.collections.getAll().catch(() => []),
                db.items.getAll().catch(() => []),
                db.categories.getAll().catch(() => []),
                db.collectionItems.getAll().catch(() => []),
            ]);
            setCollections(cols || []);
            setItems(its || []);
            setCategories(cats || []);
            setCollectionItems(citems || []);
            setLoading(false);
        };
        load();
    }, []);

    const reload = async () => {
        const [cols, its, citems] = await Promise.all([
            db.collections.getAll().catch(() => []),
            db.items.getAll().catch(() => []),
            db.collectionItems.getAll().catch(() => [])
        ]);
        setCollections(cols || []);
        setItems(its || []);
        setCollectionItems(citems || []);
    };

    const handleSave = async (data) => {
        if (editingCollection) {
            await db.collections.update(editingCollection.id, data);
        } else {
            await db.collections.add(data);
        }
        await reload();
        setEditingCollection(null);
    };

    const handleDelete = async (id) => {
        await db.collections.delete(id);
        await reload();
        if (activeCollection?.id === id) setActiveCollection(null);
    };

    const openEdit = (col, e) => {
        e.stopPropagation();
        setEditingCollection(col);
        setShowModal(true);
    };

    const openCreate = () => {
        setEditingCollection(null);
        setShowModal(true);
    };

    const categoryName = (catId) => categories.find(c => c.id === catId)?.name || 'Uncategorized';

    // Items for the active collection drill-down
    const activeItemIds = activeCollection
        ? collectionItems.filter(ci => ci.collection_id === activeCollection.id).map(ci => ci.item_id)
        : [];
    const activeItems = items.filter(i => activeItemIds.includes(i.id));

    /* ── Loading ── */
    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <FolderHeart size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p>Loading collections...</p>
                </div>
            </div>
        );
    }

    /* ── Drill-down: items inside a collection ── */
    if (activeCollection) {
        return (
            <div style={{ minHeight: '100vh', background: BG, padding: '0 0 var(--bottom-nav)' }}>
                {/* Header */}
                <div style={{
                    background: `linear-gradient(135deg, var(--primary) 0%, var(--primary-dk) 100%)`,
                    padding: '2rem 1.5rem 2.5rem',
                    position: 'relative',
                }}>
                    <button onClick={() => setActiveCollection(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '12px', padding: '0.5rem 1rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem' }}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '3rem' }}>{activeCollection.emoji}</span>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>{activeCollection.name}</h1>
                            <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                                {activeItems.length} item{activeItems.length !== 1 ? 's' : ''} · {fmt(activeItems.reduce((s, i) => s + (i.price || 0), 0))} total
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setShowAddExistingModal(true)} style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '14px', padding: '0.65rem 1rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Package size={16} /> Add Existing
                            </button>
                            <button onClick={async () => {
                                if (user?.isPremium !== true) {
                                    const currentItems = items.length > 0 ? items : await db.items.getAll();
                                    if (currentItems.length >= 5) {
                                        setShowPremiumModal(true);
                                        return;
                                    }
                                }
                                setShowAddProductModal(true);
                            }} style={{ background: 'var(--surface)', color: ORANGE, border: 'none', borderRadius: '14px', padding: '0.65rem 1rem', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                <Plus size={16} /> New Item
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    style={{ padding: '1.5rem', minHeight: '300px', transition: 'background 0.2s', borderRadius: '24px' }}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.05)';
                        e.dataTransfer.dropEffect = 'copy';
                    }}
                    onDragLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                    }}
                    onDrop={async (e) => {
                        e.preventDefault();
                        e.currentTarget.style.background = 'transparent';
                        try {
                            const data = e.dataTransfer.getData('application/json');
                            if (data) {
                                const item = JSON.parse(data);
                                if (item && item.id && !activeItemIds.includes(item.id)) {
                                    await db.collectionItems.add(activeCollection.id, item.id);
                                    await reload();
                                }
                            }
                        } catch (err) {
                            console.error("Drop failed", err);
                        }
                    }}
                >
                    {activeItems.length === 0 ? (
                        <div style={{ background: SURFACE, borderRadius: '24px', padding: '3rem 2rem', textAlign: 'center', border: `1px solid ${BORDER}` }}>
                            <Package size={48} color="var(--border)" style={{ marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>No items in this collection yet.</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Add items and assign them to this collection.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
                            {activeItems.map(item => (
                                <ItemCard
                                    key={item.id}
                                    item={item}
                                    categoryName={categoryName(item.category_id)}
                                    onRemove={async () => {
                                        await db.collectionItems.remove(activeCollection.id, item.id);
                                        await reload();
                                    }}
                                    onTogglePurchased={async (id, val) => {
                                        await db.items.update(id, { is_purchased: val });
                                        await reload();
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {showAddExistingModal && (
                    <AddExistingItemsModal
                        allItems={items.filter(i => !activeItemIds.includes(i.id))}
                        activeCollectionId={activeCollection.id}
                        onAddItems={async (itemIds) => {
                            for (let id of itemIds) {
                                await db.collectionItems.add(activeCollection.id, id);
                            }
                            await reload();
                        }}
                        onClose={() => setShowAddExistingModal(false)}
                    />
                )}

                {showAddProductModal && !(user?.isPremium !== true && items.length >= 5) && (
                    <AddProductModal
                        categories={categories}
                        onAdd={async (itemData) => {
                            await db.items.add(itemData, activeCollection.id);
                            await reload();
                        }}
                        onClose={() => setShowAddProductModal(false)}
                    />
                )}

                {showPremiumModal && createPortal(
                    <div className="premium-modal-overlay" onClick={() => setShowPremiumModal(false)}>
                        <div onClick={e => e.stopPropagation()} style={{
                            background: 'var(--surface)', borderRadius: '24px', padding: '2.5rem',
                            maxWidth: '400px', width: '90%', textAlign: 'center',
                            boxShadow: '0 24px 48px rgba(0,0,0,0.2)', position: 'relative',
                            animation: 'slideUp 0.25s cubic-bezier(0.2,0.8,0.4,1)'
                        }}>
                            <button
                                onClick={() => setShowPremiumModal(false)}
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
                                You have reached the free tier limit of 5 items. Upgrade to WishFlow Premium for ₹100 and add unlimited wishes forever!
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
                                Upgrade for ₹100
                            </button>

                            <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>One-time payment. Lifetime access.</p>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        );
    }

    /* ── Main Collections grid ── */
    return (
        <div style={{ minHeight: '100vh', background: BG, padding: '0 0 var(--bottom-nav)' }}>

            {/* Page Header */}
            <div style={{
                background: `linear-gradient(160deg, color-mix(in srgb, var(--primary) 40%, #000) 0%, color-mix(in srgb, var(--primary) 70%, #000) 55%, var(--primary) 100%)`,
                padding: '2.5rem 1.5rem 4rem',
                position: 'relative',
                color: '#fff'
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                        color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: '0.85rem',
                        cursor: 'pointer', fontFamily: 'inherit',
                        padding: '0.5rem 1rem', borderRadius: '99px',
                        marginBottom: '1.5rem', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                >
                    <ArrowLeft size={16} /> Back
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '20px',
                        background: 'rgba(255,255,255,0.15)',
                        border: '2px solid rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                    }}>
                        <FolderHeart size={32} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: '#fff' }}>My Collections</h1>
                        <p style={{ margin: '0.2rem 0 0', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.9rem' }}>
                            Group your wishes by occasion or event
                        </p>
                    </div>
                </div>
            </div>

            {/* Collections Grid */}
            <div style={{
                background: BG,
                borderRadius: '32px 32px 0 0',
                marginTop: '-2rem',
                padding: '2rem 1.5rem',
                position: 'relative',
                zIndex: 2,
                minHeight: '60vh'
            }}>
                <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                    {collections.length === 0 ? (
                        /* Empty state */
                        <div style={{
                            background: SURFACE, borderRadius: '28px', padding: '3.5rem 2rem',
                            textAlign: 'center', border: `1px solid ${BORDER}`,
                            boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
                            animation: 'fadeInUp 0.4s ease-out',
                        }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎁</div>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.5rem' }}>No collections yet</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
                                Create your first collection for occasions like<br />
                                "Birthday 2026", "Diwali Shopping", or "Dream Setup".
                            </p>
                            <button
                                onClick={openCreate}
                                style={{
                                    background: ORANGE, color: '#fff', border: 'none',
                                    borderRadius: '14px', padding: '0.85rem 2rem',
                                    fontWeight: 800, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit',
                                    boxShadow: '0 4px 16px rgba(var(--primary-rgb),0.35)',
                                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                }}
                            >
                                <Plus size={18} /> Create First Collection
                            </button>
                        </div>
                    ) : (
                        <div
                            className={viewMode === 'card' ? "category-grid" : ""}
                            style={viewMode === 'card'
                                ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1.25rem' }
                                : { display: 'flex', flexDirection: 'column', gap: '1rem' }
                            }
                        >
                            {collections.map((col, i) => {
                                const colItemIds = collectionItems.filter(ci => ci.collection_id === col.id).map(ci => ci.item_id);
                                const colItems = items.filter(it => colItemIds.includes(it.id));
                                const totalValue = colItems.reduce((s, it) => s + (it.price || 0), 0);
                                const days = daysUntil(col.target_date);
                                const isExpired = days !== null && days < 0;
                                const isSoon = days !== null && days >= 0 && days <= 7;
                                const itemImages = colItems.map(it => it.image).filter(Boolean).slice(0, 3);

                                if (viewMode === 'card') {
                                    return (
                                        <div
                                            key={col.id}
                                            onClick={() => setActiveCollection(col)}
                                            style={{
                                                background: SURFACE, borderRadius: '28px',
                                                border: `1.5px solid ${BORDER}`, cursor: 'pointer',
                                                padding: '1.75rem 1.25rem 1.5rem',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                                                gap: '0.85rem', position: 'relative',
                                                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                                animation: `fadeInUp 0.4s ease-out ${i * 0.06}s backwards`,
                                                minHeight: '250px', justifyContent: 'space-between'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.borderColor = ORANGE;
                                                e.currentTarget.style.transform = 'translateY(-4px)';
                                                e.currentTarget.style.boxShadow = '0 12px 32px rgba(var(--primary-rgb),0.14)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.borderColor = BORDER;
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
                                            }}
                                        >
                                            {/* Edit Button */}
                                            <button
                                                onClick={e => openEdit(col, e)}
                                                style={{
                                                    position: 'absolute', top: '0.85rem', right: '0.85rem',
                                                    width: '32px', height: '32px', borderRadius: '10px',
                                                    background: 'var(--primary-lt)', border: 'none',
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', color: ORANGE, transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = ORANGE; e.currentTarget.style.color = '#fff'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(var(--primary-rgb),0.06)'; e.currentTarget.style.color = ORANGE; }}
                                            >
                                                <Pencil size={14} />
                                            </button>

                                            {/* Top Section: Emoji & Name */}
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem', width: '100%', marginTop: '0.25rem' }}>
                                                <div style={{
                                                    width: '64px', height: '64px', borderRadius: '22px',
                                                    background: 'linear-gradient(135deg, var(--primary-lt) 0%, rgba(var(--primary-rgb),0.02) 100%)',
                                                    border: '1px solid var(--primary-lt)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '2.2rem', flexShrink: 0,
                                                    boxShadow: '0 4px 14px rgba(var(--primary-rgb),0.06)'
                                                }}>
                                                    {col.emoji}
                                                </div>

                                                <div style={{ width: '100%' }}>
                                                    <h3 style={{ fontWeight: 900, fontSize: '1.15rem', color: 'var(--text)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {col.name}
                                                    </h3>

                                                    {days !== null && (
                                                        <div style={{ marginTop: '0.35rem' }}>
                                                            <span style={{
                                                                fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.65rem',
                                                                borderRadius: '99px', display: 'inline-block',
                                                                background: isExpired ? 'rgba(239,68,68,0.12)' : isSoon ? 'rgba(245,158,11,0.15)' : 'var(--primary-lt)',
                                                                color: isExpired ? '#ef4444' : isSoon ? '#d97706' : ORANGE,
                                                            }}>
                                                                {isExpired ? 'Passed' : days === 0 ? 'Today!' : `${days} days left`}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bottom Stats Badge & Thumbnails */}
                                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {itemImages.length > 0 && (
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {itemImages.map((img, idx) => (
                                                            <img
                                                                key={idx}
                                                                src={img}
                                                                alt=""
                                                                style={{
                                                                    width: '26px', height: '26px', borderRadius: '50%',
                                                                    objectFit: 'cover', border: '2px solid #fff',
                                                                    marginLeft: idx > 0 ? '-8px' : 0,
                                                                    boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                )}

                                                <div style={{
                                                    background: 'var(--primary-lt)',
                                                    border: '1px solid rgba(var(--primary-rgb),0.08)',
                                                    borderRadius: '16px',
                                                    padding: '0.65rem 0.85rem',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    width: '100%', boxSizing: 'border-box'
                                                }}>
                                                    <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 700 }}>
                                                        {colItems.length} {colItems.length === 1 ? 'item' : 'items'}
                                                    </span>
                                                    <span style={{ fontSize: '0.9rem', color: ORANGE, fontWeight: 900 }}>
                                                        {colItems.length > 0 ? fmt(totalValue) : '₹0'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={col.id}
                                        onClick={() => setActiveCollection(col)}
                                        style={{
                                            background: SURFACE, borderRadius: '24px',
                                            border: `1.5px solid ${BORDER}`, cursor: 'pointer',
                                            padding: '1.25rem 1.5rem',
                                            display: 'flex', alignItems: 'center', gap: '1rem',
                                            transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                                            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                            animation: `fadeInUp 0.4s ease-out ${i * 0.06}s backwards`,
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.borderColor = ORANGE;
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 8px 28px rgba(var(--primary-rgb),0.12)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.borderColor = BORDER;
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)';
                                        }}
                                    >
                                        {/* Emoji */}
                                        <div style={{
                                            width: '56px', height: '56px', borderRadius: '18px',
                                            background: 'var(--primary-lt)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.8rem', flexShrink: 0,
                                        }}>
                                            {col.emoji}
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {col.name}
                                                </h3>
                                                {days !== null && (
                                                    <span style={{
                                                        fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.55rem',
                                                        borderRadius: '99px', flexShrink: 0,
                                                        background: isExpired ? 'rgba(239,68,68,0.1)' : isSoon ? 'rgba(245,158,11,0.12)' : 'var(--primary-lt)',
                                                        color: isExpired ? '#ef4444' : isSoon ? '#d97706' : ORANGE,
                                                    }}>
                                                        {isExpired ? 'Passed' : days === 0 ? 'Today!' : `${days}d left`}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                    {colItems.length} item{colItems.length !== 1 ? 's' : ''}
                                                </span>
                                                {colItems.length > 0 && (
                                                    <span style={{ fontSize: '0.8rem', color: ORANGE, fontWeight: 700 }}>
                                                        {fmt(totalValue)}
                                                    </span>
                                                )}
                                                {col.target_date && (
                                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                        <Calendar size={12} />
                                                        {new Date(col.target_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Edit + Arrow */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                                            <button
                                                onClick={e => openEdit(col, e)}
                                                style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(var(--primary-rgb),0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ORANGE }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-lt)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'var(--primary-lt)'}
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <ChevronRight size={20} color="#C4C4C4" />
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Add collection button */}
                            <div
                                onClick={openCreate}
                                style={viewMode === 'card' ? {
                                    background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
                                    border: '2px dashed #94A3B8',
                                    borderRadius: '28px',
                                    padding: '1.75rem 1.25rem',
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    gap: '0.85rem', cursor: 'pointer',
                                    transition: 'all 0.25s ease',
                                    minHeight: '250px', boxSizing: 'border-box'
                                } : {
                                    width: '100%', padding: '1rem', background: 'transparent',
                                    border: `2px dashed ${BORDER}`, borderRadius: '24px',
                                    color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
                                    fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = ORANGE;
                                    if (viewMode === 'card') {
                                        e.currentTarget.style.background = 'rgba(var(--primary-rgb),0.04)';
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                    } else {
                                        e.currentTarget.style.color = ORANGE;
                                    }
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = viewMode === 'card' ? '#94A3B8' : BORDER;
                                    if (viewMode === 'card') {
                                        e.currentTarget.style.background = 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    } else {
                                        e.currentTarget.style.color = '#888';
                                    }
                                }}
                            >
                                {viewMode === 'card' ? (
                                    <>
                                        <div style={{
                                            width: '56px', height: '56px', borderRadius: '50%',
                                            background: ORANGE,
                                            color: '#fff', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', boxShadow: '0 4px 16px rgba(var(--primary-rgb),0.4)'
                                        }}>
                                            <Plus size={26} strokeWidth={2.5} />
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <span style={{ display: 'block', fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>Add Collection</span>
                                            <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748B', fontWeight: 600, marginTop: '0.2rem' }}>Create a new group</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Plus size={18} /> Add Collection
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <CollectionModal
                    existing={editingCollection}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onClose={() => { setShowModal(false); setEditingCollection(null); }}
                />
            )}

            {showPremiumModal && createPortal(
                <div className="premium-modal-overlay" onClick={() => setShowPremiumModal(false)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'var(--surface)', borderRadius: '24px', padding: '2.5rem',
                        maxWidth: '400px', width: '90%', textAlign: 'center',
                        boxShadow: '0 24px 48px rgba(0,0,0,0.2)', position: 'relative',
                        animation: 'slideUp 0.25s cubic-bezier(0.2,0.8,0.4,1)'
                    }}>
                        <button
                            onClick={() => setShowPremiumModal(false)}
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
                            You have reached the free tier limit of 5 items. Upgrade to WishFlow Premium for ₹100 and add unlimited wishes forever!
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
                            Upgrade for ₹100
                        </button>

                        <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>One-time payment. Lifetime access.</p>
                    </div>
                </div>,
                document.body
            )}

            <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>
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
        </div>
    );
}
