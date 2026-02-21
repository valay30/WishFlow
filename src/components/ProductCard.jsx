import { useNavigate } from 'react-router-dom';
import { ChevronRight, ExternalLink } from 'lucide-react';

const ORANGE = '#10367D';

/* Used on non-home pages (search results etc.) — horizontal list style */
export default function ProductCard({ item, categoryName }) {
    const navigate = useNavigate();
    const price = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(item.price);

    return (
        <div
            className="item-card"
            onClick={() => navigate(`/product/${item.id}`)}
        >
            {/* Thumbnail */}
            <div style={{
                width: '62px', height: '62px', borderRadius: '14px', overflow: 'hidden',
                background: '#fff', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 10px rgba(0,0,0,0.06)'
            }}>
                {item.image
                    ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '1.8rem' }}>🛍️</span>
                }
            </div>

            {/* Info */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <p style={{
                    fontWeight: 700, color: '#111', fontSize: '0.95rem',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {item.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: ORANGE, background: 'rgba(16, 54, 125,0.12)', padding: '0.15rem 0.5rem', borderRadius: '99px', border: '1px solid rgba(16, 54, 125,0.25)' }}>
                        {categoryName}
                    </span>
                    {item.link && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ display: 'flex', alignItems: 'center', color: '#555', textDecoration: 'none' }}
                            title="Open link" >
                            <ExternalLink size={13} />
                        </a>
                    )}
                </div>
            </div>

            {/* Price + Arrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                <span style={{ color: ORANGE, fontWeight: 800, fontSize: '1rem' }}>{price}</span>
                <div style={{
                    width: '28px', height: '28px', borderRadius: '9px',
                    background: '#F5F5F5', border: '1px solid #D1D5DB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <ChevronRight size={15} color="#444" />
                </div>
            </div>
        </div>
    );
}
