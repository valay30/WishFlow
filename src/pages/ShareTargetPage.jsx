import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db, supabase } from '../db';
import { useAuth } from '../context/useAuth';
import { useSettings } from '../context/SettingsContext';
import LinkScraper from '../components/LinkScraper';
import CustomSelect from '../components/CustomSelect';
import AlertModal from '../components/AlertModal';
import { Sparkles, Check, X, ArrowLeft } from 'lucide-react';
import { API_URL } from '../config';

const PRIMARY = 'var(--primary)';
const SURFACE2 = 'var(--surface-2)';
const BORDER = 'var(--border)';

const INPUT_ST = {
    width: '100%', padding: '0.85rem 1rem',
    background: SURFACE2, border: `1.5px solid ${BORDER}`,
    borderRadius: '14px', color: 'var(--text)',
    fontFamily: 'inherit', fontSize: '0.95rem',
    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
};

const LABEL_ST = {
    display: 'block', marginBottom: '0.4rem',
    fontSize: '0.72rem', fontWeight: 700,
    color: PRIMARY, textTransform: 'uppercase', letterSpacing: '0.06em',
};

// Extract a URL from a text string (for "text" share param)
function extractUrlFromText(text) {
    if (!text) return null;
    const match = text.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : null;
}

export default function ShareTargetPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { currency } = useSettings();

    const [sharedUrl, setSharedUrl] = useState('');
    const [categories, setCategories] = useState([]);
    const [collections, setCollections] = useState([]);

    // Form state
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [link, setLink] = useState('');
    const [image, setImage] = useState('');
    const [catId, setCatId] = useState('');
    const [colId, setColId] = useState('');
    const [flashFields, setFlashFields] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [alert, setAlert] = useState({ isOpen: false, success: false, title: '', message: '' });

    // Extract shared URL from query params
    useEffect(() => {
        const urlParam = searchParams.get('url');
        const textParam = searchParams.get('text');
        const titleParam = searchParams.get('title');

        const extracted = urlParam || extractUrlFromText(textParam);
        if (extracted) {
            setSharedUrl(extracted);
            setLink(extracted);
        }
        if (titleParam) setName(titleParam);
    }, [searchParams]);

    // Load categories & collections
    useEffect(() => {
        Promise.all([db.categories.getAll(), db.collections.getAll()])
            .then(([cats, cols]) => {
                setCategories(cats || []);
                setCollections(cols || []);
            });
    }, []);

    const flashField = (fields) => {
        setFlashFields(fields);
        setTimeout(() => setFlashFields({}), 1500);
    };

    const handleScraperResult = ({ title, price: p, image: img, categoryId, url: productUrl }) => {
        const filled = {};
        if (title) { setName(title); filled.name = true; }
        if (p) { setPrice(String(p)); filled.price = true; }
        if (img) { setImage(img); filled.image = true; }
        if (productUrl) { setLink(productUrl); filled.link = true; }
        if (categoryId && categoryId !== -1) {
            const match = categories.find(c => c.id === categoryId);
            if (match) { setCatId(String(match.id)); filled.catId = true; }
        } else {
            const other = categories.find(c => c.name.toLowerCase() === 'other');
            if (other) { setCatId(String(other.id)); filled.catId = true; }
        }
        flashField(filled);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!name || !price || !catId) return;

        setIsSaving(true);
        try {
            // Check premium limit
            const { count, error: countError } = await supabase
                .from('items')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user?.id);

            if (!countError && count >= 5 && user?.isPremium !== true) {
                setAlert({
                    isOpen: true,
                    success: false,
                    title: 'Limit Reached',
                    message: 'You have reached the free tier limit of 5 items. Upgrade to WishFlow Premium to add unlimited items!',
                });
                return;
            }

            await db.items.add({
                name,
                price: parseFloat(price),
                link,
                image,
                category_id: parseInt(catId),
                collection_id: colId || null,
            });

            setAlert({
                isOpen: true,
                success: true,
                title: '✅ Item Saved!',
                message: `"${name}" has been added to your wishlist!`,
            });
        } catch (err) {
            console.error('Save error:', err);
            setAlert({ isOpen: true, success: false, title: 'Error', message: 'Failed to save item. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    };

    const focus = e => { e.target.style.borderColor = PRIMARY; e.target.style.boxShadow = `0 0 0 4px rgba(var(--primary-rgb),0.12)`; };
    const blur = e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; };

    return (
        <div style={{
            minHeight: '100dvh',
            background: 'var(--bg)',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* Header */}
            <div style={{
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'var(--surface)',
                borderBottom: '1px solid var(--border)',
                position: 'sticky',
                top: 0,
                zIndex: 10,
            }}>
                <button
                    onClick={() => navigate('/home')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '4px' }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={18} color={PRIMARY} />
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>Add Shared Item</span>
                </div>
            </div>

            <div style={{ flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '560px', margin: '0 auto', width: '100%' }}>

                {/* LinkScraper — auto-triggers if sharedUrl is present */}
                <LinkScraper
                    categories={categories}
                    onResult={handleScraperResult}
                    autoFetchUrl={sharedUrl || null}
                />

                <div style={{ borderTop: '1px solid var(--border)' }} />

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Name */}
                    <div>
                        <label style={LABEL_ST}>Product Name *</label>
                        <input
                            style={{ ...INPUT_ST, ...(flashFields.name ? { borderColor: PRIMARY, boxShadow: '0 0 0 4px rgba(var(--primary-rgb),0.15)' } : {}) }}
                            required placeholder="e.g. Nike Air Force 1"
                            value={name} onChange={e => setName(e.target.value)} onFocus={focus} onBlur={blur}
                        />
                    </div>

                    {/* Price & Category */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                            <label style={LABEL_ST}>
                                Price ({new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR' }).formatToParts(0).find(x => x.type === 'currency').value}) *
                            </label>
                            <input
                                style={{ ...INPUT_ST, ...(flashFields.price ? { borderColor: PRIMARY, boxShadow: '0 0 0 4px rgba(var(--primary-rgb),0.15)' } : {}) }}
                                type="number" step="0.01" required placeholder="0.00"
                                value={price} onChange={e => setPrice(e.target.value)} onFocus={focus} onBlur={blur}
                            />
                        </div>
                        <div>
                            <label style={LABEL_ST}>Category *</label>
                            <CustomSelect
                                value={catId}
                                onChange={val => setCatId(val)}
                                options={categories.map(c => ({ value: c.id, label: c.name }))}
                                placeholder="Category"
                                required
                            />
                        </div>
                    </div>

                    {/* Link */}
                    <div>
                        <label style={LABEL_ST}>Product Link</label>
                        <input
                            style={{ ...INPUT_ST, ...(flashFields.link ? { borderColor: PRIMARY, boxShadow: '0 0 0 4px rgba(var(--primary-rgb),0.15)' } : {}) }}
                            type="text" placeholder="https://..."
                            value={link} onChange={e => setLink(e.target.value)} onFocus={focus} onBlur={blur}
                        />
                    </div>

                    {/* Image preview */}
                    {image && (
                        <div>
                            <label style={LABEL_ST}>Image Preview</label>
                            <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: `1.5px solid ${PRIMARY}`, maxHeight: '160px' }}>
                                <img src={image} alt="Preview" style={{ width: '100%', objectFit: 'cover', maxHeight: '160px', display: 'block' }} />
                                <button type="button" onClick={() => setImage('')} style={{ position: 'absolute', top: '0.4rem', right: '0.4rem', background: 'rgba(0,0,0,0.7)', color: '#ef4444', border: 'none', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <X size={13} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Collection */}
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

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
                        <button type="button" onClick={() => navigate('/home')} style={{ flex: 1, padding: '0.9rem', background: 'var(--surface-2)', color: 'var(--text-dim)', border: `1px solid ${BORDER}`, borderRadius: '14px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={isSaving || !name || !price || !catId} style={{ flex: 2, padding: '0.9rem', background: (!name || !price || !catId) ? 'rgba(var(--primary-rgb),0.4)' : PRIMARY, color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 800, fontSize: '0.95rem', cursor: (!name || !price || !catId) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 16px rgba(var(--primary-rgb),0.3)', transition: 'all 0.2s' }}>
                            {isSaving ? (
                                <><span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Saving...</>
                            ) : (
                                <><Check size={16} /> Save to Wishlist</>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <AlertModal
                isOpen={alert.isOpen}
                title={alert.title}
                message={alert.message}
                onConfirm={() => {
                    setAlert({ ...alert, isOpen: false });
                    if (alert.success) navigate('/home');
                }}
            />

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
