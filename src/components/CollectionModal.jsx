import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, Calendar, Sparkles } from 'lucide-react';

const ORANGE = 'var(--primary)';
const BORDER = 'var(--border)';
const SURFACE2 = 'var(--surface-2)';

const EMOJI_PRESETS = [
    '🎁', '🎂', '🎉', '🛍️', '✈️', '🏠', '💻', '📚',
    '👗', '⌚', '🎮', '🎵', '🏋️', '🍽️', '💄', '🌟',
    '🏕️', '🎓', '💍', '🚗', '🌸', '🎯', '🔥', '✨',
];

const INPUT_ST = {
    width: '100%', padding: '0.85rem 1rem',
    background: SURFACE2, border: `1.5px solid ${BORDER}`,
    borderRadius: '14px', color: '#111',
    fontFamily: 'inherit', fontSize: '0.95rem',
    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
};

const LABEL_ST = {
    display: 'block', marginBottom: '0.35rem',
    fontSize: '0.75rem', fontWeight: 700,
    color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.05em',
};

export default function CollectionModal({ existing = null, onSave, onDelete, onClose }) {
    const [emoji, setEmoji] = useState(existing?.emoji || '🎁');
    const [name, setName] = useState(existing?.name || '');
    const [targetDate, setTargetDate] = useState(existing?.target_date || '');
    const [saving, setSaving] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const focus = e => { e.target.style.borderColor = ORANGE; e.target.style.boxShadow = `0 0 0 4px rgba(var(--primary-rgb),0.1)`; };
    const blur = e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        try {
            await onSave({ emoji, name: name.trim(), target_date: targetDate || null });
            onClose();
        } catch (error) {
            console.error(error);
            alert(`Failed to save collection: ${error.message || "Unknown error"}. Did you run the Supabase SQL?`);
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Delete "${existing.name}"? Items in this collection won't be deleted.`)) return;
        await onDelete(existing.id);
        onClose();
    };

    return createPortal(
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999 }} />
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10000, display: 'flex', justifyContent: 'center' }}>
                <div
                    onClick={e => e.stopPropagation()}
                    style={{
                        background: '#fff', borderRadius: '28px 28px 0 0',
                        width: '100%', maxWidth: '560px', maxHeight: '90vh',
                        overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
                        animation: 'slideUp 0.28s cubic-bezier(0.2,0.8,0.4,1)',
                        border: `1px solid ${BORDER}`, borderBottom: 'none',
                    }}
                >
                    {/* Handle */}
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '0.85rem 0 0' }}>
                        <div style={{ width: '40px', height: '4px', borderRadius: '99px', background: '#D1D5DB' }} />
                    </div>

                    {/* Header */}
                    <div style={{ padding: '0.75rem 1.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: ORANGE }}>
                            {existing ? 'Edit Collection' : 'New Collection ✨'}
                        </h2>
                        <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F5F5F5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = '#F5F5F5'}>
                            <X size={16} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} style={{ padding: '1rem 1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        {/* Emoji + Name row */}
                        <div>
                            <label style={LABEL_ST}>Emoji & Name</label>
                            <div style={{ display: 'flex', gap: '0.6rem' }}>
                                {/* Emoji button */}
                                <div style={{ position: 'relative' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker(p => !p)}
                                        style={{
                                            width: '54px', height: '54px', borderRadius: '14px',
                                            background: SURFACE2, border: `1.5px solid ${showEmojiPicker ? ORANGE : BORDER}`,
                                            fontSize: '1.6rem', cursor: 'pointer', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0, transition: 'border-color 0.2s',
                                        }}
                                    >
                                        {emoji}
                                    </button>
                                    {showEmojiPicker && (
                                        <div style={{
                                            position: 'absolute', top: '60px', left: 0, zIndex: 100,
                                            background: '#fff', borderRadius: '16px',
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                                            border: `1px solid ${BORDER}`,
                                            padding: '0.75rem',
                                            display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
                                            gap: '0.35rem', width: '220px',
                                        }}>
                                            {EMOJI_PRESETS.map(e => (
                                                <button
                                                    key={e} type="button"
                                                    onClick={() => { setEmoji(e); setShowEmojiPicker(false); }}
                                                    style={{
                                                        width: '32px', height: '32px', borderRadius: '8px',
                                                        border: 'none', background: emoji === e ? 'rgba(var(--primary-rgb),0.1)' : 'transparent',
                                                        fontSize: '1.2rem', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}
                                                >{e}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <input
                                    style={{ ...INPUT_ST, flex: 1 }}
                                    required
                                    placeholder="e.g. Birthday 2026, Diwali Shopping..."
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    onFocus={focus} onBlur={blur}
                                />
                            </div>
                        </div>

                        {/* Target Date */}
                        <div>
                            <label style={LABEL_ST}>
                                <Calendar size={12} style={{ display: 'inline', marginRight: '0.3rem' }} />
                                Target Date (optional)
                            </label>
                            <input
                                type="date"
                                style={INPUT_ST}
                                value={targetDate}
                                onChange={e => setTargetDate(e.target.value)}
                                onFocus={focus} onBlur={blur}
                            />
                            <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.3rem' }}>
                                A countdown will appear on the collection card.
                            </p>
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
                            {existing && (
                                <button
                                    type="button" onClick={handleDelete}
                                    style={{ padding: '0.9rem', background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '14px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.9rem', background: '#F5F5F5', color: '#555', border: `1px solid ${BORDER}`, borderRadius: '14px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                                Cancel
                            </button>
                            <button
                                type="submit" disabled={saving || !name.trim()}
                                style={{ flex: 2, padding: '0.9rem', background: saving ? '#8fa0f5' : ORANGE, color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 800, fontSize: '0.95rem', cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 16px rgba(var(--primary-rgb),0.4)', opacity: !name.trim() ? 0.6 : 1 }}
                            >
                                <Sparkles size={17} /> {existing ? 'Save Changes' : 'Create Collection'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        </>,
        document.body
    );
}
