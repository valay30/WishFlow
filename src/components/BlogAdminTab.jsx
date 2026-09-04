import { useState, useEffect, useCallback } from 'react';
import { API_URL as API, ADMIN_SECRET } from '../config';
import { uploadToImageKit } from '../utils/imagekit';
import {
    Plus, Trash2, Edit3, Eye, EyeOff, RefreshCw,
    ChevronUp, ChevronDown, BookOpen, ArrowLeft,
    AlignLeft, Heading2, Heading3, List, Lightbulb,
    Megaphone, Tv2, Save, Globe
} from 'lucide-react';

const H = { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET };
const FONT = "'Outfit', sans-serif";

/* ── Helpers ────────────────────────────────────────────────────────────── */
const slugify = (str) =>
    str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const CATEGORY_COLORS = [
    { label: 'Coral', value: '#E97451' },
    { label: 'Purple', value: '#9B59B6' },
    { label: 'Blue', value: '#2980B9' },
    { label: 'Green', value: '#27AE60' },
    { label: 'Red', value: '#E74C3C' },
    { label: 'Navy', value: '#2C3E50' },
];

const SECTION_TYPES = [
    { type: 'p',       icon: AlignLeft,  label: 'Paragraph' },
    { type: 'h2',      icon: Heading2,   label: 'Heading 2' },
    { type: 'h3',      icon: Heading3,   label: 'Heading 3' },
    { type: 'list',    icon: List,       label: 'Bullet List' },
    { type: 'tip',     icon: Lightbulb,  label: 'Tip Box' },
    { type: 'callout', icon: Megaphone,  label: 'Callout Box' },
    { type: 'ad',      icon: Tv2,        label: 'Ad Unit' },
];

function newSection(type = 'p') {
    if (type === 'list') return { type, items: [''] };
    if (type === 'ad') return { type };
    return { type, text: '' };
}

const EMPTY_FORM = {
    slug: '', title: '', excerpt: '', category: 'Gift Guides',
    categoryColor: '#E97451', readTime: '5 min read',
    publishedAt: '', coverImage: '', coverAlt: '',
    author: 'WishFlow Team', metaDescription: '',
    isPublished: false, content: [newSection('p')],
};

