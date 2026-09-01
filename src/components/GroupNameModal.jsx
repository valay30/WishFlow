import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Layers, X } from 'lucide-react';

const ORANGE = 'var(--primary)';

/**
 * GroupNameModal
 * 
 * Shows when a user drops an item onto another item to create a new group.
 * Props:
 *   isOpen        {bool}     - Whether to show the modal
 *   onConfirm     {fn}       - Called with (groupName) string when user confirms
 *   onCancel      {fn}       - Called when user cancels / closes
 *   defaultName   {string}   - Optional pre-filled name suggestion
 */
export default function GroupNameModal({ isOpen, onConfirm, onCancel, defaultName = '' }) {
    const [name, setName] = useState(defaultName);
    const inputRef = useRef(null);

    // Reset name and focus input whenever the modal opens
    useEffect(() => {
        if (isOpen) {
            setName(defaultName || '');
            setTimeout(() => inputRef.current?.focus(), 60);
        }
    }, [isOpen, defaultName]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        const trimmed = name.trim();
        if (!trimmed) return;
        onConfirm(trimmed);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleConfirm();
        if (e.key === 'Escape') onCancel();
    };

    return createPortal(
        <div
            onClick={onCancel}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem',
                animation: 'gnm-fade 0.18s ease-out',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'var(--surface)',
                    borderRadius: '28px',
                    padding: '2rem',
                    width: '100%',
                    maxWidth: '380px',
                    boxShadow: '0 32px 64px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.05)',
                    animation: 'gnm-slide 0.22s cubic-bezier(0.2,0.8,0.4,1)',
                    position: 'relative',
                }}
            >
                {/* Close button */}
                <button
                    onClick={onCancel}
                    style={{
                        position: 'absolute', top: '1rem', right: '1rem',
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: 'var(--surface-2)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--text-muted)',
                        transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                >
                    <X size={16} />
                </button>

                {/* Icon */}
                <div style={{
                    width: '56px', height: '56px', borderRadius: '18px',
                    background: `linear-gradient(135deg, var(--primary), var(--primary-dk))`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '1.25rem',
                    boxShadow: '0 8px 20px rgba(var(--primary-rgb),0.35)',
                }}>
                    <Layers size={26} color="#fff" />
                </div>

                {/* Title */}
                <h2 style={{
                    fontSize: '1.45rem', fontWeight: 900,
                    color: 'var(--text)', marginBottom: '0.35rem', lineHeight: 1.2,
                }}>
                    Name Your Group
                </h2>
                <p style={{
                    fontSize: '0.85rem', color: 'var(--text-dim)',
                    marginBottom: '1.5rem', lineHeight: 1.5,
                }}>
                    Give this group a name to organize your items together.
                </p>

                {/* Input */}
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="e.g. My Tech Wishlist, Birthday Gifts…"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    maxLength={40}
                    style={{
                        width: '100%',
                        padding: '0.9rem 1.1rem',
                        borderRadius: '14px',
                        border: `2px solid var(--border)`,
                        background: 'var(--surface-2)',
                        color: 'var(--text)',
                        fontSize: '0.95rem',
                        fontFamily: 'inherit',
                        fontWeight: 600,
                        outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        boxSizing: 'border-box',
                        marginBottom: '1rem',
                        display: 'block',
                    }}
                    onFocus={e => {
                        e.target.style.borderColor = 'var(--primary)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(var(--primary-rgb),0.12)';
                    }}
                    onBlur={e => {
                        e.target.style.borderColor = 'var(--border)';
                        e.target.style.boxShadow = 'none';
                    }}
                />

                {/* Character count */}
                <p style={{
                    fontSize: '0.72rem', color: 'var(--text-dim)',
                    textAlign: 'right', marginTop: '-0.6rem', marginBottom: '1.25rem',
                }}>
                    {name.length}/40
                </p>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1, padding: '0.85rem',
                            borderRadius: '14px',
                            background: 'var(--surface-2)',
                            border: '1.5px solid var(--border)',
                            color: 'var(--text-muted)',
                            fontWeight: 700, fontSize: '0.9rem',
                            fontFamily: 'inherit', cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!name.trim()}
                        style={{
                            flex: 2, padding: '0.85rem',
                            borderRadius: '14px',
                            background: name.trim()
                                ? 'linear-gradient(135deg, var(--primary), var(--primary-dk))'
                                : 'var(--surface-3)',
                            border: 'none',
                            color: name.trim() ? '#fff' : 'var(--text-dim)',
                            fontWeight: 800, fontSize: '0.95rem',
                            fontFamily: 'inherit',
                            cursor: name.trim() ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s',
                            boxShadow: name.trim() ? '0 6px 18px rgba(var(--primary-rgb),0.35)' : 'none',
                        }}
                        onMouseEnter={e => { if (name.trim()) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        ✦ Create Group
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes gnm-fade {
                    from { opacity: 0; } to { opacity: 1; }
                }
                @keyframes gnm-slide {
                    from { opacity: 0; transform: translateY(24px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>,
        document.body
    );
}
