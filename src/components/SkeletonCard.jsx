/**
 * SkeletonCard — Matches the shape of ItemCard (card mode) and ProductCard (list mode).
 * Uses the global `.skeleton-shimmer` CSS class defined in index.css.
 *
 * Props:
 *   mode: 'card' (default) | 'list'
 */
export default function SkeletonCard({ mode = 'card' }) {
    if (mode === 'list') {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: 'var(--surface)',
                padding: '1rem',
                borderRadius: '20px',
                border: '1px solid var(--border)',
            }}>
                <div className="skeleton-shimmer" style={{
                    width: '64px', height: '64px',
                    borderRadius: '14px', flexShrink: 0,
                }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="skeleton-shimmer" style={{ height: '14px', width: '70%' }} />
                    <div className="skeleton-shimmer" style={{ height: '12px', width: '40%' }} />
                </div>
                <div className="skeleton-shimmer" style={{
                    height: '28px', width: '60px', borderRadius: '10px', flexShrink: 0
                }} />
            </div>
        );
    }

    return (
        <div style={{
            background: 'var(--surface)',
            border: '1.5px solid var(--border)',
            borderRadius: '24px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
        }}>
            <div style={{ padding: '0.8rem 0.8rem 0.4rem' }}>
                <div className="skeleton-shimmer" style={{
                    aspectRatio: '1 / 1',
                    borderRadius: '16px',
                    width: '100%',
                }} />
            </div>
            <div style={{
                padding: '0.75rem 0.9rem 1rem',
                display: 'flex', flexDirection: 'column', gap: '0.5rem',
            }}>
                <div className="skeleton-shimmer" style={{ height: '14px', width: '90%' }} />
                <div className="skeleton-shimmer" style={{ height: '14px', width: '60%' }} />
                <div className="skeleton-shimmer" style={{
                    height: '20px', width: '45%', borderRadius: '6px', marginTop: '0.2rem'
                }} />
                <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginTop: '0.25rem'
                }}>
                    <div className="skeleton-shimmer" style={{ height: '20px', width: '35%' }} />
                    <div className="skeleton-shimmer" style={{
                        width: '36px', height: '36px', borderRadius: '50%'
                    }} />
                </div>
            </div>
        </div>
    );
}