/* ── Section Builder ────────────────────────────────────────────────────── */
function SectionCard({ section, index, total, onChange, onRemove, onMove }) {
    const typeInfo = SECTION_TYPES.find(t => t.type === section.type) || SECTION_TYPES[0];
    const Icon = typeInfo.icon;

    const updateText = (e) => onChange(index, { ...section, text: e.target.value });
    const updateItem = (i, val) => {
        const items = [...(section.items || [])];
        items[i] = val;
        onChange(index, { ...section, items });
    };
    const addItem = () => onChange(index, { ...section, items: [...(section.items || []), ''] });
    const removeItem = (i) => {
        const items = (section.items || []).filter((_, idx) => idx !== i);
        onChange(index, { ...section, items });
    };
    const changeType = (newType) => onChange(index, newSection(newType));

    const cardBg = { p: '#fff', h2: '#f0f4ff', h3: '#f5f0ff', list: '#fff8f0', tip: '#f0fbff', callout: '#fff5f0', ad: '#f8f8f8' }[section.type] || '#fff';
    const cardBorder = { p: '#e2e8f0', h2: '#c7d2fe', h3: '#ddd6fe', list: '#fed7aa', tip: '#bae6fd', callout: '#fca5a5', ad: '#cbd5e1' }[section.type] || '#e2e8f0';

    return (
        <div style={{ background: cardBg, border: `1.5px solid ${cardBorder}`, borderRadius: '14px', padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
            {/* Reorder buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flexShrink: 0 }}>
                <button onClick={() => onMove(index, 'up')} disabled={index === 0} title="Move up"
                    style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '3px', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.3 : 1, display: 'flex' }}>
                    <ChevronUp size={14} />
                </button>
                <button onClick={() => onMove(index, 'down')} disabled={index === total - 1} title="Move down"
                    style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '3px', cursor: index === total - 1 ? 'not-allowed' : 'pointer', opacity: index === total - 1 ? 0.3 : 1, display: 'flex' }}>
                    <ChevronDown size={14} />
                </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Type selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                    <Icon size={14} style={{ color: '#64748b', flexShrink: 0 }} />
                    <select value={section.type} onChange={e => changeType(e.target.value)}
                        style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: FONT, background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '2px 6px', cursor: 'pointer', color: '#334155' }}>
                        {SECTION_TYPES.map(t => (
                            <option key={t.type} value={t.type}>{t.label}</option>
                        ))}
                    </select>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: FONT }}>Section {index + 1}</span>
                </div>

                {/* Content input by type */}
                {section.type === 'ad' ? (
                    <div style={{ padding: '0.5rem 0.75rem', background: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 10px, transparent 10px, transparent 20px)', border: '1px dashed #cbd5e1', borderRadius: '8px', fontSize: '0.78rem', color: '#94a3b8', fontFamily: FONT, textAlign: 'center' }}>
                        📢 Ad Unit — automatically shows your AdSense banner here
                    </div>
                ) : section.type === 'list' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {(section.items || []).map((item, i) => (
                            <div key={i} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                <span style={{ color: '#94a3b8', fontSize: '0.8rem', flexShrink: 0 }}>•</span>
                                <input value={item} onChange={e => updateItem(i, e.target.value)}
                                    placeholder={`List item ${i + 1}`}
                                    style={{ flex: 1, padding: '0.4rem 0.6rem', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '0.88rem', fontFamily: FONT, outline: 'none', background: '#fff' }} />
                                <button onClick={() => removeItem(i)} disabled={(section.items || []).length <= 1}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: (section.items || []).length <= 1 ? 0.3 : 1, padding: '2px', display: 'flex' }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        <button onClick={addItem} style={{ marginTop: '0.25rem', background: 'none', border: '1px dashed #cbd5e1', borderRadius: '7px', padding: '0.35rem 0.75rem', fontSize: '0.78rem', fontFamily: FONT, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                            <Plus size={12} /> Add item
                        </button>
                    </div>
                ) : (
                    <textarea value={section.text || ''} onChange={updateText}
                        placeholder={`Enter ${typeInfo.label.toLowerCase()} text…`}
                        rows={section.type === 'p' ? 3 : 2}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', fontFamily: FONT, resize: 'vertical', outline: 'none', lineHeight: 1.6, fontWeight: section.type.startsWith('h') ? 700 : 400 }} />
                )}
            </div>

            {/* Delete button */}
            <button onClick={() => onRemove(index)} title="Delete section"
                style={{ background: 'none', border: '1px solid #fee2e2', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#ef4444', flexShrink: 0, alignSelf: 'flex-start', display: 'flex' }}>
                <Trash2 size={15} />
            </button>
        </div>
    );
}

/* ── Add Section Bar ─────────────────────────────────────────────────────── */
function AddSectionBar({ onAdd }) {
    return (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '1rem', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '14px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', fontFamily: FONT, alignSelf: 'center', marginRight: '0.25rem' }}>+ Add:</span>
            {SECTION_TYPES.map(({ type, icon: Icon, label }) => (
                <button key={type} onClick={() => onAdd(type)}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0.35rem 0.75rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '99px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, fontFamily: FONT, color: '#334155', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f0f4ff'; e.currentTarget.style.borderColor = '#a5b4fc'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                    <Icon size={13} /> {label}
                </button>
            ))}
        </div>
    );
}

/* ── Blog Form (Create / Edit) ───────────────────────────────────────────── */
function BlogForm({ post, onSave, onCancel, showToast }) {
    const isEdit = !!post?.id;
    const [form, setForm] = useState(post ? { ...post } : { ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [titleManualSlug, setTitleManualSlug] = useState(isEdit);

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
    const setContent = (content) => setForm(f => ({ ...f, content }));

    // Auto-generate slug from title
    const handleTitleChange = (val) => {
        set('title', val);
        if (!titleManualSlug) set('slug', slugify(val));
    };

    const addSection = (type) => setContent([...form.content, newSection(type)]);
    const updateSection = (i, updated) => {
        const c = [...form.content]; c[i] = updated; setContent(c);
    };
    const removeSection = (i) => setContent(form.content.filter((_, idx) => idx !== i));
    const moveSection = (i, dir) => {
        const c = [...form.content];
        const j = dir === 'up' ? i - 1 : i + 1;
        [c[i], c[j]] = [c[j], c[i]];
        setContent(c);
    };

    const handleSave = async (publish = null) => {
        if (!form.title.trim()) return showToast('Title is required', 'error');
        if (!form.slug.trim()) return showToast('Slug is required', 'error');
        setSaving(true);
        try {
            const payload = { ...form, isPublished: publish !== null ? publish : form.isPublished };
            const url = isEdit ? `${API}/api/admin/blog/${post.id}` : `${API}/api/admin/blog`;
            const method = isEdit ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: H, body: JSON.stringify(payload) });
            if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Save failed'); }
            const saved = await res.json();
            showToast(isEdit ? 'Post updated ✓' : 'Post created ✓');
            onSave(saved);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '0.7rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '0.93rem', fontFamily: FONT, outline: 'none', color: '#0f172a', background: '#fff', transition: 'border-color 0.2s' };
    const labelStyle = { display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em' };
    const focusStyle = (e) => e.target.style.borderColor = '#6d28d9';
    const blurStyle = (e) => e.target.style.borderColor = '#e2e8f0';

    return (
        <div style={{ fontFamily: FONT }}>
            <style>{`
                .blog-form-grid {
                    display: grid;
                    grid-template-columns: 1fr 320px;
                    gap: 2rem;
                    align-items: start;
                }
                @media (max-width: 768px) {
                    .blog-form-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .slug-prefix-text {
                        display: none;
                    }
                    .slug-input {
                        padding-left: 4.5rem !important;
                    }
                }
            `}</style>
            {/* Form header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.5rem 1rem', cursor: 'pointer', fontFamily: FONT, fontWeight: 700, fontSize: '0.85rem', color: '#64748b' }}>
                    <ArrowLeft size={15} /> Back
                </button>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
                        {isEdit ? 'Edit Post' : 'New Blog Post'}
                    </h2>
                    <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                        {isEdit ? `Editing: ${post.title}` : 'Create a new article for the blog'}
                    </p>
                </div>
            </div>

            <div className="blog-form-grid">
                {/* Left: main content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Title */}
                    <div>
                        <label style={labelStyle}>Title *</label>
                        <input value={form.title} onChange={e => handleTitleChange(e.target.value)} placeholder="Your article title" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>

                    {/* Slug */}
                    <div>
                        <label style={labelStyle}>Slug * <span style={{ fontWeight: 400, textTransform: 'none', color: '#94a3b8' }}>(URL path)</span></label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: '#94a3b8', fontFamily: FONT }}>
                                <span className="slug-prefix-text">wishflow.shop</span>/blog/
                            </span>
                            <input className="slug-input" value={form.slug} onChange={e => { setTitleManualSlug(true); set('slug', e.target.value); }} placeholder="your-article-slug" style={{ ...inputStyle, paddingLeft: '12rem' }} onFocus={focusStyle} onBlur={blurStyle} />
                        </div>
                    </div>

                    {/* Excerpt */}
                    <div>
                        <label style={labelStyle}>Excerpt <span style={{ fontWeight: 400, textTransform: 'none', color: '#94a3b8' }}>(shown on listing card)</span></label>
                        <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)} placeholder="1-2 sentence summary shown on the blog card…" rows={2} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>

                    {/* Meta Description */}
                    <div>
                        <label style={labelStyle}>Meta Description <span style={{ fontWeight: 400, textTransform: 'none', color: '#94a3b8' }}>(SEO — ~155 chars)</span></label>
                        <textarea value={form.metaDescription} onChange={e => set('metaDescription', e.target.value)} placeholder="Description shown in Google search results…" rows={2} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} onFocus={focusStyle} onBlur={blurStyle} />
                        <span style={{ fontSize: '0.72rem', color: form.metaDescription?.length > 155 ? '#ef4444' : '#94a3b8', fontFamily: FONT }}>{form.metaDescription?.length || 0}/155</span>
                    </div>

                    {/* ── Section Builder ── */}
                    <div>
                        <label style={{ ...labelStyle, marginBottom: '0.75rem' }}>Article Content — Section Builder</label>
                        {form.content.map((section, i) => (
                            <SectionCard key={i} section={section} index={i} total={form.content.length}
                                onChange={updateSection} onRemove={removeSection} onMove={moveSection} />
                        ))}
                        <AddSectionBar onAdd={addSection} />
                    </div>
                </div>

                {/* Right: sidebar fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem' }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', fontFamily: FONT }}>Post Settings</p>

                    {/* Published toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', fontFamily: FONT }}>Status</span>
                        <button onClick={() => set('isPublished', !form.isPublished)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.4rem 0.9rem', borderRadius: '99px', border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: 700, fontSize: '0.8rem', background: form.isPublished ? '#dcfce7' : '#f1f5f9', color: form.isPublished ? '#16a34a' : '#64748b', transition: 'all 0.2s' }}>
                            {form.isPublished ? <><Globe size={13} /> Published</> : <><EyeOff size={13} /> Draft</>}
                        </button>
                    </div>

                    {/* Category */}
                    <div>
                        <label style={labelStyle}>Category</label>
                        <input value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Gift Guides" style={{ ...inputStyle, background: '#fff' }} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>

                    {/* Category Color */}
                    <div>
                        <label style={labelStyle}>Category Color</label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                            {CATEGORY_COLORS.map(c => (
                                <button key={c.value} onClick={() => set('categoryColor', c.value)} title={c.label}
                                    style={{ width: '26px', height: '26px', borderRadius: '50%', background: c.value, border: form.categoryColor === c.value ? '2.5px solid #0f172a' : '2px solid transparent', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                            ))}
                        </div>
                        <input type="color" value={form.categoryColor} onChange={e => set('categoryColor', e.target.value)} style={{ width: '100%', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer' }} />
                    </div>

                    {/* Read Time */}
                    <div>
                        <label style={labelStyle}>Read Time</label>
                        <input value={form.readTime} onChange={e => set('readTime', e.target.value)} placeholder="5 min read" style={{ ...inputStyle, background: '#fff' }} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>

                    {/* Published At (display date) */}
                    <div>
                        <label style={labelStyle}>Display Date</label>
                        <input value={form.publishedAt} onChange={e => set('publishedAt', e.target.value)} placeholder="September 5, 2026" style={{ ...inputStyle, background: '#fff' }} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>

                    {/* Author */}
                    <div>
                        <label style={labelStyle}>Author</label>
                        <input value={form.author} onChange={e => set('author', e.target.value)} placeholder="WishFlow Team" style={{ ...inputStyle, background: '#fff' }} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>

                    {/* Cover Image */}
                    <div>
                        <label style={labelStyle}>Cover Image</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <input value={form.coverImage} onChange={e => set('coverImage', e.target.value)} placeholder="ImageKit URL" style={{ ...inputStyle, background: '#fff', flex: 1 }} onFocus={focusStyle} onBlur={blurStyle} />
                            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0', padding: '0 1rem', borderRadius: '10px', cursor: 'pointer', fontFamily: FONT, fontSize: '0.85rem', fontWeight: 600, color: '#334155', transition: 'background 0.2s' }}>
                                Upload
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    try {
                                        showToast('Uploading image...', 'info');
                                        const url = await uploadToImageKit(file, '/wishflow/Blog');
                                        set('coverImage', url);
                                        showToast('Image uploaded successfully ✓');
                                    } catch (err) {
                                        showToast(err.message || 'Failed to upload image', 'error');
                                    }
                                }} />
                            </label>
                        </div>
                        {form.coverImage && (
                            <img src={form.coverImage} alt="Cover preview" onError={e => e.target.style.display = 'none'} style={{ width: '100%', borderRadius: '8px', marginTop: '0.5rem', objectFit: 'cover', aspectRatio: '16/7' }} />
                        )}
                    </div>

                    {/* Cover Alt */}
                    <div>
                        <label style={labelStyle}>Cover Image Alt</label>
                        <input value={form.coverAlt} onChange={e => set('coverAlt', e.target.value)} placeholder="Describe the image" style={{ ...inputStyle, background: '#fff' }} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>

                    {/* Save buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
                        <button onClick={() => handleSave(true)} disabled={saving}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.8rem', background: '#6d28d9', color: '#fff', border: 'none', borderRadius: '12px', fontFamily: FONT, fontWeight: 700, fontSize: '0.95rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                            {saving ? <RefreshCw size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Globe size={16} />}
                            {isEdit ? 'Save & Publish' : 'Publish Now'}
                        </button>
                        <button onClick={() => handleSave(false)} disabled={saving}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.8rem', background: '#fff', color: '#334155', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontFamily: FONT, fontWeight: 700, fontSize: '0.92rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                            <Save size={15} /> Save as Draft
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Post List Table ─────────────────────────────────────────────────────── */
function PostRow({ post, onEdit, onDelete, onToggle, actionId }) {
    const isLoading = actionId === post.id;
    return (
        <div className="blog-table-row" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s', fontFamily: FONT }}
            onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>{post.title}</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>/blog/{post.slug}</p>
            </div>
            <div>
                <span style={{ display: 'inline-block', background: post.categoryColor + '22', color: post.categoryColor, fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', border: `1px solid ${post.categoryColor}44` }}>
                    {post.category}
                </span>
            </div>
            <div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: post.isPublished ? '#dcfce7' : '#f1f5f9', color: post.isPublished ? '#16a34a' : '#64748b', fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '99px' }}>
                    {post.isPublished ? <><Globe size={11} /> Live</> : <><EyeOff size={11} /> Draft</>}
                </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{post.publishedAt || '—'}</div>
            <div className="blog-row-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => onEdit(post)} title="Edit"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.75rem', background: '#eef2ff', color: '#4f46e5', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: FONT, fontWeight: 700, fontSize: '0.78rem' }}>
                    <Edit3 size={13} /> Edit
                </button>
                <button onClick={() => onToggle(post)} disabled={isLoading} title={post.isPublished ? 'Unpublish' : 'Publish'}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.75rem', background: post.isPublished ? '#fff7ed' : '#f0fdf4', color: post.isPublished ? '#ea580c' : '#16a34a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: FONT, fontWeight: 700, fontSize: '0.78rem', opacity: isLoading ? 0.6 : 1 }}>
                    {isLoading ? <RefreshCw size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : post.isPublished ? <><EyeOff size={13} /> Unpublish</> : <><Eye size={13} /> Publish</>}
                </button>
                <button onClick={() => onDelete(post)} title="Delete"
                    style={{ display: 'flex', alignItems: 'center', padding: '0.4rem', background: '#fff5f5', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                    <Trash2 size={15} />
                </button>
            </div>
        </div>
    );
}

/* ── Main BlogAdminTab ───────────────────────────────────────────────────── */
export default function BlogAdminTab({ showToast }) {
    const [view, setView] = useState('list'); // 'list' | 'form'
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingPost, setEditingPost] = useState(null);
    const [deletePost, setDeletePost] = useState(null);
    const [actionId, setActionId] = useState(null);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/admin/blog`, { headers: H });
            const data = await res.json();
            setPosts(Array.isArray(data) ? data : []);
        } catch {
            showToast('Failed to load posts', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    const handleEdit = (post) => { setEditingPost(post); setView('form'); };
    const handleNew = () => { setEditingPost(null); setView('form'); };
    const handleBack = () => { setView('list'); setEditingPost(null); };

    const handleSaved = (saved) => {
        setPosts(prev => {
            const exists = prev.find(p => p.id === saved.id);
            return exists ? prev.map(p => p.id === saved.id ? saved : p) : [saved, ...prev];
        });
        setView('list');
        setEditingPost(null);
    };

    const handleToggle = async (post) => {
        setActionId(post.id);
        try {
            const res = await fetch(`${API}/api/admin/blog/${post.id}/publish`, { method: 'PATCH', headers: H });
            const updated = await res.json();
            setPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
            showToast(updated.isPublished ? 'Post published ✓' : 'Post moved to draft');
        } catch {
            showToast('Failed to toggle status', 'error');
        } finally {
            setActionId(null);
        }
    };

    const handleDelete = async () => {
        if (!deletePost) return;
        const id = deletePost.id;
        setDeletePost(null);
        setActionId(id);
        try {
            await fetch(`${API}/api/admin/blog/${id}`, { method: 'DELETE', headers: H });
            setPosts(prev => prev.filter(p => p.id !== id));
            showToast('Post deleted');
        } catch {
            showToast('Failed to delete post', 'error');
        } finally {
            setActionId(null);
        }
    };

    if (view === 'form') {
        return <BlogForm post={editingPost} onSave={handleSaved} onCancel={handleBack} showToast={showToast} />;
    }

    return (
        <div style={{ fontFamily: FONT }}>
            <style>{`
                .blog-table-header {
                    display: grid;
                    grid-template-columns: 3fr 1.2fr 1fr 1fr 1.6fr;
                }
                .blog-table-row {
                    display: grid;
                    grid-template-columns: 3fr 1.2fr 1fr 1fr 1.6fr;
                    align-items: center;
                }
                .blog-header-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 2.5rem;
                }
                .blog-header-buttons {
                    display: flex;
                    gap: 0.75rem;
                }
                @media (max-width: 768px) {
                    .blog-table-header {
                        display: none !important;
                    }
                    .blog-table-row {
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 0.8rem;
                        padding: 1.25rem !important;
                    }
                    .blog-table-row > div {
                        width: 100%;
                    }
                    .blog-row-actions {
                        margin-top: 0.5rem;
                        width: 100%;
                        display: flex;
                        flex-wrap: wrap;
                        gap: 0.5rem;
                    }
                    .blog-row-actions > button {
                        flex: 1;
                        justify-content: center;
                    }
                    .blog-header-container {
                        flex-direction: column;
                        gap: 1.25rem;
                    }
                    .blog-header-buttons {
                        width: 100%;
                        justify-content: stretch;
                    }
                    .blog-header-buttons > button {
                        flex: 1;
                        justify-content: center;
                    }
                }
            `}</style>
            {/* Header */}
            <div className="blog-header-container">
                <div>
                    <h1 style={{ margin: 0, fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BookOpen size={28} color="#6d28d9" /> Blog Posts
                    </h1>
                    <p style={{ margin: '0.4rem 0 0', fontSize: '1.05rem', color: '#64748b' }}>
                        {posts.filter(p => p.isPublished).length} published · {posts.filter(p => !p.isPublished).length} drafts
                    </p>
                </div>
                <div className="blog-header-buttons">
                    <button onClick={fetchPosts} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', background: '#fff', color: '#4f46e5', border: '1px solid #e0e7ff', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>
                        <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
                    </button>
                    <button onClick={handleNew} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#6d28d9', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(109,40,217,0.3)' }}>
                        <Plus size={18} /> New Post
                    </button>
                </div>
            </div>

            {/* Table */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflowX: 'auto', overflowY: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div>
                    {/* Table header */}
                    <div className="blog-table-header" style={{ padding: '0.875rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT }}>
                        <span>Title</span><span>Category</span><span>Status</span><span>Date</span><span>Actions</span>
                    </div>

                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="blog-table-row" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', gap: '1rem' }}>
                                {Array.from({ length: 5 }).map((__, j) => (
                                    <div key={j} style={{ height: '16px', borderRadius: '6px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
                                ))}
                            </div>
                        ))
                    ) : posts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                            <BookOpen size={40} color="#e2e8f0" style={{ marginBottom: '1rem' }} />
                            <p style={{ fontWeight: 700, color: '#94a3b8', margin: '0 0 0.5rem', fontFamily: FONT }}>No blog posts yet</p>
                            <p style={{ color: '#cbd5e1', fontSize: '0.88rem', margin: '0 0 1.5rem', fontFamily: FONT }}>Create your first article to get started</p>
                            <button onClick={handleNew} style={{ padding: '0.7rem 1.5rem', background: '#6d28d9', color: '#fff', border: 'none', borderRadius: '10px', fontFamily: FONT, fontWeight: 700, cursor: 'pointer' }}>
                                Write First Post
                            </button>
                        </div>
                    ) : (
                        posts.map(post => (
                            <PostRow key={post.id} post={post}
                                onEdit={handleEdit} onDelete={setDeletePost}
                                onToggle={handleToggle} actionId={actionId} />
                        ))
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deletePost && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                    <div style={{ background: '#fff', borderRadius: '20px', padding: '2rem', maxWidth: '400px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', fontFamily: FONT }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fff5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                            <Trash2 size={22} color="#ef4444" />
                        </div>
                        <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800, color: '#0f172a' }}>Delete Post?</h3>
                        <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6 }}>
                            "<strong>{deletePost.title}</strong>" will be permanently deleted. This cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => setDeletePost(null)} style={{ flex: 1, padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontFamily: FONT, fontWeight: 700, cursor: 'pointer', color: '#334155' }}>
                                Cancel
                            </button>
                            <button onClick={handleDelete} style={{ flex: 1, padding: '0.75rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', fontFamily: FONT, fontWeight: 700, cursor: 'pointer' }}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
