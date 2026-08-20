import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Sparkles } from 'lucide-react';
import { uploadToImageKit } from '../utils/imagekit';
import { db } from '../db';
import { useSettings } from '../context/SettingsContext';
import CustomSelect from './CustomSelect';
import LinkScraper from './LinkScraper';

const ORANGE = 'var(--primary)';
const SURFACE2 = 'var(--surface-2)';
const BORDER = 'var(--border)';

const LABEL_ST = {
    display: 'block', marginBottom: '0.35rem',
    fontSize: '0.75rem', fontWeight: 700,
    color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.05em',
};

const INPUT_ST = {
    width: '100%', padding: '0.85rem 1rem',
    background: SURFACE2, border: `1.5px solid ${BORDER}`,
    borderRadius: '14px', color: 'var(--text)',
    fontFamily: 'inherit', fontSize: '0.95rem',
    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
};

export default function AddProductModal({ categories, onAdd, onClose }) {
    const [name, setName] = useState('');
    const { currency } = useSettings();
    const [price, setPrice] = useState('');
    const [link, setLink] = useState('');
    const [image, setImage] = useState('');
    const [catId, setCatId] = useState('');
    const [colId, setColId] = useState('');
    const [collections, setCollections] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [flashFields, setFlashFields] = useState({});

    // Flash highlight an auto-filled field briefly
    const flashField = (fields) => {
        setFlashFields(fields);
        setTimeout(() => setFlashFields({}), 1500);
    };

    // Called when LinkScraper returns product data
    const handleScraperResult = ({ title, price: p, image: img, categoryId, url: productUrl }) => {
        const filled = {};
        if (title) { setName(title); filled.name = true; }
        if (p) { setPrice(String(p)); filled.price = true; }
        if (img) { setImage(img); filled.image = true; }
        if (productUrl) { setLink(productUrl); filled.link = true; }
        // Match category: if categoryId is valid (not -1), select it; else try to find 'Other'
        if (categoryId && categoryId !== -1) {
            const match = categories.find(c => c.id === categoryId);
            if (match) { setCatId(String(match.id)); filled.catId = true; }
        } else {
            const other = categories.find(c => c.name.toLowerCase() === 'other');
            if (other) { setCatId(String(other.id)); filled.catId = true; }
        }
        flashField(filled);
    };

    useEffect(() => {
        db.collections.getAll().then(res => setCollections(res || []));
    }, []);

    const focus = e => { e.target.style.borderColor = ORANGE; e.target.style.boxShadow = `0 0 0 4px rgba(var(--primary-rgb),0.12)`; };
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !price || !catId) return;
        const allowed = await onAdd({ name, price: parseFloat(price), link, image, category_id: parseInt(catId), collection_id: colId || null });
        if (allowed !== false) onClose();
    };

    return createPortal(
        <>
            <div onClick={onClose} className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)', zIndex: 1998, animation: 'fadeIn 0.2s ease-out' }} />
            <div className="modal-wrapper" style={{ zIndex: 1999 }}>
                <div onClick={e => e.stopPropagation()} className="modal-card" style={{ background: 'var(--surface)', borderRadius: '28px 28px 0 0', width: '100%', maxWidth: '560px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.7)', animation: 'slideUp 0.28s cubic-bezier(0.2,0.8,0.4,1)', border: `1px solid ${BORDER}`, borderBottom: 'none', position: 'relative' }}>
                    {/* Drag handle */}
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '0.85rem 0 0' }}>
                        <div style={{ width: '40px', height: '4px', borderRadius: '99px', background: 'var(--border)' }} />
                    </div>

                    <div style={{ padding: '0.75rem 1.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: ORANGE }}>Add New Item</h2>
                        <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}>
                            <X size={16} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} style={{ padding: '1rem 1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* AI Auto-Fill Strip */}
                        <LinkScraper
                            categories={categories}
                            onResult={handleScraperResult}
                        />

                        <div style={{ borderTop: '1px solid var(--border)', margin: '0 -0.25rem' }} />

                        <div style={{ position: 'relative' }}>
                            <label style={LABEL_ST}>Product Name</label>
                            <input
                                style={{ ...INPUT_ST, ...(flashFields.name ? { borderColor: 'var(--primary)', boxShadow: '0 0 0 4px rgba(var(--primary-rgb),0.15)', transition: 'all 0.3s' } : {}) }}
                                required placeholder="e.g. Wireless Headphones"
                                value={name} onChange={e => setName(e.target.value)} onFocus={focus} onBlur={blur}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={LABEL_ST}>Price ({new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR' }).formatToParts(0).find(x => x.type === 'currency').value})</label>
                                <input
                                    style={{ ...INPUT_ST, ...(flashFields.price ? { borderColor: 'var(--primary)', boxShadow: '0 0 0 4px rgba(var(--primary-rgb),0.15)' } : {}) }}
                                    type="number" step="0.01" required placeholder="0.00"
                                    value={price} onChange={e => setPrice(e.target.value)} onFocus={focus} onBlur={blur}
                                />
                            </div>
                            <div>
                                <label style={LABEL_ST}>Category</label>
                                <CustomSelect
                                    value={catId}
                                    onChange={val => setCatId(val)}
                                    options={categories.map(c => ({ value: c.id, label: c.name }))}
                                    placeholder="Category"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label style={LABEL_ST}>Product Link (optional)</label>
                            <input
                                style={{ ...INPUT_ST, ...(flashFields.link ? { borderColor: 'var(--primary)', boxShadow: '0 0 0 4px rgba(var(--primary-rgb),0.15)' } : {}) }}
                                type="text" placeholder="https://..."
                                value={link} onChange={e => setLink(e.target.value)} onFocus={focus} onBlur={blur}
                            />
                        </div>
                        <div>
                            <label style={LABEL_ST}>Image</label>
                            {!image ? (
                                <label style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                                    width: '100%', padding: '0.85rem 1rem',
                                    background: 'var(--surface-2)', color: ORANGE,
                                    borderRadius: '14px', cursor: isUploading ? 'wait' : 'pointer',
                                    border: `1.5px dashed ${ORANGE}`, opacity: isUploading ? 0.7 : 1,
                                    fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s'
                                }}>
                                    {isUploading ? (
                                        <>
                                            <span style={{ width: '16px', height: '16px', border: '2px solid rgba(var(--primary-rgb),0.4)', borderTopColor: ORANGE, borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                                            Uploading Image...
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={18} /> Upload Image
                                        </>
                                    )}
                                    <input type="file" accept="image/*" hidden onChange={handleImageUpload} disabled={isUploading} />
                                </label>
                            ) : (
                                <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: `1.5px solid ${ORANGE}`, maxHeight: '140px' }}>
                                    <img src={image} alt="Preview" style={{ width: '100%', objectFit: 'cover', maxHeight: '140px', display: 'block' }} />
                                    <button type="button" onClick={() => setImage('')} style={{ position: 'absolute', top: '0.4rem', right: '0.4rem', background: 'rgba(0,0,0,0.7)', color: '#ef4444', border: 'none', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                        <X size={13} />
                                    </button>
                                </div>
                            )}
                        </div>
                        {/* Collection picker — only shown if user has collections */}
                        {collections.length > 0 && (
                            <div>
                                <label style={LABEL_ST}>Add to Collection (optional)</label>
                                <CustomSelect
                                    value={colId}
                                    onChange={val => setColId(val)}
                                    options={[{ value: '', label: 'None' }, ...collections.map(c => ({ value: c.id, label: `${c.emoji || ''} ${c.name}` }))]}
                                    placeholder="None"
                                />
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
                            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.9rem', background: 'var(--surface-2)', color: 'var(--text-dim)', border: `1px solid ${BORDER}`, borderRadius: '14px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                            <button type="submit" disabled={isUploading} style={{ flex: 2, padding: '0.9rem', background: isUploading ? 'rgba(var(--primary-rgb),0.5)' : ORANGE, color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 800, fontSize: '0.95rem', cursor: isUploading ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 16px rgba(var(--primary-rgb),0.4)' }}>
                                Save Product
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
