import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../db';
import { Trash2, Edit, ArrowLeft, ExternalLink, Upload, X, Check, PackageCheck } from 'lucide-react';
import { uploadToImageKit } from '../utils/imagekit';
import AlertModal from '../components/AlertModal';

const BLUE = 'var(--primary)';
const SURFACE = 'var(--surface)';
const SURFACE2 = 'var(--surface-2)';
const BORDER = 'var(--border)';
const BG = 'var(--bg)';

const INPUT_ST = {
    width: '100%', padding: '0.8rem 1rem',
    background: SURFACE2, border: `1.5px solid ${BORDER}`,
    borderRadius: '12px', color: 'var(--text)',
    fontFamily: 'inherit', fontSize: '0.95rem',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
};
const LABEL_ST = {
    display: 'block', marginBottom: '0.4rem',
    fontSize: '0.72rem', fontWeight: 700,
    color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em',
};

export default function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [availableCategories, setAvailableCategories] = useState([]);
    const [isEditing, setIsEditing] = useState(false);

    const [editName, setEditName] = useState('');
    const [editPrice, setEditPrice] = useState('');
    const [editLink, setEditLink] = useState('');
    const [editImage, setEditImage] = useState('');
    const [editCategoryId, setEditCategoryId] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        let styleEl = null;

        const applyBg = () => {
            if (!isMobile) {
                if (!styleEl) {
                    styleEl = document.createElement('style');
                    styleEl.id = 'product-detail-bg-style';
                    document.head.appendChild(styleEl);
                }
                styleEl.textContent = `body { background: color-mix(in srgb, var(--primary) 55%, #000) !important; transition: background 0.4s ease; }`;
            } else {
                if (styleEl) { styleEl.remove(); styleEl = null; }
            }
        };

        applyBg();

        const observer = new MutationObserver(applyBg);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });

        return () => {
            observer.disconnect();
            if (styleEl) { styleEl.remove(); }
            // Remove any leftover injected style
            document.getElementById('product-detail-bg-style')?.remove();
        };
    }, [isMobile]);

    useEffect(() => {
        window.scrollTo(0, 0);
        const load = async () => {
            const found = await db.items.getById(id);
            if (found) {
                setItem(found);
                setAvailableCategories(await db.categories.getAll());
                setEditName(found.name);
                setEditPrice(found.price);
                setEditLink(found.link || '');
                setEditImage(found.image || '');
                setEditCategoryId(found.category_id);
            }
        };
        load();
    }, [id]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5000000) { alert('Please use an image < 5 MB or a URL.'); return; }
        setIsUploading(true);
        try {
            const url = await uploadToImageKit(file);
            setEditImage(url);
        } catch (err) {
            alert(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async () => {
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        setShowDeleteConfirm(false);
        await db.items.delete(item.id);
        navigate('/');
    };

    const handleSave = async () => {
        const updated = await db.items.update(item.id, {
            name: editName, price: parseFloat(editPrice),
            link: editLink, image: editImage,
            category_id: parseInt(editCategoryId),
        });
        if (updated) { setItem(updated); setIsEditing(false); }
    };

    const handlePurchase = async () => {
        try {
            const updated = await db.items.update(item.id, { is_purchased: true });
            if (updated) {
                setItem(updated);
                navigate('/?celebrate=true');
            }
        } catch (err) {
            alert("Error marking as purchased: " + err.message + "\n\nDid you run the SQL snippet in Supabase to add the 'is_purchased' column?");
        }
    };

    const focus = e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px rgba(var(--primary-rgb),0.1)`; };
    const blur = e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; };

    if (!item) return (
        <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, var(--primary-dk) 0%, var(--primary-dk) 45%, var(--primary) 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '1rem', fontSize: '1.1rem' }}>Item not found.</p>
                <button onClick={() => navigate('/')} style={{ padding: '0.75rem 2rem', background: 'var(--surface)', color: BLUE, border: 'none', borderRadius: '99px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.95rem' }}>← Go Home</button>
            </div>
        </div>
    );

    const categoryName = availableCategories.find(c => c.id === item.category_id)?.name || 'Uncategorized';
    const price = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(item.price);

    if (isMobile) {
        return (
            <div style={{ minHeight: '100%', background: BG, display: 'flex', flexDirection: 'column' }}>
                {/* ── Hero Section (Image Showcase) ── */}
                <div style={{
                    background: `linear-gradient(160deg, var(--primary-dk) 0%, var(--primary-dk) 45%, var(--primary) 100%)`,
                    padding: '2rem 1.5rem 4rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: 1
                }}>
                    <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'flex-start', marginBottom: '1.5rem' }}>
                        <button onClick={() => navigate(-1)} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                            color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.85rem',
                            cursor: 'pointer', fontFamily: 'inherit',
                            padding: '0.55rem 1.1rem', borderRadius: '99px',
                            backdropFilter: 'blur(10px)',
                            transition: 'all 0.2s ease',
                        }}>
                            <ArrowLeft size={15} /> Back
                        </button>
                    </div>
                    <div style={{
                        width: '240px', height: '240px',
                        background: 'var(--surface)', borderRadius: '32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                        overflow: 'hidden'
                    }}>
                        {item.image ? (
                            <img src={item.image} alt={item.name} style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                        ) : (
                            <div style={{ fontSize: '4.5rem', opacity: 0.25 }}>🛍️</div>
                        )}
                    </div>
                </div>

                {/* ── Content Sheet ── */}
                <div style={{
                    flex: 1,
                    background: BG,
                    borderRadius: '32px 32px 0 0',
                    padding: '1.5rem',
                    paddingBottom: 'calc(var(--bottom-nav) + 4rem)',
                    marginTop: '-32px',
                    zIndex: 10,
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem'
                }}>
                    {isEditing ? (
                        <div style={{ background: 'var(--surface)', borderRadius: '24px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `rgba(var(--primary-rgb),0.07)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: BLUE }}>
                                    <Edit size={19} />
                                </div>
                                <h3 style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--text)', margin: 0 }}>Edit Details</h3>
                            </div>
                            <div>
                                <label style={LABEL_ST}>Product Name</label>
                                <input style={INPUT_ST} value={editName} onChange={e => setEditName(e.target.value)} onFocus={focus} onBlur={blur} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={LABEL_ST}>Price (₹)</label>
                                    <input style={INPUT_ST} type="number" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} onFocus={focus} onBlur={blur} />
                                </div>
                                <div>
                                    <label style={LABEL_ST}>Category</label>
                                    <select style={{ ...INPUT_ST, appearance: 'none' }} value={editCategoryId} onChange={e => setEditCategoryId(e.target.value)} onFocus={focus} onBlur={blur}>
                                        <option value="">Select Category</option>
                                        {availableCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={LABEL_ST}>Product Link</label>
                                <input style={INPUT_ST} type="url" placeholder="https://..." value={editLink} onChange={e => setEditLink(e.target.value)} onFocus={focus} onBlur={blur} />
                            </div>
                            <div>
                                <label style={LABEL_ST}>Change Image</label>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <label style={{
                                        flex: 1, padding: '0.9rem', background: 'var(--surface-2)', border: `2px dashed ${BORDER}`,
                                        borderRadius: '12px', textAlign: 'center', cursor: isUploading ? 'wait' : 'pointer',
                                        transition: 'all 0.2s', color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: 600,
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = BLUE}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
                                    >
                                        {isUploading ? <span style={{ fontWeight: 700, color: BLUE }}>Uploading...</span> : <><Upload size={17} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Upload New</>}
                                        <input type="file" accept="image/*" hidden onChange={handleImageUpload} disabled={isUploading} />
                                    </label>
                                    {editImage && (
                                        <div style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${BORDER}`, flexShrink: 0 }}>
                                            <img src={editImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button onClick={() => setEditImage('')} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={9} /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
                                <button onClick={handleSave} disabled={isUploading} style={{
                                    flex: 2, padding: '0.95rem', background: BLUE, color: '#fff', border: 'none', borderRadius: '14px',
                                    fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    cursor: 'pointer', boxShadow: '0 6px 20px rgba(var(--primary-rgb),0.3)',
                                }}><Check size={17} strokeWidth={3} /> Save Details</button>
                                <button onClick={() => setIsEditing(false)} style={{
                                    flex: 1, padding: '0.95rem', background: 'var(--surface-2)', color: 'var(--text-dim)', border: 'none', borderRadius: '14px',
                                    fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', fontFamily: 'inherit',
                                }}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            background: 'var(--surface)', borderRadius: '28px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <span style={{ display: 'inline-block', background: '#E6F4EA', color: '#137333', padding: '0.35rem 0.8rem', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    {categoryName}
                                </span>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 900, color: BLUE, margin: 0 }}>
                                        {price}
                                    </p>
                                </div>
                            </div>
                            <h1 style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--text)', margin: 0, lineHeight: 1.1 }}>
                                {item.name}
                            </h1>
                        </div>
                    )}

                    {!isEditing && (
                        <>
                            <a href={item.link || '#'} target={item.link ? '_blank' : '_self'} rel="noopener noreferrer"
                                onClick={e => { if (!item.link) e.preventDefault(); }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    padding: '1rem', background: item.link ? BLUE : 'var(--border)',
                                    color: '#fff', borderRadius: '16px', fontWeight: 800, fontSize: '0.95rem',
                                    textDecoration: 'none', cursor: item.link ? 'pointer' : 'default',
                                    boxShadow: item.link ? '0 8px 25px rgba(var(--primary-rgb),0.25)' : 'none'
                                }}>
                                <ExternalLink size={18} /> {item.link ? 'Visit Product Page' : 'No link available'} {item.link && '→'}
                            </a>

                            {!item.is_purchased && (
                                <button onClick={handlePurchase} style={{
                                    padding: '1rem', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
                                    borderRadius: '16px', fontWeight: 800, fontSize: '0.95rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer',
                                }}>
                                    <PackageCheck size={18} /> Mark as Purchased
                                </button>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <button onClick={() => setIsEditing(true)} style={{
                                    padding: '0.9rem', background: 'var(--surface-2)', color: 'var(--text-muted)', border: 'none',
                                    borderRadius: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', cursor: 'pointer'
                                }}>
                                    <Edit size={16} /> Edit
                                </button>
                                <button onClick={handleDelete} style={{
                                    padding: '0.9rem', background: '#fef2f2', color: '#ef4444', border: 'none',
                                    borderRadius: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', cursor: 'pointer',
                                    position: 'relative', zIndex: 5, touchAction: 'manipulation'
                                }}>
                                    <Trash2 size={16} /> Delete
                                </button>
                            </div>

                            {item.link && (
                                <div style={{ background: 'var(--surface-2)', borderRadius: '14px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid var(--border)' }}>
                                    <ExternalLink size={16} color="#9CA3AF" style={{ flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        Source: {item.link.replace(/^https?:\/\//, '')}
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100%', background: `linear-gradient(160deg, var(--primary-dk) 0%, var(--primary-dk) 45%, var(--primary) 100%)`, display: 'flex', flexDirection: 'column' }}>

            {/* ── Back Button ── */}
            <div style={{ padding: '1.5rem 2rem 0' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                        color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.85rem',
                        cursor: 'pointer', fontFamily: 'inherit',
                        padding: '0.55rem 1.1rem', borderRadius: '99px',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                    <ArrowLeft size={15} /> Back
                </button>
            </div>

            {/* ── Main Content Area ── */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 2rem 3rem' }}>
                <div style={{
                    background: SURFACE,
                    borderRadius: '28px',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
                    width: '100%',
                    maxWidth: '860px',
                    overflow: 'hidden',
                    animation: 'cardIn 0.4s cubic-bezier(0.2, 0.8, 0.4, 1)',
                }}>
                    {isEditing ? (
                        /* ══ EDIT FORM ══ */
                        <div style={{ padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `rgba(var(--primary-rgb),0.07)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: BLUE }}>
                                    <Edit size={19} />
                                </div>
                                <h3 style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--text)', margin: 0 }}>Edit Details</h3>
                            </div>

                            <div>
                                <label style={LABEL_ST}>Product Name</label>
                                <input style={INPUT_ST} value={editName} onChange={e => setEditName(e.target.value)} onFocus={focus} onBlur={blur} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={LABEL_ST}>Price (₹)</label>
                                    <input style={INPUT_ST} type="number" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} onFocus={focus} onBlur={blur} />
                                </div>
                                <div>
                                    <label style={LABEL_ST}>Category</label>
                                    <select style={{ ...INPUT_ST, appearance: 'none' }} value={editCategoryId} onChange={e => setEditCategoryId(e.target.value)} onFocus={focus} onBlur={blur}>
                                        <option value="">Select Category</option>
                                        {availableCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={LABEL_ST}>Product Link</label>
                                <input style={INPUT_ST} type="url" placeholder="https://..." value={editLink} onChange={e => setEditLink(e.target.value)} onFocus={focus} onBlur={blur} />
                            </div>

                            <div>
                                <label style={LABEL_ST}>Change Image</label>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <label style={{
                                        flex: 1, padding: '0.9rem', background: 'var(--surface-2)', border: `2px dashed ${BORDER}`,
                                        borderRadius: '12px', textAlign: 'center', cursor: isUploading ? 'wait' : 'pointer',
                                        transition: 'all 0.2s', color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: 600,
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = BLUE}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
                                    >
                                        {isUploading ? <span style={{ fontWeight: 700, color: BLUE }}>Uploading...</span> : <><Upload size={17} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Upload New</>}
                                        <input type="file" accept="image/*" hidden onChange={handleImageUpload} disabled={isUploading} />
                                    </label>
                                    {editImage && (
                                        <div style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${BORDER}`, flexShrink: 0 }}>
                                            <img src={editImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button onClick={() => setEditImage('')} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={9} /></button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
                                <button onClick={handleSave} disabled={isUploading} style={{
                                    flex: 2, padding: '0.95rem', background: BLUE, color: '#fff', border: 'none', borderRadius: '14px',
                                    fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    cursor: 'pointer', boxShadow: '0 6px 20px rgba(var(--primary-rgb),0.3)',
                                }}><Check size={17} strokeWidth={3} /> Save Details</button>
                                <button onClick={() => setIsEditing(false)} style={{
                                    flex: 1, padding: '0.95rem', background: 'var(--surface-2)', color: 'var(--text-dim)', border: 'none', borderRadius: '14px',
                                    fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', fontFamily: 'inherit',
                                }}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        /* ══ VIEW MODE — Image left, details right ══ */
                        <div className="product-card-inner" style={{ display: 'flex', gap: 0, minHeight: '360px' }}>

                            {/* ── Left: Image Panel ── */}
                            <div className="product-image-panel" style={{
                                width: '46%',
                                flexShrink: 0,
                                background: 'var(--surface-2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '2rem',
                                borderRadius: '28px 0 0 28px',
                            }}>
                                <div className="product-image-inner" style={{
                                    width: '100%',
                                    maxWidth: '320px',
                                    aspectRatio: '1/1',
                                    background: 'var(--surface)',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    boxShadow: '0 8px 32px rgba(var(--primary-rgb),0.1)',
                                }}>
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            style={{
                                                width: '90%',
                                                height: '90%',
                                                objectFit: 'contain',
                                                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                        />
                                    ) : (
                                        <div style={{ fontSize: '4.5rem', opacity: 0.25 }}>🛍️</div>
                                    )}
                                </div>
                            </div>

                            {/* ── Right: Details Panel ── */}
                            <div className="product-details-panel" style={{
                                flex: 1,
                                padding: '2.25rem 2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.1rem',
                                justifyContent: 'center',
                                minWidth: 0,
                            }}>
                                <div className="text-details-group" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                                    {/* Category Badge */}
                                    <div className="text-details-category">
                                        <span style={{
                                            display: 'inline-block',
                                            background: 'var(--surface-2)',
                                            color: 'var(--text-muted)',
                                            padding: '0.3rem 0.8rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border)',
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.08em',
                                        }}>
                                            {categoryName}
                                        </span>
                                    </div>

                                    {/* Product Name */}
                                    <h1 className="text-details-name" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 900, color: 'var(--text)', margin: 0, lineHeight: 1.0, letterSpacing: '-0.02em' }}>
                                        {item.name}
                                    </h1>

                                    {/* Price */}
                                    <p className="text-details-price" style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
                                        {price}
                                    </p>
                                </div>

                                {/* Visit Product Page Button */}
                                <a
                                    href={item.link || '#'}
                                    target={item.link ? '_blank' : '_self'}
                                    rel="noopener noreferrer"
                                    onClick={e => { if (!item.link) e.preventDefault(); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.55rem',
                                        padding: '0.95rem 1.25rem',
                                        background: item.link ? BLUE : 'var(--surface-2)',
                                        color: item.link ? '#fff' : '#9CA3AF',
                                        borderRadius: '14px',
                                        fontWeight: 800, fontSize: '0.95rem', textDecoration: 'none',
                                        cursor: item.link ? 'pointer' : 'default',
                                        transition: 'all 0.2s ease',
                                        boxShadow: item.link ? '0 6px 20px rgba(var(--primary-rgb),0.3)' : 'none',
                                    }}
                                    onMouseEnter={e => { if (item.link) { e.currentTarget.style.background = '#0A2665'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                                    onMouseLeave={e => { if (item.link) { e.currentTarget.style.background = BLUE; e.currentTarget.style.transform = 'translateY(0)'; } }}
                                >
                                    <ExternalLink size={17} />
                                    {item.link ? 'Visit Product Page' : 'No link available'}
                                    {item.link && <span style={{ fontSize: '1.1rem' }}>→</span>}
                                </a>

                                {/* Mark as Purchased Button */}
                                {!item.is_purchased && (
                                    <button
                                        onClick={handlePurchase}
                                        style={{
                                            padding: '0.95rem 1.25rem',
                                            background: 'var(--surface)',
                                            color: '#16a34a',
                                            border: '2px solid #16a34a',
                                            borderRadius: '14px',
                                            fontWeight: 800, fontSize: '0.95rem',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.55rem',
                                            cursor: 'pointer', transition: 'all 0.2s ease',
                                            fontFamily: 'inherit',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#16a34a'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = '#16a34a'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                    >
                                        <PackageCheck size={18} /> Mark as Purchased
                                    </button>
                                )}

                                {/* Edit & Delete Buttons */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        style={{
                                            padding: '0.8rem', background: 'var(--surface-2)', color: 'var(--text)',
                                            border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.88rem',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
                                            cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = BLUE; e.currentTarget.style.color = '#fff'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text)'; }}
                                    >
                                        <Edit size={16} /> Edit
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        style={{
                                            padding: '0.8rem', background: 'var(--surface-2)', color: '#ef4444',
                                            border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.88rem',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
                                            cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = '#ef4444'; }}
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>

                                {/* Source Link */}
                                {item.link && (
                                    <div style={{
                                        padding: '0.75rem 1rem',
                                        background: 'var(--surface-2)',
                                        borderRadius: '12px',
                                        border: `1px solid ${BORDER}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.6rem',
                                        minWidth: 0,
                                    }}>
                                        <ExternalLink size={14} style={{ color: 'var(--text)', flexShrink: 0 }} />
                                        <p style={{
                                            margin: 0, fontSize: '0.78rem', color: 'var(--text)',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>
                                            Source: {item.link.replace(/^https?:\/\//, '')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes cardIn {
                    from { opacity: 0; transform: translateY(24px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
            <AlertModal
                isOpen={showDeleteConfirm}
                title="wishflowlist.vercel.app says"
                message="Delete this item from your WishFlow?"
                cancelText="Cancel"
                confirmText="OK"
                onCancel={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
            />
        </div>
    );
}
