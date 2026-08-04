import { useNavigate } from 'react-router-dom';
import { ChevronRight, ExternalLink, Check } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const ORANGE = 'var(--primary)';

/* Used on non-home pages (search results etc.) — horizontal list style */
export default function ProductCard({ item, categoryName, onTogglePurchased, onRemove }) {
    const navigate = useNavigate();
    const { currency } = useSettings();
    const price = new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 2 }).format(item.price);

    return (
        <div
            className="item-card"
            onClick={() => navigate(`/product/${item.id}`)}
            style={{
                opacity: item.is_purchased ? 0.65 : 1,
                filter: item.is_purchased ? 'grayscale(0.6)' : 'none',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: 'var(--surface)',
                padding: '1rem',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
            }}
        >
            {/* Thumbnail */}
            <div style={{
                width: '64px', height: '64px', borderRadius: '14px', overflow: 'hidden',
                background: 'var(--surface-2)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
                position: 'relative'
            }}>
                {item.image
                    ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '1.8rem' }}>🛍️</span>
                }
                {onTogglePurchased && (
                    <div
                        onClick={(e) => { e.stopPropagation(); onTogglePurchased(item.id, !item.is_purchased); }}
                        style={{
                            position: 'absolute', bottom: '0.2rem', right: '0.2rem',
                            width: '22px', height: '22px', borderRadius: '50%',
                            background: item.is_purchased ? '#059669' : 'rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(4px)',
                            color: '#fff',
                            border: `1.5px solid ${item.is_purchased ? '#059669' : 'rgba(255,255,255,0.3)'}`,
                            cursor: 'pointer', zIndex: 10,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Check size={12} strokeWidth={item.is_purchased ? 3 : 2} style={{ opacity: item.is_purchased ? 1 : 0.7 }} />
                    </div>
                )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <p style={{
                    fontWeight: 700, color: 'var(--text)', fontSize: '1rem',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden', margin: 0, lineHeight: 1.2
                }}>
                    {item.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '0.15rem 0.5rem', borderRadius: '99px', border: '1px solid var(--border)' }}>
                        {categoryName}
                    </span>
                    {item.link && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ display: 'flex', alignItems: 'center', color: 'var(--text-dim)', textDecoration: 'none' }}
                            title="Open link" >
                            <ExternalLink size={13} />
                        </a>
                    )}
                </div>
            </div>

            {/* Price + Action */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                <span style={{ color: 'var(--text)', fontWeight: 800, fontSize: '1.05rem', marginRight: '0.2rem' }}>{price}</span>
                {onRemove ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        style={{
                            width: '32px', height: '32px', borderRadius: '10px',
                            background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                ) : (
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '10px',
                        background: 'var(--surface-2)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <ChevronRight size={16} color="var(--text-muted)" />
                    </div>
                )}
            </div>
        </div>
    );
}
