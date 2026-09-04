import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../db';
import { Plus, FolderHeart, Calendar, Package, ChevronRight, ArrowLeft, Pencil, Crown, X, Share2, Check, Copy } from 'lucide-react';
import CollectionModal from '../components/CollectionModal';
import ItemCard from '../components/ItemCard';
import ProductCard from '../components/ProductCard';
import AddExistingItemsModal from '../components/AddExistingItemsModal';
import AddProductModal from '../components/AddProductModal';
import AlertModal from '../components/AlertModal';
import { useSettings } from '../context/SettingsContext';
import { useIsland } from '../context/IslandContext';
import { useAuth } from '../context/useAuth';
import { API_URL } from '../config';
import { loadRazorpay } from '../utils/loadRazorpay';

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
    const location = useLocation();
    const { user, isPremium } = useAuth();
    const { viewMode, currency } = useSettings();

    const fmt = (n) => new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 0 }).format(n);

    const [collections, setCollections] = useState([]);
    const [sharedCollections, setSharedCollections] = useState([]);
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [collectionItems, setCollectionItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('my'); // 'my' | 'shared'

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.get('tab') === 'shared') {
            setActiveTab('shared');
        }
    }, [location.search]);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingCollection, setEditingCollection] = useState(null);
    const [showAddExistingModal, setShowAddExistingModal] = useState(false);
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [showPremiumShareModal, setShowPremiumShareModal] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState({ isOpen: false, success: false, title: '', message: '' });

    // Drill-down state
    const [activeCollection, setActiveCollection] = useState(null);
    const [showUsernameShareModal, setShowUsernameShareModal] = useState(false);
    const [shareUsername, setShareUsername] = useState('');
    const [isSharingUsername, setIsSharingUsername] = useState(false);

    // Access Management State
    const [accessList, setAccessList] = useState([]);
    const [isLoadingAccess, setIsLoadingAccess] = useState(false);
    const [removeShareConfirm, setRemoveShareConfirm] = useState({ isOpen: false, shareId: null });

    // Share a collection via Web Share API or clipboard fallback
    const handleShare = async (col) => {
        const url = `${window.location.origin}/shared/collection/${col.id}`;
        const shareData = {
            title: `${col.emoji} ${col.name} — WishFlow`,
            text: `Check out my wishlist collection: ${col.name}`,
            url,
        };
        if (navigator.share) {
            try { await navigator.share(shareData); return; } catch { /* user cancelled */ return; }
        }
        try {
            await navigator.clipboard.writeText(url);
            showIsland({ title: 'Link Copied', subtitle: 'Copied to clipboard!', type: 'success' });
        } catch {
            showIsland({ title: 'Error', subtitle: 'Could not copy link', type: 'error' });
        }
    };

    // Copy collection link directly to clipboard
    const handleCopyLink = async (col) => {
        const targetCol = col || activeCollection;
        if (!targetCol) return;
        const url = `${window.location.origin}/shared/collection/${targetCol.id}`;
        try {
            await navigator.clipboard.writeText(url);
            showIsland({ title: 'Link Copied', subtitle: 'Copied to clipboard!', type: 'success' });
        } catch {
            showIsland({ title: 'Error', subtitle: 'Could not copy link', type: 'error' });
        }
    };

    const handleUsernameShare = async () => {
        if (!shareUsername.trim()) return;
        setIsSharingUsername(true);
        const res = await db.shared.sendShareRequest(activeCollection.id, shareUsername.trim());
        setIsSharingUsername(false);
        if (res.success) {
            setShowUsernameShareModal(false);
            setShareUsername('');
            showIsland({ title: 'Invite Sent', subtitle: 'Share request sent successfully!', type: 'success' });
        } else {
            showIsland({ title: 'Error', subtitle: res.error, type: 'error' });
        }
    };

    const handleRemoveShare = (shareId) => {
        setRemoveShareConfirm({ isOpen: true, shareId });
    };

    const loadAccessList = async () => {
        if (!activeCollection) return;
        setIsLoadingAccess(true);
        const shares = await db.shared.getCollectionShares(activeCollection.id);
        setAccessList(shares);
        setIsLoadingAccess(false);
    };

    const openShareModal = () => {
        if (user?.isPremium !== true) {
            setShowPremiumShareModal(true);
            return;
        }
        loadAccessList();
        setShowUsernameShareModal(true);
    };

    const handleUpgradeToPremium = async () => {
        try {
            const loaded = await loadRazorpay();
            if (!loaded) throw new Error('Failed to load Razorpay SDK');

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
                            title: 'WishFlow says',
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
                    ondismiss: function () {
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

    // Scroll to top when page mounts or active collection drill-down changes
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, [activeCollection]);

    useEffect(() => {
        const load = async () => {
            const [cols, its, cats, citems, shared] = await Promise.all([
                db.collections.getAll().catch(() => []),
                db.items.getAll().catch(() => []),
                db.categories.getAll().catch(() => []),
                db.collectionItems.getAll().catch(() => []),
                db.shared.getSharedWithMe().catch(() => []),
            ]);
            setCollections(cols || []);
            setItems(its || []);
            setCategories(cats || []);
            setCollectionItems(citems || []);
            setSharedCollections(shared || []);
            setLoading(false);
        };
        load();
    }, []);

    const { showIsland } = useIsland();

    const reload = async () => {
        const [cols, its, citems, shared] = await Promise.all([
            db.collections.getAll().catch(() => []),
            db.items.getAll().catch(() => []),
            db.collectionItems.getAll().catch(() => []),
            db.shared.getSharedWithMe().catch(() => [])
        ]);
        setCollections(cols || []);
        setItems(its || []);
        setCollectionItems(citems || []);
        setSharedCollections(shared || []);
    };

    const handleSave = async (data) => {
        if (editingCollection) {
            await db.collections.update(editingCollection.id, data);
            showIsland({ title: 'Collection Updated', type: 'success' });
        } else {
            await db.collections.add(data);
            showIsland({ title: 'Collection Created', type: 'success' });
        }
        await reload();
        setEditingCollection(null);
    };

    const handleDelete = async (id) => {
        await db.collections.delete(id);
        showIsland({ title: 'Collection Deleted', type: 'success' });
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
                    <button onClick={() => setActiveCollection(null)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: '99px', padding: '0.5rem 1.25rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem', width: 'max-content' }}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <style>
                        {`
                        @media (max-width: 768px) {
                            .drill-down-header { flex-direction: column !important; text-align: center !important; justify-content: center !important; gap: 0.5rem !important; }
                            .drill-down-text { min-width: 100% !important; }
                            .drill-down-actions { justify-content: center !important; width: 100% !important; margin-top: 0.5rem; flex-direction: row !important; }
                            .drill-down-actions > button:nth-child(1),
                            .drill-down-actions > button:nth-child(2) { flex: 1 1 calc(50% - 0.5rem); justify-content: center; padding: 0.75rem 0.5rem !important; }
                            .drill-down-actions > button:nth-child(3) { flex: 1 1 100%; justify-content: center; padding: 0.85rem 1rem !important; margin-top: 0.25rem; }
                        }
                        `}
                    </style>
                    <div className="drill-down-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '3.5rem', lineHeight: 1 }}>{activeCollection.emoji}</span>
                        <div className="drill-down-text" style={{ flex: 1, minWidth: '200px' }}>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>{activeCollection.name}</h1>
                            <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                                {activeItems.length} item{activeItems.length !== 1 ? 's' : ''} · {fmt(activeItems.reduce((s, i) => s + (i.price || 0), 0))} total
                            </p>
                        </div>
                        <div className="drill-down-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>

                            <button
                                id="invite-friend-btn"
                                onClick={openShareModal}
                                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '14px', padding: '0.65rem 1rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                            >
                                <FolderHeart size={15} /> Invite Friend
                            </button>
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
                            }} style={{ background: 'var(--surface)', color: '#f97316', border: 'none', borderRadius: '14px', padding: '0.65rem 1rem', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
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
                        <div className={viewMode === 'card' ? "category-grid" : "list-view-container"} style={viewMode === 'list' ? { display: 'flex', flexDirection: 'column', gap: '0.75rem' } : {}}>
                            {activeItems.map(item => (
                                viewMode === 'card' ? (
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
                                ) : (
                                    <ProductCard
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
                                )
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
                        onAdd={(itemData) => {
                            // Optimistic UI updates
                            const tempItem = { ...itemData, id: 'temp_' + Date.now(), created_at: new Date().toISOString() };
                            setItems(prev => [tempItem, ...prev]);
                            setCollectionItems(prev => [...prev, { collection_id: activeCollection.id, item_id: tempItem.id }]);

                            // Background save
                            db.items.add(itemData, activeCollection.id).then(() => {
                                reload();
                            });
                            return true;
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

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(217,119,6,0.1)', color: '#d97706', marginBottom: '1rem', flexShrink: 0, margin: '0 auto 1.5rem' }}>
                                <Crown size={32} />
                            </div>

                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text)' }}>Unlock Limitless Collections</h2>
                            <p style={{ color: 'var(--text-dim)', marginBottom: '2rem', lineHeight: '1.5' }}>
                                You have reached the free tier limit of 5 items. Upgrade to WishFlow Premium for {fmt(100)} and add unlimited wishes forever!
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

                {showPremiumShareModal && createPortal(
                    <div className="premium-modal-overlay" onClick={() => setShowPremiumShareModal(false)}>
                        <div onClick={e => e.stopPropagation()} style={{
                            background: 'var(--surface)', borderRadius: '24px', padding: '2.5rem',
                            maxWidth: '400px', width: '90%', textAlign: 'center',
                            boxShadow: '0 24px 48px rgba(0,0,0,0.2)', position: 'relative',
                            animation: 'slideUp 0.25s cubic-bezier(0.2,0.8,0.4,1)'
                        }}>
                            <button
                                onClick={() => setShowPremiumShareModal(false)}
                                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <X size={24} color="#666" />
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(217,119,6,0.1)', color: '#d97706', marginBottom: '1rem', flexShrink: 0, margin: '0 auto 1.5rem' }}>
                                <Share2 size={32} />
                            </div>

                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text)' }}>Unlock Sharing</h2>
                            <p style={{ color: 'var(--text-dim)', marginBottom: '2rem', lineHeight: '1.5' }}>
                                Sharing collections with friends and family is a Premium feature. Upgrade to WishFlow Premium for {fmt(100)} and share your wishlist!
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

                {/* ── Username Share Modal ── */}
                {showUsernameShareModal && (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 99999,
                        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                    }} onClick={() => setShowUsernameShareModal(false)}>
                        <div style={{
                            background: BG, borderRadius: '24px', padding: '2rem',
                            width: '100%', maxWidth: '400px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
                            position: 'relative', maxHeight: '85vh', display: 'flex', flexDirection: 'column'
                        }} onClick={e => e.stopPropagation()}>
                            <button onClick={() => setShowUsernameShareModal(false)} style={{
                                position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent',
                                border: 'none', color: 'var(--text-dim)', cursor: 'pointer'
                            }}>
                                <X size={20} />
                            </button>
                            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', color: 'var(--text)', flexShrink: 0 }}>Invite Friend</h2>
                            <p style={{ margin: '0 0 1.25rem', fontSize: '0.9rem', color: 'var(--text-muted)', flexShrink: 0 }}>Enter their username to share this wishlist.</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', flexShrink: 0 }}>
                                <input
                                    autoFocus
                                    placeholder="username"
                                    value={shareUsername}
                                    onChange={e => setShareUsername(e.target.value)}
                                    style={{
                                        width: '100%', boxSizing: 'border-box',
                                        padding: '0.75rem 1rem', borderRadius: '12px',
                                        border: `1px solid ${BORDER}`, background: SURFACE, color: 'var(--text)',
                                        fontSize: '0.95rem', outline: 'none'
                                    }}
                                />
                                <button
                                    onClick={handleUsernameShare}
                                    disabled={isSharingUsername || !shareUsername.trim()}
                                    style={{
                                        width: '100%', padding: '0.75rem 1.25rem', borderRadius: '12px', border: 'none',
                                        background: ORANGE, color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                                        cursor: isSharingUsername || !shareUsername.trim() ? 'not-allowed' : 'pointer',
                                        opacity: isSharingUsername || !shareUsername.trim() ? 0.6 : 1, transition: 'all 0.2s',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {isSharingUsername ? '...' : 'Send'}
                                </button>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.25rem' }}>
                                <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shared With</h3>
                                {isLoadingAccess ? (
                                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0', fontSize: '0.85rem' }}>Loading...</p>
                                ) : accessList.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0', fontSize: '0.85rem' }}>Not shared with anyone yet.</p>
                                ) : (
                                    accessList.map(share => (
                                        <div key={share.id} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '0.75rem', background: SURFACE, borderRadius: '12px', border: `1px solid ${BORDER}`
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: ORANGE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                    {share.profiles?.username?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>@{share.profiles?.username || 'unknown'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        {new Date(share.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{
                                                    fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '6px',
                                                    background: share.status === 'accepted' ? 'rgba(34,197,94,0.1)' : share.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                                                    color: share.status === 'accepted' ? '#22c55e' : share.status === 'pending' ? '#f59e0b' : '#ef4444'
                                                }}>
                                                    {share.status.charAt(0).toUpperCase() + share.status.slice(1)}
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveShare(share.id)}
                                                    style={{
                                                        background: 'transparent', border: 'none', color: 'var(--text-muted)',
                                                        cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                    title="Remove Access"
                                                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexShrink: 0 }}>
                                <button
                                    id="copy-collection-link-btn"
                                    onClick={() => handleCopyLink(activeCollection)}
                                    style={{
                                        flex: 1, padding: '0.85rem 0.5rem', borderRadius: '12px',
                                        border: shareToast === 'copied' ? '1px solid #22c55e' : `1px solid ${BORDER}`,
                                        background: shareToast === 'copied' ? 'rgba(34,197,94,0.1)' : 'var(--surface-2)',
                                        color: shareToast === 'copied' ? '#22c55e' : 'var(--text)',
                                        fontWeight: 600, fontSize: '0.9rem',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
                                        transition: 'all 0.2s', whiteSpace: 'nowrap'
                                    }}
                                    onMouseEnter={e => {
                                        if (shareToast !== 'copied') e.currentTarget.style.background = 'var(--border)';
                                    }}
                                    onMouseLeave={e => {
                                        if (shareToast !== 'copied') e.currentTarget.style.background = 'var(--surface-2)';
                                    }}
                                >
                                    {shareToast === 'copied' ? (
                                        <>
                                            <Check size={16} /> Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={16} /> Copy Link
                                        </>
                                    )}
                                </button>
                                <button
                                    id="share-collection-link-btn"
                                    onClick={() => handleShare(activeCollection)}
                                    style={{
                                        flex: 1, padding: '0.85rem 0.5rem', borderRadius: '12px', border: `1px solid ${BORDER}`,
                                        background: 'var(--surface-2)', color: 'var(--text)', fontWeight: 600, fontSize: '0.9rem',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
                                        transition: 'all 0.2s', whiteSpace: 'nowrap'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
                                >
                                    <Share2 size={16} /> Share via Link
                                </button>
                            </div>

                        </div>
                    </div>
                )}


                <AlertModal
                    isOpen={removeShareConfirm.isOpen}
                    title="Remove Access"
                    message="Are you sure you want to remove this user's access to your collection?"
                    onConfirm={async () => {
                        const shareId = removeShareConfirm.shareId;
                        setRemoveShareConfirm({ isOpen: false, shareId: null });
                        const success = await db.shared.removeShare(shareId);
                        if (success) {
                            setAccessList(prev => prev.filter(s => s.id !== shareId));
                        } else {
                            alert('Failed to remove access.');
                        }
                    }}
                    onCancel={() => setRemoveShareConfirm({ isOpen: false, shareId: null })}
                    isDestructive={true}
                />
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

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                    <button
                        onClick={() => setActiveTab('my')}
                        style={{
                            flex: 1, padding: '0.75rem', borderRadius: '14px', border: 'none',
                            background: activeTab === 'my' ? 'rgba(255,255,255,0.2)' : 'transparent',
                            color: activeTab === 'my' ? '#fff' : 'rgba(255,255,255,0.6)',
                            fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
                            fontFamily: 'inherit'
                        }}
                    >
                        My Collections
                    </button>
                    <button
                        onClick={() => setActiveTab('shared')}
                        style={{
                            flex: 1, padding: '0.75rem', borderRadius: '14px', border: 'none',
                            background: activeTab === 'shared' ? 'rgba(255,255,255,0.2)' : 'transparent',
                            color: activeTab === 'shared' ? '#fff' : 'rgba(255,255,255,0.6)',
                            fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
                            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                        }}
                    >
                        Shared with Me
                        {sharedCollections.filter(s => s.status === 'pending').length > 0 && (
                            <span style={{
                                background: '#ef4444', color: '#fff', borderRadius: '99px',
                                padding: '0.1rem 0.4rem', fontSize: '0.75rem', fontWeight: 800
                            }}>
                                {sharedCollections.filter(s => s.status === 'pending').length}
                            </span>
                        )}
                    </button>
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
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                            Loading...
                        </div>
                    ) : activeTab === 'shared' ? (
                        <div style={{ display: 'grid', gap: '1rem', paddingBottom: '3rem' }}>
                            {sharedCollections.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                    <FolderHeart size={48} color="var(--border)" style={{ marginBottom: '1rem' }} />
                                    <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text)', fontSize: '1.2rem', fontWeight: 800 }}>Nothing shared yet</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>When friends share wishlists with your username, they will appear here.</p>
                                </div>
                            ) : (
                                sharedCollections.map(share => {
                                    const col = share.collections;
                                    if (!col) return null;
                                    const isPending = share.status === 'pending';

                                    return (
                                        <div key={share.id}
                                            onClick={() => {
                                                if (share.status === 'accepted') navigate(`/shared/collection/${col.id}`);
                                            }}
                                            style={{
                                                background: SURFACE,
                                                borderRadius: '24px',
                                                padding: '1.25rem',
                                                border: `1px solid ${isPending ? ORANGE : BORDER}`,
                                                boxShadow: isPending ? '0 8px 24px rgba(var(--primary-rgb),0.1)' : '0 4px 12px rgba(0,0,0,0.03)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '1rem',
                                                cursor: share.status === 'accepted' ? 'pointer' : 'default',
                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                                animation: 'fadeInUp 0.4s ease-out'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{
                                                    width: '56px', height: '56px', borderRadius: '16px',
                                                    background: 'rgba(var(--primary-rgb),0.05)', border: `1px solid ${BORDER}`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '2rem'
                                                }}>
                                                    {col.emoji}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
                                                        {col.name}
                                                    </h3>
                                                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                        Shared by <strong style={{ color: ORANGE }}>@{share.profiles?.username || 'unknown'}</strong>
                                                    </p>
                                                </div>
                                            </div>

                                            {isPending && (
                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            const success = await db.shared.updateShareStatus(share.id, 'accepted');
                                                            if (success) await reload();
                                                        }}
                                                        style={{
                                                            flex: 1, padding: '0.75rem', borderRadius: '12px', border: 'none',
                                                            background: ORANGE, color: '#fff', fontWeight: 700, cursor: 'pointer'
                                                        }}
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            const success = await db.shared.updateShareStatus(share.id, 'declined');
                                                            if (success) await reload();
                                                        }}
                                                        style={{
                                                            flex: 1, padding: '0.75rem', borderRadius: '12px',
                                                            border: `1px solid ${BORDER}`, background: 'var(--surface-2)',
                                                            color: 'var(--text-dim)', fontWeight: 700, cursor: 'pointer'
                                                        }}
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    ) : collections.length === 0 ? (
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
                                                    <span style={{ fontSize: '0.85rem', color: ORANGE, opacity: 0.75, fontWeight: 700 }}>
                                                        {colItems.length} {colItems.length === 1 ? 'item' : 'items'}
                                                    </span>
                                                    <span style={{ fontSize: '0.9rem', color: ORANGE, fontWeight: 900 }}>
                                                        {colItems.length > 0 ? fmt(totalValue) : fmt(0)}
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
                                    background: SURFACE,
                                    border: `1.5px dashed ${BORDER}`,
                                    borderRadius: '28px',
                                    padding: '1.75rem 1.25rem',
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    gap: '0.85rem', cursor: 'pointer',
                                    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                    minHeight: '250px', boxSizing: 'border-box'
                                } : {
                                    width: '100%', padding: '1rem', background: 'transparent',
                                    border: `1.5px dashed ${BORDER}`, borderRadius: '24px',
                                    color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
                                    fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = ORANGE;
                                    if (viewMode === 'card') {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(var(--primary-rgb),0.14)';
                                    } else {
                                        e.currentTarget.style.color = ORANGE;
                                    }
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = BORDER;
                                    if (viewMode === 'card') {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
                                    } else {
                                        e.currentTarget.style.color = 'var(--text-muted)';
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
                                            <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>Create a new group</span>
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
