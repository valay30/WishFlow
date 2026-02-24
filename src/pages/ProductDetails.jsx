import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../db';
import { Trash2, Edit, ArrowLeft, ExternalLink, Upload, X, Check, ArrowRight, PackageCheck } from 'lucide-react';
import { uploadToImageKit } from '../utils/imagekit';

const ORANGE = '#10367D';
const SURFACE = '#FFFFFF';
const SURFACE2 = '#F5F5F5';
const BORDER = '#D1D5DB';
const BG = '#EBEBEB';

const INPUT_ST = {
    width: '100%', padding: '0.85rem 1rem',
    background: SURFACE2, border: `1.5px solid ${BORDER}`,
    borderRadius: '14px', color: '#111',
    fontFamily: 'inherit', fontSize: '0.95rem',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
};
const LABEL_ST = {
    display: 'block', marginBottom: '0.4rem',
    fontSize: '0.72rem', fontWeight: 700,
    color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.06em',
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

    useEffect(() => {
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
        if (window.confirm('Delete this item from your WishFlow?')) {
            await db.items.delete(item.id);
            navigate('/');
        }
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
                navigate('/');
            }
        } catch (err) {
            alert("Error marking as purchased: " + err.message + "\n\nDid you run the SQL snippet in Supabase to add the 'is_purchased' column?");
        }
    };

    const focus = e => e.target.style.borderColor = ORANGE;
    const blur = e => e.target.style.borderColor = BORDER;

    if (!item) return (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <p style={{ fontWeight: 700, color: ORANGE, marginBottom: '1rem', fontSize: '1.1rem' }}>Item not found.</p>
            <button onClick={() => navigate('/')} style={{
                padding: '0.75rem 2rem', background: ORANGE, color: '#fff',
                border: 'none', borderRadius: '99px', fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.95rem',
            }}>← Go Home</button>
        </div>
    );

    const categoryName = availableCategories.find(c => c.id === item.category_id)?.name || 'Uncategorized';
    const price = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(item.price);

    return (
        <div style={{ minHeight: '100%', background: BG }}>
            {/* ── Hero Section (Image Showcase) ── */}
            <div style={{
                background: `linear-gradient(160deg, #051A44 0%, #0A2665 55%, #10367D 100%)`,
                padding: '1.5rem 1.5rem 6.5rem',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                color: '#fff',
                overflow: 'hidden'
            }}>
                {/* Decorative Background Elements */}
                <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '10%', left: '-10%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)', borderRadius: '50%' }} />

                {/* Back Button */}
                <div style={{ position: 'absolute', top: '2.5rem', left: '1.5rem', zIndex: 10 }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                            color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.85rem',
                            cursor: 'pointer', fontFamily: 'inherit',
                            padding: '0.6rem 1.1rem', borderRadius: '99px',
                            backdropFilter: 'blur(10px)',
                            transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                </div>

                {/* Hero Image */}
                <div style={{
                    marginTop: '3.5rem',
                    width: '100%',
                    maxWidth: '260px',
                    aspectRatio: '1/1',
                    background: '#fff',
                    borderRadius: '40px',
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
                    animation: 'fadeInUp 0.6s ease-out backwards',
                    position: 'relative',
                    zIndex: 2
                }}>
                    {item.image ? (
                        <img
                            src={item.image}
                            alt={item.name}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.1))',
                                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        />
                    ) : (
                        <div style={{ fontSize: '5rem', opacity: 0.2 }}>🛍️</div>
                    )}
                </div>
            </div>

            {/* ── Content Sheet ── */}
            <div style={{
                background: BG,
                borderRadius: '32px 32px 0 0',
                marginTop: '-3rem',
                padding: '2.5rem 1.5rem',
                position: 'relative',
                zIndex: 3,
                minHeight: '60vh'
            }}>
                <div style={{ maxWidth: '640px', margin: '0 auto' }}>

                    <div style={{
                        background: SURFACE,
                        borderRadius: '32px',
                        padding: '2.5rem 2rem',
                        boxShadow: '0 -4px 30px rgba(0,0,0,0.03), 0 16px 40px rgba(0,0,0,0.05)',
                        animation: 'fadeInUp 0.4s ease-out 0.1s backwards'
                    }}>
                        {isEditing ? (
                            /* ── EDIT FORM ── */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16,54,125,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ORANGE }}>
                                        <Edit size={20} />
                                    </div>
                                    <h3 style={{ fontWeight: 900, fontSize: '1.25rem', color: '#111', margin: 0 }}>Edit Details</h3>
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
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <label style={{
                                            flex: 1, padding: '1rem', background: '#F9FAFB', border: `2px dashed ${BORDER}`,
                                            borderRadius: '16px', textAlign: 'center', cursor: isUploading ? 'wait' : 'pointer',
                                            transition: 'all 0.2s'
                                        }} onMouseEnter={e => e.currentTarget.style.borderColor = ORANGE}>
                                            {isUploading ? <span style={{ fontWeight: 700, color: ORANGE }}>Uploading...</span> : <><Upload size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Upload New</>}
                                            <input type="file" accept="image/*" hidden onChange={handleImageUpload} disabled={isUploading} />
                                        </label>
                                        {editImage && (
                                            <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${BORDER}` }}>
                                                <img src={editImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button onClick={() => setEditImage('')} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={10} /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                    <button onClick={handleSave} disabled={isUploading} style={{
                                        flex: 2, padding: '1rem', background: ORANGE, color: '#fff', border: 'none', borderRadius: '18px',
                                        fontWeight: 900, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        cursor: 'pointer', boxShadow: '0 8px 20px rgba(16,54,125,0.25)'
                                    }}><Check size={18} strokeWidth={3} /> Save Details</button>
                                    <button onClick={() => setIsEditing(false)} style={{
                                        flex: 1, padding: '1rem', background: '#fff', color: '#6B7280', border: `1px solid ${BORDER}`, borderRadius: '18px',
                                        fontWeight: 700, cursor: 'pointer'
                                    }}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            /* ── VIEW MODE ── */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* Info Group */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <span style={{
                                            background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a',
                                            padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem',
                                            fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em'
                                        }}>
                                            {categoryName}
                                        </span>
                                        <span style={{ fontSize: '1.6rem', fontWeight: 900, color: ORANGE, letterSpacing: '-0.02em' }}>
                                            {price}
                                        </span>
                                    </div>
                                    <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#111', margin: '0.25rem 0 0', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
                                        {item.name}
                                    </h1>
                                </div>

                                {/* Primary Actions */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                    <a
                                        href={item.link || '#'}
                                        target={item.link ? '_blank' : '_self'}
                                        rel="noopener noreferrer"
                                        onClick={e => { if (!item.link) e.preventDefault(); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                                            padding: '1.15rem', background: item.link ? 'linear-gradient(135deg, #10367D, #1a4fba)' : '#F3F4F6',
                                            color: item.link ? '#fff' : '#9CA3AF', borderRadius: '20px',
                                            fontWeight: 800, fontSize: '1.05rem', textDecoration: 'none',
                                            cursor: item.link ? 'pointer' : 'default', transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                            boxShadow: item.link ? '0 10px 24px rgba(16,54,125,0.25)' : 'none'
                                        }}
                                        onMouseEnter={e => { if (item.link) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 30px rgba(16,54,125,0.35)'; } }}
                                        onMouseLeave={e => { if (item.link) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(16,54,125,0.25)'; } }}
                                    >
                                        <ExternalLink size={20} />
                                        {item.link ? 'Visit Product Page' : 'No link available'}
                                        {item.link && <ArrowRight size={20} style={{ marginLeft: '4px' }} />}
                                    </a>

                                    {!item.is_purchased && (
                                        <button
                                            onClick={handlePurchase}
                                            style={{
                                                padding: '1.15rem', background: 'rgba(34, 197, 94, 0.08)',
                                                color: '#16a34a', border: '2px solid rgba(34, 197, 94, 0.15)',
                                                borderRadius: '20px', fontWeight: 800, fontSize: '1.05rem',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                gap: '0.6rem', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#16a34a'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.08)'; e.currentTarget.style.color = '#16a34a'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                        >
                                            <PackageCheck size={22} /> Mark as Purchased
                                        </button>
                                    )}
                                </div>

                                {/* Secondary Actions */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        style={{
                                            padding: '1rem', background: '#F3F4F6', color: '#4B5563',
                                            border: 'none', borderRadius: '20px', fontWeight: 800, fontSize: '0.95rem',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                            cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = ORANGE; e.currentTarget.style.color = '#fff'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#4B5563'; }}
                                    >
                                        <Edit size={18} /> Edit
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        style={{
                                            padding: '1rem', background: 'rgba(239, 68, 68, 0.06)', color: '#ef4444',
                                            border: 'none', borderRadius: '20px', fontWeight: 800, fontSize: '0.95rem',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                            cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.06)'; e.currentTarget.style.color = '#ef4444'; }}
                                    >
                                        <Trash2 size={18} /> Delete
                                    </button>
                                </div>

                                {/* Link Metadata */}
                                {item.link && (
                                    <div style={{
                                        padding: '1rem', background: '#F9FAFB', borderRadius: '18px',
                                        border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: '0.75rem'
                                    }}>
                                        <div style={{ color: '#9CA3AF' }}><ExternalLink size={16} /></div>
                                        <p style={{
                                            margin: 0, fontSize: '0.8rem', color: '#6B7280',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                        }}>
                                            {item.link}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
