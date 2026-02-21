import { useState, useEffect } from 'react';
import { db } from '../db';
import { Trash2, Edit2, Plus, X, Check, ArrowLeft, Tag, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ORANGE = '#10367D';
const SURFACE = '#FFFFFF';
const SURFACE2 = '#F5F5F5';
const BORDER = '#D1D5DB';
const BG = '#EBEBEB';

export default function Categories() {
    const [categories, setCategories] = useState([]);
    const [newCatName, setNewCatName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const navigate = useNavigate();

    const loadCategories = async () => {
        try {
            setCategories(await db.categories.getAll());
        } catch (err) {
            console.error(err);
        }
    };
    useEffect(() => { loadCategories(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newCatName.trim()) return;
        try {
            await db.categories.add(newCatName.trim());
            await loadCategories();
            setNewCatName('');
        } catch (err) {
            alert("Error adding category: " + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this category?')) {
            await db.categories.delete(id);
            await loadCategories();
        }
    };

    const startEdit = (cat) => { setEditingId(cat.id); setEditingName(cat.name); };

    const saveEdit = async () => {
        if (editingName.trim()) {
            await db.categories.update(editingId, editingName.trim());
            await loadCategories();
        }
        setEditingId(null);
    };

    return (
        <div style={{ minHeight: '100%', background: BG }}>
            {/* ── Hero Section ── */}
            <div style={{
                background: `linear-gradient(160deg, #051A44 0%, #0A2665 55%, #10367D 100%)`,
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
                        <Layers size={32} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: '#fff' }}>Category List</h1>
                        <p style={{ margin: '0.2rem 0 0', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.9rem' }}>
                            {categories.length} categories to manage items ✨
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

                    {/* ── Add Category Inline Form ── */}
                    <form
                        onSubmit={handleAdd}
                        style={{
                            display: 'flex', gap: '0.75rem', marginBottom: '2rem',
                            background: SURFACE, borderRadius: '24px',
                            border: `1px solid ${RENDER_BORDER_STYLE ? ORANGE : BORDER}`,
                            padding: '0.6rem',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                            transition: 'all 0.3s'
                        }}
                    >
                        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                            <Tag size={18} style={{ position: 'absolute', left: '1.1rem', color: ORANGE }} />
                            <input
                                placeholder="Add new list name..."
                                value={newCatName}
                                onChange={e => setNewCatName(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.9rem 1rem 0.9rem 3.1rem',
                                    background: 'transparent', border: 'none', color: '#111',
                                    fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none',
                                    boxSizing: 'border-box', fontWeight: 600
                                }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!newCatName.trim()}
                            style={{
                                padding: '0 1.4rem',
                                background: newCatName.trim() ? ORANGE : '#F3F4F6',
                                color: newCatName.trim() ? '#fff' : '#9CA3AF',
                                border: 'none', borderRadius: '18px', fontWeight: 800,
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                cursor: newCatName.trim() ? 'pointer' : 'not-allowed',
                                fontSize: '0.9rem', transition: 'all 0.2s',
                                boxShadow: newCatName.trim() ? '0 4px 12px rgba(16,54,125,0.25)' : 'none',
                            }}
                        >
                            <Plus size={18} strokeWidth={3} /> Add
                        </button>
                    </form>

                    {/* ── Categories List ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {categories.map((cat, idx) => (
                            <div
                                key={cat.id}
                                style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '1rem', background: SURFACE,
                                    borderRadius: '24px', border: `1px solid ${BORDER}`,
                                    animation: `fadeInUp 0.4s ease-out ${idx * 0.05}s backwards`,
                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                                }}
                                onMouseEnter={e => {
                                    if (editingId !== cat.id) {
                                        e.currentTarget.style.transform = 'translateY(-3px)';
                                        e.currentTarget.style.borderColor = ORANGE;
                                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (editingId !== cat.id) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = BORDER;
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                                    }
                                }}
                            >
                                {editingId === cat.id ? (
                                    <div style={{ display: 'flex', gap: '0.5rem', flex: 1, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                                        <input
                                            value={editingName}
                                            onChange={e => setEditingName(e.target.value)}
                                            autoFocus
                                            style={{
                                                padding: '0.8rem 1rem', background: SURFACE2, border: `2px solid ${ORANGE}`,
                                                borderRadius: '16px', color: '#111', flex: 1,
                                                fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none',
                                                fontWeight: 600
                                            }}
                                        />
                                        <button onClick={saveEdit} style={{
                                            background: ORANGE, color: '#fff', border: 'none', borderRadius: '14px',
                                            width: '42px', height: '42px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 4px 12px rgba(16,54,125,0.2)'
                                        }}>
                                            <Check size={20} strokeWidth={3} />
                                        </button>
                                        <button onClick={() => setEditingId(null)} style={{
                                            background: '#fff', color: '#6B7280', border: `1px solid ${BORDER}`, borderRadius: '14px',
                                            width: '42px', height: '42px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <X size={20} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div
                                            style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}
                                            onClick={() => navigate(`/?category=${cat.id}`)}
                                        >
                                            <div style={{
                                                width: '44px', height: '44px', borderRadius: '14px',
                                                background: 'rgba(16,54,125,0.05)', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', color: ORANGE
                                            }}>
                                                <Tag size={20} />
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <h3 style={{
                                                    fontWeight: 800, fontSize: '1rem', color: '#111', margin: 0,
                                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                                }}>
                                                    {cat.name}
                                                </h3>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, marginLeft: '1rem' }} onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => startEdit(cat)}
                                                style={{
                                                    background: '#F5F5F5', color: '#555', border: 'none',
                                                    borderRadius: '12px', width: '38px', height: '38px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = ORANGE; e.currentTarget.style.color = '#fff'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = '#F5F5F5'; e.currentTarget.style.color = '#555'; }}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat.id)}
                                                style={{
                                                    background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: 'none',
                                                    borderRadius: '12px', width: '38px', height: '38px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {categories.length === 0 && (
                        <div style={{
                            textAlign: 'center', padding: '5rem 1rem', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', gap: '1rem', opacity: 0.6
                        }}>
                            <Layers size={48} color="#999" strokeWidth={1} />
                            <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>No categories yet. Create one above!</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

const RENDER_BORDER_STYLE = false; // Internal flag for conditional styling
