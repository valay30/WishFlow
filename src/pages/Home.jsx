import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db, supabase } from '../db';
import { Search, X, Upload, ArrowRight, Sparkles, ShoppingBag, Crown, Monitor, Shirt, Watch, Tag, Footprints, SlidersHorizontal, ChevronDown, Check, RotateCcw, TrendingUp, TrendingDown, SortAsc, SortDesc, Layers, ChevronRight, Trash2 } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useSettings } from '../context/SettingsContext';
import ProductCard from '../components/ProductCard';
import AddProductModal from '../components/AddProductModal';
import ItemCard from '../components/ItemCard';
import SkeletonCard from '../components/SkeletonCard';
import confetti from 'canvas-confetti';
import AlertModal from '../components/AlertModal';
import { API_URL } from '../config';
import { loadRazorpay } from '../utils/loadRazorpay';
import GroupNameModal from '../components/GroupNameModal';

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
    const shareUrl = searchParams.get('share') || null;
    const selectedCategory = searchParams.get('category') ? parseInt(searchParams.get('category')) : null;

    const [items, setItems] = useState([]);
    const [categories, setCats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('default');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState({ isOpen: false, success: false, title: '', message: '' });

    // ── Drag & group state ──
    // Groups are initialized lazily from localStorage on first render to avoid
    // the race condition where the persist effect fires with [] before the load effect runs.
    const [groups, setGroups] = useState(() => {
        try {
            // We can't read user.id here yet (it's async), so we'll re-load once user is known.
            return [];
        } catch { return []; }
    });
    const [groupsLoaded, setGroupsLoaded] = useState(false);
    const [draggedItemId, setDraggedItemId] = useState(null);
    const [dragOverItemId, setDragOverItemId] = useState(null);
    const [dragOverGroupId, setDragOverGroupId] = useState(null);
    const [groupModal, setGroupModal] = useState({
        open: false,
        targetItemId: null,   // the item we dropped onto
        sourceItemId: null,   // the item being dragged
    });
    const [openGroupId, setOpenGroupId] = useState(null);  // which group's bottom sheet is open
    const dragRef = useRef(null);

    // ── Load groups from Supabase (once, when user is known) ──
    useEffect(() => {
        if (!user?.id) return;
        let isMounted = true;
        const loadGroups = async () => {
            try {
                const saved = await db.groups.get();
                if (isMounted && saved && Array.isArray(saved)) {
                    setGroups(saved);
                }
            } catch (err) {
                console.error('Failed to load groups:', err);
            } finally {
                if (isMounted) setGroupsLoaded(true);
            }
        };
        loadGroups();
        return () => { isMounted = false; };
    }, [user?.id]);

    // ── Persist groups to Supabase (only after initial load is complete) ──
    useEffect(() => {
        if (!user?.id || !groupsLoaded) return;
        const saveGroups = async () => {
            try {
                await db.groups.save(groups);
            } catch (err) {
                console.error('Failed to save groups:', err);
            }
        };
        saveGroups();
    }, [groups, user?.id, groupsLoaded]);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const [fetchedItems, fetchedCats] = await Promise.all([
                db.items.getAll(),
                db.categories.getAll(),
            ]);
            setItems(fetchedItems);
            setCats(fetchedCats);
            setIsLoading(false);
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
    const closeModal = () => setSearchParams(p => {
        const n = new URLSearchParams(p);
        n.delete('add');
        n.delete('share'); // also clean the share param
        return n;
    });

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

    const handleAdd = (data) => {
        // 1. Optimistic Update
        const tempItem = { ...data, id: 'temp_' + Date.now(), created_at: new Date().toISOString() };
        setItems(prev => [tempItem, ...prev]);

        // 2. Background processing
        (async () => {
            try {
                // Check limit
                const { count, error: countError } = await supabase
                    .from('items')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user?.id);

                if (!countError && count >= 5 && user?.isPremium !== true) {
                    // Limit exceeded: Revert optimistic update & show modal
                    setItems(prev => prev.filter(i => i.id !== tempItem.id));
                    setShowPremiumModal(true);
                    return;
                }

                // Actually add to DB
                const realItem = await db.items.add(data);
                if (realItem) {
                    // Replace temp item with real item
                    setItems(prev => prev.map(i => i.id === tempItem.id ? realItem : i));
                    // Also refresh __itemCache globally in background just to be safe
                    db.items.getAll().then(all => setItems(all));
                }
            } catch (err) {
                console.error("Add failed:", err);
                setItems(prev => prev.filter(i => i.id !== tempItem.id));
                alert("Failed to add item. Please try again.");
            }
        })();

        // Return immediately so the modal closes instantly
        return true;
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
                            title: 'WishFlow',
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

    const filtered = items.filter(i => {
        if (i.is_purchased) return false;
        if (selectedCategory && i.category_id !== selectedCategory) return false;
        if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    }).sort((a, b) => {
        if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
        if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '');
        return 0;
    });

    const firstName = user?.name?.split(' ')[0] || 'there';

    /* ── BUILD "ALL" + each category card ── */
    const allCat = { id: null, name: 'All Items' };
    const catCards = [allCat, ...categories];

    const isFreeLimitReached = user?.isPremium !== true && items.length >= 5;
    const shouldShowAddModal = showAddModal && !isFreeLimitReached;
    const shouldShowPremiumModal = showPremiumModal || (showAddModal && isFreeLimitReached);

    /* ── DRAG HANDLERS ── */
    const handleDragStart = useCallback((itemId) => {
        setDraggedItemId(itemId);
        dragRef.current = itemId;
    }, []);

    const handleDragEnd = useCallback(() => {
        setDraggedItemId(null);
        setDragOverItemId(null);
        setDragOverGroupId(null);
        dragRef.current = null;
    }, []);

    // Failsafe: clear drag state globally on mouseup/dragend in case native events get swallowed
    useEffect(() => {
        window.addEventListener('dragend', handleDragEnd);
        window.addEventListener('mouseup', handleDragEnd);
        return () => {
            window.removeEventListener('dragend', handleDragEnd);
            window.removeEventListener('mouseup', handleDragEnd);
        };
    }, [handleDragEnd]);

    const handleDragOverItem = useCallback((itemId) => {
        if (dragRef.current && dragRef.current !== itemId) {
            setDragOverItemId(itemId);
        }
    }, []);

    const handleDragLeaveItem = useCallback(() => {
        setDragOverItemId(null);
    }, []);

    const handleDropOnItem = useCallback((targetItemId) => {
        const sourceId = dragRef.current;
        if (!sourceId || sourceId === targetItemId) {
            setDragOverItemId(null);
            return;
        }

        // Check if source is already in a group that contains the target
        const sourceGroup = groups.find(g => g.itemIds.includes(sourceId));
        const targetGroup = groups.find(g => g.itemIds.includes(targetItemId));

        if (sourceGroup && targetGroup && sourceGroup.id === targetGroup.id) {
            // Same group — do nothing
            setDragOverItemId(null);
            return;
        }

        if (targetGroup) {
            // Drop into an existing group: add the dragged item to it
            setGroups(prev => prev.map(g =>
                g.id === targetGroup.id
                    ? { ...g, itemIds: g.itemIds.includes(sourceId) ? g.itemIds : [...g.itemIds, sourceId] }
                    : { ...g, itemIds: g.itemIds.filter(id => id !== sourceId) }
            ).filter(g => g.itemIds.length >= 2));
            setDragOverItemId(null);
        } else {
            // Neither in a group: open name modal
            setGroupModal({ open: true, sourceItemId: sourceId, targetItemId });
            setDragOverItemId(null);
        }
    }, [groups]);

    const handleGroupCreated = useCallback((name) => {
        const { sourceItemId, targetItemId } = groupModal;
        // Remove both items from any existing groups first
        const newGroup = {
            id: 'grp_' + Date.now(),
            name,
            itemIds: [sourceItemId, targetItemId],
            collapsed: false,
        };
        setGroups(prev => [
            ...prev
                .map(g => ({ ...g, itemIds: g.itemIds.filter(id => id !== sourceItemId && id !== targetItemId) }))
                .filter(g => g.itemIds.length >= 2),
            newGroup,
        ]);
        setGroupModal({ open: false, sourceItemId: null, targetItemId: null });
    }, [groupModal]);

    const handleGroupModalCancel = useCallback(() => {
        setGroupModal({ open: false, sourceItemId: null, targetItemId: null });
    }, []);

    const toggleGroupCollapse = useCallback((groupId) => {
        setGroups(prev => prev.map(g => g.id === groupId ? { ...g, collapsed: !g.collapsed } : g));
    }, []);

    const removeItemFromGroup = useCallback((groupId, itemId, e) => {
        e.stopPropagation();
        setGroups(prev => prev
            .map(g => g.id === groupId ? { ...g, itemIds: g.itemIds.filter(id => id !== itemId) } : g)
            .filter(g => g.itemIds.length >= 2) // auto-dissolve if < 2
        );
    }, []);

    const deleteGroup = useCallback((groupId, e) => {
        e.stopPropagation();
        setGroups(prev => prev.filter(g => g.id !== groupId));
    }, []);

    const handleDragOverGroup = useCallback((groupId) => {
        setDragOverGroupId(groupId);
    }, []);

    const handleDragLeaveGroup = useCallback(() => {
        setDragOverGroupId(null);
    }, []);

    const handleDropOnGroup = useCallback((groupId) => {
        const sourceId = dragRef.current;
        if (!sourceId) return;
        setGroups(prev => prev.map(g =>
            g.id === groupId
                ? { ...g, itemIds: g.itemIds.includes(sourceId) ? g.itemIds : [...g.itemIds, sourceId] }
                : { ...g, itemIds: g.itemIds.filter(id => id !== sourceId) }
        ).filter(g => g.itemIds.length >= 2));
        setDragOverGroupId(null);
    }, []);

    /* ── Derive grouped / ungrouped lists from filtered ── */
    // Only count groups with 2+ items as real groups — dissolve single-item groups at render time
    const validGroups = groups.filter(g => g.itemIds.length >= 2);
    const groupedItemIds = new Set(validGroups.flatMap(g => g.itemIds));
    const ungroupedFiltered = filtered.filter(i => !groupedItemIds.has(i.id));

    // ── Auto-clean degenerate single-item groups from state ──
    useEffect(() => {
        if (!groupsLoaded) return;
        const hasDegenerate = groups.some(g => g.itemIds.length < 2);
        if (hasDegenerate) {
            setGroups(prev => prev.filter(g => g.itemIds.length >= 2));
        }
    }, [groups, groupsLoaded]);

    const handleClosePremiumModal = () => {
        setShowPremiumModal(false);
        if (showAddModal) closeModal();
    };

    return (
        <>
            {/* ── Modal ── */}
            {shouldShowAddModal && <AddProductModal categories={categories} onAdd={handleAdd} onClose={closeModal} shareUrl={shareUrl} />}

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

                    {/* ── Search bar + Inline Filter/Sort ── */}
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={17} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ width: '100%', padding: search ? '0.85rem 2.4rem 0.85rem 2.75rem' : '0.85rem 1rem 0.85rem 2.75rem', background: SURFACE, border: `1.5px solid ${BORDER}`, borderRadius: '99px', color: 'var(--text)', fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                                onFocus={e => e.target.style.borderColor = ORANGE}
                                onBlur={e => e.target.style.borderColor = BORDER}
                            />
                            {search && (
                                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Custom Dropdown Sort Menu — Inspired by modern UI card design */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            {/* Visual Trigger Button */}
                            <button
                                type="button"
                                onClick={() => setIsSortOpen(prev => !prev)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    background: sortBy !== 'default' ? ORANGE : SURFACE,
                                    color: sortBy !== 'default' ? '#fff' : 'var(--text)',
                                    border: `1.5px solid ${sortBy !== 'default' ? ORANGE : BORDER}`,
                                    borderRadius: '99px',
                                    padding: '0.75rem 0.95rem',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    fontFamily: 'inherit',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: sortBy !== 'default' ? '0 4px 14px rgba(var(--primary-rgb),0.35)' : 'none',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                <SlidersHorizontal size={14} style={{ color: sortBy !== 'default' ? '#fff' : ORANGE }} />
                                <span>Sort</span>
                                <ChevronDown
                                    size={13}
                                    style={{
                                        color: sortBy !== 'default' ? '#fff' : 'var(--text-dim)',
                                        transform: isSortOpen ? 'rotate(180deg)' : 'none',
                                        transition: 'transform 0.2s ease'
                                    }}
                                />
                            </button>

                            {/* Outside click backdrop */}
                            {isSortOpen && (
                                <div
                                    onClick={() => setIsSortOpen(false)}
                                    style={{ position: 'fixed', inset: 0, zIndex: 1999 }}
                                />
                            )}

                            {/* Floating Dropdown Card */}
                            {isSortOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 8px)',
                                    right: 0,
                                    zIndex: 2000,
                                    minWidth: '210px',
                                    background: 'var(--surface)',
                                    border: `1px solid ${BORDER}`,
                                    borderRadius: '20px',
                                    padding: '0.45rem',
                                    boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
                                    animation: 'fadeIn 0.15s ease-out',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.2rem',
                                }}>
                                    {[
                                        { id: 'default', label: 'Default', icon: RotateCcw },
                                        { id: 'price_asc', label: 'Price: Low → High', icon: TrendingUp },
                                        { id: 'price_desc', label: 'Price: High → Low', icon: TrendingDown },
                                        { id: 'name_asc', label: 'Name: A → Z', icon: SortAsc },
                                        { id: 'name_desc', label: 'Name: Z → A', icon: SortDesc },
                                    ].map((opt, idx) => {
                                        if (opt.id === 'divider') {
                                            return <div key={'div-' + idx} style={{ height: '1px', background: 'var(--border)', margin: '0.3rem 0.5rem', opacity: 0.7 }} />;
                                        }
                                        const IconComponent = opt.icon;
                                        const isActive = sortBy === opt.id;
                                        return (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => { setSortBy(opt.id); setIsSortOpen(false); }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justify: 'space-between',
                                                    gap: '0.75rem',
                                                    width: '100%',
                                                    padding: '0.65rem 0.85rem',
                                                    borderRadius: '14px',
                                                    border: 'none',
                                                    background: isActive ? 'rgba(var(--primary-rgb),0.12)' : 'transparent',
                                                    color: isActive ? ORANGE : 'var(--text)',
                                                    fontWeight: isActive ? 700 : 500,
                                                    fontSize: '0.86rem',
                                                    fontFamily: 'inherit',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    transition: 'all 0.15s ease',
                                                }}
                                                onMouseEnter={e => {
                                                    if (!isActive) e.currentTarget.style.background = 'var(--surface-2)';
                                                }}
                                                onMouseLeave={e => {
                                                    if (!isActive) e.currentTarget.style.background = 'transparent';
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                                    <IconComponent size={15} color={isActive ? ORANGE : 'var(--text-muted)'} />
                                                    <span>{opt.label}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Items list header ── */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                        <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)' }}>
                            {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'All Items'}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>


                    {isLoading ? (
                        <div className={viewMode === 'card' ? "category-grid" : "list-view-container"} style={viewMode === 'list' ? { display: 'flex', flexDirection: 'column', gap: '0.75rem' } : {}}>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <SkeletonCard key={i} mode={viewMode} />
                            ))}
                        </div>
                    ) : (filtered.length > 0 || groups.some(g => g.itemIds.length > 0)) ? (
                        /* ── Single unified grid: folder cards first, then ungrouped items ── */
                        <div
                            className={viewMode === 'card' ? 'category-grid' : 'list-view-container'}
                            style={viewMode === 'list' ? { display: 'flex', flexDirection: 'column', gap: '0.75rem' } : {}}
                        >
                            {/* FOLDER CARDS — one per group, inline in the grid */}
                            {viewMode === 'card' && groups.map(group => {
                                const groupItems = group.itemIds
                                    .map(id => items.find(i => i.id === id))
                                    .filter(Boolean)
                                    .filter(i => !i.is_purchased);

                                if (groupItems.length === 0) return null;

                                const isDropTarget = dragOverGroupId === group.id;
                                const previews = groupItems.slice(0, 3);

                                return (
                                    <div
                                        key={group.id}
                                        onDragOver={e => { e.preventDefault(); handleDragOverGroup(group.id); }}
                                        onDragLeave={handleDragLeaveGroup}
                                        onDrop={e => { e.preventDefault(); handleDropOnGroup(group.id); }}
                                        onClick={() => setOpenGroupId(group.id)}
                                        style={{
                                            background: SURFACE,
                                            border: isDropTarget ? `2.5px dashed var(--primary)` : `1.5px solid ${BORDER}`,
                                            borderRadius: '24px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                                            overflow: 'hidden',
                                            position: 'relative',
                                            boxShadow: isDropTarget ? '0 0 0 4px rgba(var(--primary-rgb),0.18), 0 8px 28px rgba(var(--primary-rgb),0.2)' : 'none',
                                            transform: isDropTarget ? 'scale(1.02)' : 'none',
                                        }}
                                        onMouseEnter={e => {
                                            if (isDropTarget) return;
                                            e.currentTarget.style.borderColor = ORANGE;
                                            e.currentTarget.style.boxShadow = `0 8px 28px rgba(var(--primary-rgb),0.15)`;
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                        }}
                                        onMouseLeave={e => {
                                            if (isDropTarget) return;
                                            e.currentTarget.style.borderColor = BORDER;
                                            e.currentTarget.style.boxShadow = 'none';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        <div style={{ padding: '0.8rem 0.8rem 0.4rem', position: 'relative' }}>
                                            <div style={{
                                                background: 'var(--surface-2)',
                                                borderRadius: '16px',
                                                aspectRatio: '1 / 1',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '100%',
                                                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)',
                                                border: '1px solid var(--border)',
                                                position: 'relative'
                                            }}>
                                                {/* Folder 3D Object */}
                                                <div style={{ width: '85%', aspectRatio: '1.1', position: 'relative', transform: 'translateY(5%)' }}>
                                                    {/* Back body of folder */}
                                                    <div style={{
                                                        position: 'absolute',
                                                        bottom: '8%', left: 0, right: 0,
                                                        height: '75%',
                                                        background: '#75BAF2',
                                                        borderRadius: '10px',
                                                        boxShadow: 'inset 0 -10px 20px rgba(0,0,0,0.05)',
                                                    }} />

                                                    {/* Documents */}
                                                    {previews.map((item, idx) => {
                                                        const configs = [
                                                            { left: '12%', rotate: '-12deg', bottom: '25%', width: '35%', height: '58%', zIndex: 1 },
                                                            { left: '32%', rotate: '0deg', bottom: '30%', width: '35%', height: '62%', zIndex: 3 },
                                                            { left: '52%', rotate: '12deg', bottom: '24%', width: '35%', height: '58%', zIndex: 2 },
                                                        ];
                                                        const c = configs[idx] || configs[1];
                                                        return (
                                                            <div key={item.id} style={{
                                                                position: 'absolute',
                                                                left: c.left, bottom: c.bottom,
                                                                width: c.width, height: c.height,
                                                                borderRadius: '6px',
                                                                background: '#ffffff',
                                                                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                                                                transform: `rotate(${c.rotate})`,
                                                                transformOrigin: 'bottom center',
                                                                zIndex: c.zIndex,
                                                                padding: '10px 8px',
                                                                display: 'flex', flexDirection: 'column', gap: '5px',
                                                                overflow: 'hidden'
                                                            }}>
                                                                <div style={{ height: '4px', background: 'rgba(107, 179, 240, 0.4)', borderRadius: '2px', width: '85%' }} />
                                                                <div style={{ height: '3px', background: 'rgba(107, 179, 240, 0.25)', borderRadius: '2px', width: '60%' }} />
                                                                <div style={{ height: '3px', background: 'rgba(107, 179, 240, 0.25)', borderRadius: '2px', width: '75%' }} />
                                                                <div style={{ height: '3px', background: 'rgba(107, 179, 240, 0.2)', borderRadius: '2px', width: '50%' }} />
                                                            </div>
                                                        );
                                                    })}

                                                    {/* Front flap mask URL */}
                                                    <div style={{
                                                        position: 'absolute',
                                                        bottom: '8%', left: 0, right: 0, height: '60%',
                                                        background: 'linear-gradient(135deg, rgba(144, 202, 250, 0.65), rgba(107, 179, 240, 0.4))',
                                                        backdropFilter: 'blur(10px)',
                                                        WebkitBackdropFilter: 'blur(10px)',
                                                        maskImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 65' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5 0h30q5 0 8 4l3 5q3 4 8 4h41q5 0 5 5v42q0 5-5 5H5q-5 0-5-5V5q0-5 5-5z' fill='black'/%3E%3C/svg%3E")`,
                                                        WebkitMaskImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 65' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5 0h30q5 0 8 4l3 5q3 4 8 4h41q5 0 5 5v42q0 5-5 5H5q-5 0-5-5V5q0-5 5-5z' fill='black'/%3E%3C/svg%3E")`,
                                                        maskSize: '100% 100%',
                                                        WebkitMaskSize: '100% 100%',
                                                        zIndex: 5,
                                                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.6)',
                                                    }}>
                                                        {/* Top highlight */}
                                                        <div style={{
                                                            position: 'absolute', top: 0, left: 0, right: 0, height: '1.5px',
                                                            background: 'linear-gradient(90deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.1) 100%)',
                                                        }} />
                                                    </div>

                                                    {/* Drop hint overlay */}
                                                    {isDropTarget && (
                                                        <div style={{
                                                            position: 'absolute', bottom: '8%', left: 0, right: 0, height: '75%',
                                                            zIndex: 20,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            background: 'rgba(var(--primary-rgb),0.15)',
                                                            borderRadius: '10px'
                                                        }}>
                                                            <span style={{ background: 'var(--primary)', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '0.3rem 0.7rem', borderRadius: '99px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                                                                + Add
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Delete button placed top right of the image box, identical to ItemCard */}
                                                <button
                                                    onClick={e => deleteGroup(group.id, e)}
                                                    title="Dissolve group"
                                                    style={{
                                                        position: 'absolute', top: '0.5rem', right: '0.5rem',
                                                        width: '28px', height: '28px', borderRadius: '50%',
                                                        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                                                        color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
                                                        cursor: 'pointer', zIndex: 10,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        transition: 'all 0.2s', padding: 0
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'scale(1)'; }}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Content below image */}
                                        <div style={{ padding: '0.75rem 0.9rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem', flex: 1 }}>
                                                <p style={{
                                                    fontWeight: 800,
                                                    fontSize: '1.05rem',
                                                    color: 'var(--text)',
                                                    lineHeight: 1.3,
                                                    margin: 0,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }}>
                                                    {group.name}
                                                </p>
                                                <span style={{
                                                    display: 'inline-block',
                                                    fontSize: '0.65rem', fontWeight: 800,
                                                    color: 'var(--text-muted)',
                                                    background: 'var(--surface-2)',
                                                    padding: '0.2rem 0.55rem',
                                                    borderRadius: '6px',
                                                    textTransform: 'uppercase', letterSpacing: '0.05em',
                                                    border: '1px solid var(--border)',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {groupItems.length} ITEM{groupItems.length !== 1 ? 'S' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* UNGROUPED ITEM CARDS */}
                            {ungroupedFiltered.map(item => (
                                viewMode === 'card' ? (
                                    <ItemCard
                                        key={item.id}
                                        item={item}
                                        categoryName={categories.find(c => c.id === item.category_id)?.name || 'Other'}
                                        draggable
                                        isDragActive={draggedItemId === item.id}
                                        isDragOver={dragOverItemId === item.id}
                                        onDragStart={() => handleDragStart(item.id)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={() => handleDragOverItem(item.id)}
                                        onDragLeave={handleDragLeaveItem}
                                        onDrop={() => handleDropOnItem(item.id)}
                                        onTogglePublic={async (id, val) => {
                                            await db.discover.setPublic(id, val);
                                            setItems(prev => prev.map(i => i.id === id ? { ...i, is_public: val } : i));
                                        }}
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

                    {/* Group Name Modal */}
                    <GroupNameModal
                        isOpen={groupModal.open}
                        onConfirm={handleGroupCreated}
                        onCancel={handleGroupModalCancel}
                    />

                    {/* ── GROUP BOTTOM SHEET ── */}
                    {openGroupId && (() => {
                        const group = groups.find(g => g.id === openGroupId);
                        if (!group) return null;
                        const groupItems = group.itemIds
                            .map(id => items.find(i => i.id === id))
                            .filter(Boolean)
                            .filter(i => !i.is_purchased);
                        return createPortal(
                            <div
                                onClick={() => setOpenGroupId(null)}
                                onDragOver={e => {
                                    if (draggedItemId) e.preventDefault();
                                }}
                                onDrop={e => {
                                    e.preventDefault();
                                    if (!draggedItemId) return;
                                    const itemToRemove = draggedItemId;
                                    const currentGroupId = openGroupId; // capture before state clears
                                    // Remove item from its group; dissolve group if empty
                                    setGroups(prev => {
                                        const updated = prev
                                            .map(g => g.id === currentGroupId
                                                ? { ...g, itemIds: g.itemIds.filter(id => id !== itemToRemove) }
                                                : g
                                            )
                                            .filter(g => g.itemIds.length > 0);
                                        return updated;
                                    });
                                    // Always close the sheet — item now appears free on home screen
                                    setOpenGroupId(null);
                                    setDraggedItemId(null);
                                }}
                                style={{
                                    position: 'fixed', inset: 0, zIndex: 8000,
                                    background: 'rgba(0,0,0,0.52)',
                                    backdropFilter: 'blur(6px)',
                                    WebkitBackdropFilter: 'blur(6px)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: '1.5rem',
                                    animation: 'fadeIn 0.18s ease-out',
                                }}
                            >
                                <div
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                        width: '100%', maxWidth: '640px',
                                        background: 'var(--surface)',
                                        borderRadius: '28px',
                                        padding: '0',
                                        maxHeight: '85vh',
                                        display: 'flex', flexDirection: 'column',
                                        overflow: 'hidden',
                                        boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
                                        transformOrigin: 'center',
                                        animation: 'popIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    }}
                                >

                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '0.85rem',
                                        padding: '0.85rem 1.25rem 1rem',
                                        borderBottom: '1px solid var(--border)',
                                    }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '12px',
                                            background: 'linear-gradient(135deg, var(--primary), var(--primary-dk))',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                            boxShadow: '0 4px 12px rgba(var(--primary-rgb),0.35)',
                                        }}>
                                            <Layers size={18} color="#fff" />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text)', margin: 0, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {group.name}
                                            </p>

                                        </div>
                                        <button
                                            onClick={() => setOpenGroupId(null)}
                                            style={{
                                                width: '34px', height: '34px', borderRadius: '50%',
                                                background: 'var(--surface-2)', border: '1px solid var(--border)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer', color: 'var(--text-muted)',
                                                flexShrink: 0, transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    {/* Items grid inside the sheet */}
                                    <div style={{ overflowY: 'auto', padding: '1.25rem', flex: 1, background: 'var(--surface-2)' }}>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                                            gap: '0.75rem',
                                            alignItems: 'start'
                                        }}>
                                            {groupItems.map(item => (
                                                <div key={item.id} style={{
                                                    transform: 'scale(0.95)',
                                                    transformOrigin: 'top center',
                                                    width: '100%',
                                                    margin: '-2.5% 0' // Compensate for scale empty space
                                                }}>
                                                    <ItemCard
                                                        item={item}
                                                        categoryName={categories.find(c => c.id === item.category_id)?.name || 'Other'}
                                                        draggable
                                                        isDragActive={draggedItemId === item.id}
                                                        isDragOver={dragOverItemId === item.id}
                                                        onDragStart={() => handleDragStart(item.id)}
                                                        onDragEnd={handleDragEnd}
                                                        onDragOver={() => handleDragOverItem(item.id)}
                                                        onDragLeave={handleDragLeaveItem}
                                                        onDrop={() => handleDropOnItem(item.id)}
                                                        onTogglePublic={async (id, val) => {
                                                            await db.discover.setPublic(id, val);
                                                            setItems(prev => prev.map(i => i.id === id ? { ...i, is_public: val } : i));
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>,
                            document.body
                        );
                    })()}
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
