import { Crown } from 'lucide-react';

export default function TierBadgeCard({ user, onUpgrade }) {
    return (
        <div style={{
            borderRadius: '24px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            background: user?.isPremium
                ? 'linear-gradient(135deg, #92400e 0%, #d97706 50%, #f59e0b 100%)'
                : 'linear-gradient(135deg, #1e3a5f 0%, #10367D 100%)',
            boxShadow: user?.isPremium
                ? '0 8px 24px rgba(217,119,6,0.35)'
                : '0 8px 24px rgba(16,54,125,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '1rem',
            animation: 'fadeInUp 0.4s ease-out',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                    width: '48px', height: '48px', borderRadius: '16px',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', flexShrink: 0
                }}>
                    <Crown size={24} />
                </div>
                <div>
                    <p style={{ fontWeight: 900, fontSize: '1.1rem', color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
                        {user?.isPremium ? '✨ Premium Account' : 'Free Account'}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', margin: '0.2rem 0 0', fontWeight: 500 }}>
                        {user?.isPremium
                            ? 'Unlimited items · Lifetime access'
                            : '5 items max · Upgrade to remove limits'}
                    </p>
                </div>
            </div>
            {!user?.isPremium && (
                <button
                    onClick={onUpgrade}
                    style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: '#fff', fontSize: '0.75rem', fontWeight: 800,
                        padding: '0.5rem 1rem', borderRadius: '99px',
                        whiteSpace: 'nowrap', flexShrink: 0,
                        cursor: 'pointer', outline: 'none',
                        transition: 'all 0.2s', fontFamily: 'inherit',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.color = '#10367D';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                >
                    Upgrade - ₹100
                </button>
            )}
        </div>
    );
}
