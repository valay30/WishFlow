import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const ORANGE = 'var(--primary)';
const SURFACE = 'var(--surface)';
const BORDER = 'var(--border)';

export default function ItemCard({ item, categoryName, onRemove, onTogglePurchased }) {
    const navigate = useNavigate();
    const { currency } = useSettings();
    const price = new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 2 }).format(item.price);

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
    );
}
