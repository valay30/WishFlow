import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Globe } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const ORANGE = 'var(--primary)';
const SURFACE = 'var(--surface)';
const BORDER = 'var(--border)';

export default function ItemCard({ item, categoryName, onRemove, onTogglePurchased, onTogglePublic }) {
    const navigate = useNavigate();
    const { currency } = useSettings();
    const price = new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 2 }).format(item.price);
    const [showPublicConfirm, setShowPublicConfirm] = useState(false);

    return (
        <>
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
                position: 'relative',
                opacity: item.is_purchased ? 0.65 : 1,
                filter: item.is_purchased ? 'grayscale(0.6)' : 'none',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = ORANGE;
                e.currentTarget.style.boxShadow = `0 8px 28px rgba(var(--primary-rgb),0.15)`;
                e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = BORDER;
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >


            {/* ── Inset image box (padded, rounded inner corners) ── */}
            <div style={{ padding: '0.8rem 0.8rem 0.4rem', position: 'relative' }}>
                <div style={{
                    background: 'var(--surface-2)',
                    borderRadius: '16px',
                    aspectRatio: '1 / 1',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)',
                    border: '1px solid var(--border)',
                    position: 'relative'
                }}>
                    {item.image ? (
                        <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <span style={{ fontSize: '2.5rem', color: 'var(--text-muted)' }}>📦</span>
                    )}
                    {onRemove && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove(); }}
                            style={{
                                position: 'absolute', top: '0.5rem', right: '0.5rem',
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                                color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
                                cursor: 'pointer', zIndex: 10,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s', padding: 0
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                    )}
                    {onTogglePurchased && (
                        <div
                            onClick={(e) => { e.stopPropagation(); onTogglePurchased(item.id, !item.is_purchased); }}
                            style={{
                                position: 'absolute', bottom: '0.5rem', right: '0.5rem',
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: item.is_purchased ? '#059669' : 'rgba(0,0,0,0.5)',
                                backdropFilter: 'blur(8px)',
                                color: '#fff',
                                border: `1.5px solid ${item.is_purchased ? '#059669' : 'rgba(255,255,255,0.3)'}`,
                                cursor: 'pointer', zIndex: 10,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { if (!item.is_purchased) e.currentTarget.style.transform = 'scale(1.1)'; }}
                            onMouseLeave={e => { if (!item.is_purchased) e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            <Check size={16} strokeWidth={item.is_purchased ? 3 : 2} style={{ opacity: item.is_purchased ? 1 : 0.7 }} />
                        </div>
                    )}
                    {/* Make Public / Remove from Discover toggle */}
                    {onTogglePublic && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!item.is_public) {
                                    setShowPublicConfirm(true);
                                } else {
                                    onTogglePublic(item.id, false);
                                }
                            }}
                            title={item.is_public ? 'Remove from Discover' : 'Share on Discover'}
                            style={{
                                position: 'absolute', bottom: '0.5rem', left: '0.5rem',
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: item.is_public ? 'rgba(var(--primary-rgb),0.85)' : 'rgba(0,0,0,0.45)',
                                backdropFilter: 'blur(8px)',
                                color: '#fff',
                                border: `1.5px solid ${item.is_public ? 'rgba(var(--primary-rgb),1)' : 'rgba(255,255,255,0.25)'}`,
                                cursor: 'pointer', zIndex: 10,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: item.is_public ? '0 0 10px rgba(var(--primary-rgb),0.5)' : '0 2px 8px rgba(0,0,0,0.15)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            <Globe size={14} strokeWidth={2} />
                        </div>
                    )}
                </div>
            </div>

            {/* ── Content below image ── */}
            <div style={{ padding: '0.75rem 0.9rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {/* Top section: Product name + Category chip */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem', flex: 1 }}>
                    <p style={{
                        fontWeight: 800,
                        fontSize: '1.05rem',
                        color: 'var(--text)',
                        lineHeight: 1.3,
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
                        color: 'var(--text-muted)',
                        background: 'var(--surface-2)',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        border: '1px solid var(--border)',
                        whiteSpace: 'nowrap',
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
                        color: 'var(--text)',
                        letterSpacing: '-0.02em',
                    }}>
                        {price}
                    </p>

                {/* Arrow button — opens external product link or details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <a
                        href={item.link || '#'}
                        target={item.link ? '_blank' : '_self'}
                        rel="noopener noreferrer"
                        onClick={e => {
                            if (!item.link) {
                                e.stopPropagation();
                                e.preventDefault();
                                navigate(`/product/${item.id}`);
                            } else {
                                e.stopPropagation();
                            }
                        }}
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: ORANGE,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 4px 12px rgba(var(--primary-rgb),0.28)',
                            transition: 'transform 0.18s ease, background 0.18s ease',
                            textDecoration: 'none',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; }}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        title={item.link ? 'Open product link' : 'View details'}
                    >
                        <ArrowRight size={17} color="#fff" strokeWidth={2.5} />
                    </a>
                </div>
                </div>
            </div>

        </div>
            {/* Confirmation Modal */}
            {showPublicConfirm && createPortal(
                <div
                    onClick={(e) => { e.stopPropagation(); setShowPublicConfirm(false); }}
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(4px)'
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'var(--surface)', padding: '2.5rem 2rem', borderRadius: '24px',
                            maxWidth: '400px', width: '90%',
                            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
                            textAlign: 'center',
                            cursor: 'default',
                            animation: 'disc-fadeIn 0.25s ease'
                        }}
                    >
                        <Globe size={48} color={ORANGE} style={{ margin: '0 auto 1rem' }} />
                        <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.4rem', color: 'var(--text)', fontWeight: 800 }}>Share to Discover?</h3>
                        <p style={{ margin: '0 0 1.5rem', color: 'var(--text-muted)', lineHeight: 1.5, fontSize: '0.95rem' }}>
                            This will make your item visible to everyone on the public Discover feed. Other users will be able to see it and save it to their own wishlists.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowPublicConfirm(false); }}
                                style={{ flex: 1, padding: '0.9rem', borderRadius: '12px', background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowPublicConfirm(false);
                                    onTogglePublic(item.id, true);
                                }}
                                style={{ flex: 1, padding: '0.9rem', borderRadius: '12px', background: ORANGE, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                            >
                                Share Publicly
                            </button>
                        </div>
                    </div>
                </div>
            , document.body)}
        </>
    );
}
