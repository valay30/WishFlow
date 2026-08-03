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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {purchasedItems.map((item, idx) => (
                                <div
                                    key={item.id}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '1rem', background: SURFACE,
                                        borderRadius: '24px', border: `1px solid ${BORDER}`,
                                        animation: `fadeInUp 0.4s ease-out ${idx * 0.05}s backwards`,
                                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                                    }}
                                    onClick={() => navigate(`/product/${item.id}`)}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-3px)';
                                        e.currentTarget.style.borderColor = ORANGE;
                                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = BORDER;
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            width: '56px', height: '56px', borderRadius: '16px', background: '#F8F9FA',
                                            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0, border: `1px solid ${BORDER}`
                                        }}>
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <Package size={22} color="#999" />
                                            )}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <h3 style={{
                                                fontWeight: 800, fontSize: '0.98rem', color: 'var(--text)', margin: 0,
                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                            }}>
                                                {item.name}
                                            </h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', background: '#E1FCEF', padding: '0.1rem 0.6rem', borderRadius: '99px', textTransform: 'uppercase' }}>
                                                    {categories.find(c => c.id === item.category_id)?.name || 'Misc'}
                                                </span>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dim)' }}>
                                                    {new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 0 }).format(item.price)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, marginLeft: '1rem' }} onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={(e) => handleRestore(item.id, e)}
                                            style={{
                                                background: 'var(--surface-2)', color: 'var(--text-dim)', border: 'none',
                                                borderRadius: '12px', width: '38px', height: '38px', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = ORANGE; e.currentTarget.style.color = '#fff'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = '#555'; }}
                                        >
                                            <RotateCcw size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(item.id, e)}
                                            style={{
                                                background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: 'none',
                                                borderRadius: '12px', width: '38px', height: '38px', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
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
                                onClick={() => navigate('/')}
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
