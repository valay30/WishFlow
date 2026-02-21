import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../db';
import { Search, X, Upload, ArrowRight, Sparkles, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { uploadToImageKit } from '../utils/imagekit';
import { useSettings } from '../context/SettingsContext';
import ProductCard from '../components/ProductCard';

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
   ADD PRODUCT MODAL
══════════════════════════════════════ */
const LABEL_ST = {
    display: 'block', marginBottom: '0.35rem',
    fontSize: '0.75rem', fontWeight: 700,
    color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.05em',
};
const INPUT_ST = {
    width: '100%', padding: '0.85rem 1rem',
    background: SURFACE2, border: `1.5px solid ${BORDER}`,
    borderRadius: '14px', color: '#111',
    fontFamily: 'inherit', fontSize: '0.95rem',
    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
};

function AddProductModal({ categories, onAdd, onClose }) {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [link, setLink] = useState('');
    const [image, setImage] = useState('');
    const [catId, setCatId] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const focus = e => { e.target.style.borderColor = ORANGE; e.target.style.boxShadow = `0 0 0 4px rgba(16, 54, 125,0.12)`; };
    const blur = e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        if (file.size > 5000000) { alert('Image too large (< 5 MB please).'); return; }

        setIsUploading(true);
        try {
            const uploadedUrl = await uploadToImageKit(file);
            setImage(uploadedUrl);
        } catch (err) {
            alert(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !price || !catId) return;
        onAdd({ name, price: parseFloat(price), link, image, category_id: parseInt(catId) });
        onClose();
    };

    return createPortal(
        <>
            <div onClick={onClose} className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)', animation: 'fadeIn 0.2s ease-out' }} />
            <div className="modal-wrapper">
                <div onClick={e => e.stopPropagation()} className="modal-card" style={{ background: '#FFFFFF', borderRadius: '28px 28px 0 0', width: '100%', maxWidth: '560px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.7)', animation: 'slideUp 0.28s cubic-bezier(0.2,0.8,0.4,1)', border: `1px solid ${BORDER}`, borderBottom: 'none', position: 'relative' }}>
                    {/* Drag handle */}
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '0.85rem 0 0' }}>
                        <div style={{ width: '40px', height: '4px', borderRadius: '99px', background: '#D1D5DB' }} />
                    </div>

                    <div style={{ padding: '0.75rem 1.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: ORANGE }}>Add New Item ✨</h2>
                        <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F5F5F5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = '#F5F5F5'}>
                            <X size={16} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} style={{ padding: '1rem 1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={LABEL_ST}>Product Name</label>
                            <input style={INPUT_ST} required placeholder="e.g. Wireless Headphones" value={name} onChange={e => setName(e.target.value)} onFocus={focus} onBlur={blur} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={LABEL_ST}>Price ($)</label>
                                <input style={INPUT_ST} type="number" step="0.01" required placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} onFocus={focus} onBlur={blur} />
                            </div>
                            <div>
                                <label style={LABEL_ST}>Category</label>
                                <select style={{ ...INPUT_ST, appearance: 'none' }} required value={catId} onChange={e => setCatId(e.target.value)} onFocus={focus} onBlur={blur}>
                                    <option value="">Select...</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label style={LABEL_ST}>Product Link</label>
                            <input style={INPUT_ST} type="url" placeholder="https://..." value={link} onChange={e => setLink(e.target.value)} onFocus={focus} onBlur={blur} />
                        </div>
                        <div>
                            <label style={LABEL_ST}>Image</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input style={{ ...INPUT_ST, flex: 1 }} placeholder="Paste image URL..." value={image.startsWith('data:') ? '' : image} onChange={e => setImage(e.target.value)} onFocus={focus} onBlur={blur} />
                                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '2.8rem', background: '#F5F5F5', color: ORANGE, borderRadius: '14px', cursor: isUploading ? 'wait' : 'pointer', border: `1.5px dashed ${ORANGE}`, opacity: isUploading ? 0.7 : 1 }}>
                                    {isUploading ? <span style={{ width: '16px', height: '16px', border: '2px solid rgba(16,54,125,0.4)', borderTopColor: ORANGE, borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> : <Upload size={17} />}
                                    <input type="file" accept="image/*" hidden onChange={handleImageUpload} disabled={isUploading} />
                                </label>
                            </div>
                            {image && (
                                <div style={{ position: 'relative', marginTop: '0.6rem', borderRadius: '12px', overflow: 'hidden', border: `1.5px solid ${ORANGE}`, maxHeight: '130px' }}>
                                    <img src={image} alt="Preview" style={{ width: '100%', objectFit: 'cover', maxHeight: '130px', display: 'block' }} />
                                    <button type="button" onClick={() => setImage('')} style={{ position: 'absolute', top: '0.4rem', right: '0.4rem', background: 'rgba(0,0,0,0.7)', color: '#ef4444', border: 'none', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                        <X size={13} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
                            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.9rem', background: '#F5F5F5', color: '#555', border: `1px solid ${BORDER}`, borderRadius: '14px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                            <button type="submit" disabled={isUploading} style={{ flex: 2, padding: '0.9rem', background: isUploading ? '#8fa0f5' : ORANGE, color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 800, fontSize: '0.95rem', cursor: isUploading ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 16px rgba(16,54,125,0.4)' }}>
                                <Sparkles size={17} /> Save Product
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
            `}</style>
        </>,
        document.body
    );
}

/* ══════════════════════════════════════
   CATEGORY CARD
══════════════════════════════════════ */
function CategoryCard({ cat, isSelected, count, onClick }) {
    const emoji = getEmoji(cat.name);
    return (
        <div
            onClick={onClick}
            className={`cat-card${isSelected ? ' active' : ''}`}
        >
            {/* Item count badge */}
            <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: isSelected ? 'rgba(16,54,125,0.15)' : 'rgba(16,54,125,0.08)', color: ORANGE, padding: '0.18rem 0.55rem', borderRadius: '99px', fontSize: '0.68rem', fontWeight: 700, border: isSelected ? '1px solid rgba(16,54,125,0.2)' : `1px solid rgba(16,54,125,0.1)` }}>
                {count}
            </div>
            {/* Big emoji */}
            <div style={{ fontSize: '2.6rem', marginBottom: '0.5rem', lineHeight: 1 }}>{emoji}</div>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? ORANGE : '#444' }}>{cat.name}</p>
        </div>
    );
}

/* ══════════════════════════════════════
   ITEM GRID CARD — product card style
══════════════════════════════════════ */
function ItemCard({ item, categoryName }) {
    const navigate = useNavigate();
    const price = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(item.price);

    return (
        <div
            onClick={() => navigate(`/product/${item.id}`)}
            style={{
                background: SURFACE,
                border: `1.5px solid ${BORDER}`,
                borderRadius: '24px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                overflow: 'hidden',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = ORANGE;
                e.currentTarget.style.boxShadow = `0 8px 28px rgba(16,54,125,0.12)`;
                e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = BORDER;
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {/* ── Inset image box (padded, rounded inner corners) ── */}
            <div style={{ padding: '0.8rem 0.8rem 0.4rem' }}>
                <div style={{
                    background: '#fff',
                    borderRadius: '16px',
                    aspectRatio: '1 / 1',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #E5E7EB'
                }}>
                    {item.image
                        ? <img
                            src={item.image}
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        : <span style={{ fontSize: '3rem', lineHeight: 1 }}>🛍️</span>
                    }
                </div>
            </div>

            {/* ── Content below image ── */}
            <div style={{ padding: '0.75rem 0.9rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {/* Top row: Product name + Category chip */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flex: 1 }}>
                    <p style={{
                        fontWeight: 800,
                        fontSize: '1.15rem',
                        color: '#111',
                        lineHeight: 1.25,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        margin: 0,
                    }}>
                        {item.name}
                    </p>
                    <span style={{
                        display: 'inline-block',
                        fontSize: '0.65rem', fontWeight: 800,
                        color: ORANGE,
                        background: 'rgba(16, 54, 125, 0.06)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        border: '1px solid rgba(16, 54, 125, 0.12)',
                        whiteSpace: 'nowrap',
                        marginTop: '0.15rem'
                    }}>
                        {categoryName}
                    </span>
                </div>

                {/* Bottom row: price + arrow button */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '0.5rem',
                }}>
                    <p style={{
                        fontWeight: 900,
                        fontSize: '1.15rem',
                        color: ORANGE,
                        letterSpacing: '-0.02em',
                    }}>
                        {price}
                    </p>

                    {/* Arrow button — opens external product link */}
                    <a
                        href={item.link || '#'}
                        target={item.link ? '_blank' : '_self'}
                        rel="noopener noreferrer"
                        onClick={e => {
                            e.stopPropagation(); // don't trigger card's navigate
                            if (!item.link) e.preventDefault();
                        }}
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: item.link ? ORANGE : '#E5E5E5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: item.link ? '0 4px 12px rgba(16,54,125,0.25)' : 'none',
                            transition: 'transform 0.18s ease, background 0.18s ease',
                            textDecoration: 'none',
                            cursor: item.link ? 'pointer' : 'default',
                        }}
                        onMouseEnter={e => { if (item.link) e.currentTarget.style.transform = 'scale(1.12)'; }}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        title={item.link ? 'Open product link' : 'No link added'}
                    >
                        <ArrowRight size={17} color={item.link ? '#fff' : '#999'} strokeWidth={2.5} />
                    </a>
                </div>
            </div>

        </div>
    );
}



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

    const handleAdd = async (data) => { await db.items.add(data); setItems(await db.items.getAll()); };

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
                        {/* Avatar */}
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '2.5px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1.1rem', flexShrink: 0 }}>
                            {user?.name?.[0]?.toUpperCase() || '?'}
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
