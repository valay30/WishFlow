import { useState, useEffect } from 'react';
import { db } from '../db';
import { Package, ArrowLeft, Trash2, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useSettings } from '../context/SettingsContext';
import AlertModal from '../components/AlertModal';

const ORANGE = 'var(--primary)';
const SURFACE = 'var(--surface)';
const BORDER = 'var(--border)';
const BG = 'var(--bg)';

export default function Archive() {
    const { user } = useAuth();
    const { currency } = useSettings();
    const [purchasedItems, setPurchasedItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const navigate = useNavigate();

    const loadData = async () => {
        try {
            const allItems = await db.items.getAll();
            setPurchasedItems(allItems.filter(i => i.is_purchased));
            setCategories(await db.categories.getAll());
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleRestore = async (id, e) => {
        e.stopPropagation();
        try {
            await db.items.update(id, { is_purchased: false });
            await loadData();
        } catch (err) {
            alert("Error restoring item: " + err.message + "\n\nMake sure you added the 'is_purchased' column in Supabase!");
        }
    };

    const handleDelete = (id, e) => {
        e.stopPropagation();
        setDeleteTargetId(id);
    };

    const confirmDelete = async () => {
        if (deleteTargetId) {
            await db.items.delete(deleteTargetId);
            await loadData();
            setDeleteTargetId(null);
        }
    };

    return (
        <div style={{ minHeight: '100%', background: BG }}>
            {/* ── Hero Section ── */}
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
                        <Package size={32} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: '#fff' }}>Purchased Archive</h1>
                        <p style={{ margin: '0.2rem 0 0', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.9rem' }}>
                            {purchasedItems.length} items collected so far ✨
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Content Sheet ── */}
            <div style={{
                background: BG,
                borderRadius: '32px 32px 0 0',
                marginTop: '-2rem',
                padding: '2rem 1.5rem',
                position: 'relative',
                zIndex: 2,
                minHeight: '60vh'
            }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    {purchasedItems.length > 0 ? (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            {purchasedItems.map((item, idx) => {
                                const cardColors = [
                                    { bg: '#7C83F3', text: '#FFFFFF' }, // Blue
                                    { bg: '#85EBAE', text: '#0F172A' }, // Green
                                    { bg: '#F6F676', text: '#0F172A' }, // Yellow
                                    { bg: '#F4AFDD', text: '#0F172A' }  // Pink
                                ];
                                const theme = cardColors[idx % cardColors.length];

                                return (
                                    <div
                                        key={item.id}
                                        style={{
                                            display: 'flex', flexDirection: 'column',
                                            background: 'var(--surface)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '20px',
                                            overflow: 'hidden',
                                            animation: `fadeInUp 0.4s ease-out ${idx * 0.05}s backwards`,
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.08)',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => navigate(`/product/${item.id}`)}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 16px 36px rgba(0, 0, 0, 0.28)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.08)';
                                        }}
                                    >
                                        {/* Top Color Band */}
                                        <div style={{
                                            background: theme.bg,
                                            padding: '1.2rem 1.25rem',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            color: theme.text,
                                            fontWeight: 500, fontSize: '1.0rem', letterSpacing: '0.02em'
                                        }}>
                                            <span style={{
                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%'
                                            }}>
                                                {categories.find(c => c.id === item.category_id)?.name || 'Misc'}
                                            </span>

                                            {/* Action Button - Only Restore */}
                                            <button
                                                onClick={(e) => handleRestore(item.id, e)}
                                                style={{
                                                    background: 'rgba(0,0,0,0.15)', color: theme.text, border: 'none',
                                                    borderRadius: '99px', padding: '0.4rem 0.8rem',
                                                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                                                    fontWeight: 600, fontSize: '1.0rem', cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'rgba(0,0,0,0.25)' }}
                                                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(0,0,0,0.15)' }}
                                                title="Restore to wishlist"
                                            >
                                                <RotateCcw size={14} /> Restore
                                            </button>
                                        </div>

                                        {/* Lower Content Container (Two Columns) */}
                                        <div style={{ display: 'flex', flex: 1 }}>
                                            {/* Left Column (Text & Price) */}
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, justifyContent: 'center' }}>
                                                {/* Title */}
                                                <div style={{ padding: '1.25rem 1.25rem 0.8rem 1.25rem' }}>
                                                    <h3 style={{
                                                        margin: 0, fontSize: '1.5rem', fontWeight: 600, color: 'var(--text)',
                                                        lineHeight: 1.0,
                                                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                                    }}>
                                                        {item.name}
                                                    </h3>
                                                </div>

                                                {/* Separator */}
                                                <div style={{ width: '80%', borderTop: '2px dashed var(--border)', marginLeft: '1.25rem' }} />

                                                {/* Price */}
                                                <div style={{ padding: '0.8rem 1.25rem 1.25rem 1.25rem' }}>
                                                    <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text)' }}>
                                                        {new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 0 }).format(item.price)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Right Column (Image Thumbnail) */}
                                            <div style={{ padding: '1.25rem 1.25rem 1.25rem 0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                {item.image ? (
                                                    <div style={{
                                                        width: '112px', height: '112px', borderRadius: '18px',
                                                        background: 'var(--surface-2)', border: '1px solid var(--border)',
                                                        boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                                                        overflow: 'hidden', flexShrink: 0,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        padding: '0.4rem'
                                                    }}>
                                                        <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        width: '112px', height: '112px', borderRadius: '18px',
                                                        background: 'var(--surface-2)', border: '1px dashed var(--border)',
                                                        overflow: 'hidden', flexShrink: 0,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}>
                                                        <Package size={38} color="var(--text-dim)" opacity={0.5} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{
                            textAlign: 'center', padding: '5rem 1rem', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', gap: '1.25rem', opacity: 0, animation: 'fadeIn 0.6s ease-out forwards'
                        }}>
                            <div style={{
                                width: '100px', height: '100px', borderRadius: '50%',
                                background: 'var(--surface)', border: `2px dashed ${BORDER}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                position: 'relative'
                            }}>
                                <Package size={42} color="var(--border)" />
                                <div style={{
                                    position: 'absolute', bottom: '0', right: '0',
                                    background: ORANGE, color: '#fff', width: '32px', height: '32px',
                                    borderRadius: '50%', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', border: '3px solid #fff'
                                }}>
                                    <RotateCcw size={14} />
                                </div>
                            </div>
                            <div>
                                <h2 style={{ fontWeight: 800, color: 'var(--text)', fontSize: '1.25rem', margin: '0 0 0.5rem' }}>No memories yet</h2>
                                <p style={{ fontSize: '0.92rem', color: 'var(--text-dim)', maxWidth: '240px', lineHeight: 1.5 }}>
                                    Your purchased items will be archived here safely. Go grab something from your list!
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/home')}
                                style={{
                                    marginTop: '0.5rem', padding: '0.85rem 2rem', background: ORANGE,
                                    color: '#fff', border: 'none', borderRadius: '18px',
                                    fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
                                    boxShadow: '0 6px 20px rgba(var(--primary-rgb),0.3)', transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                View WishFlow
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
            <AlertModal
                isOpen={deleteTargetId !== null}
                title="wishflowlist.vercel.app says"
                message="Permanently delete this purchased item?"
                cancelText="Cancel"
                confirmText="OK"
                onCancel={() => setDeleteTargetId(null)}
                onConfirm={confirmDelete}
            />
        </div>
    );
}
