import { useState } from 'react';
import { Crown, ChevronDown, ChevronUp } from 'lucide-react';
import PricingBanner from './PricingBanner';

export default function TierBadgeCard({ user, onUpgrade }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div style={{ marginBottom: '1.5rem' }}>
            <div
                onClick={() => {
                    if (!user?.isPremium) setIsExpanded(!isExpanded);
                }}
                style={{
                    borderRadius: '24px',
                    background: user?.isPremium
                        ? 'linear-gradient(135deg, #92400e 0%, #d97706 50%, #f59e0b 100%)'
                        : 'linear-gradient(160deg, var(--primary-dk) 0%, var(--primary-dk) 45%, var(--primary) 100%)',
                    boxShadow: user?.isPremium
                        ? '0 8px 24px rgba(217,119,6,0.35)'
                        : '0 8px 24px rgba(var(--primary-rgb),0.25)',
                    display: 'flex', flexDirection: 'column',
                    animation: 'fadeInUp 0.4s ease-out',
                    cursor: !user?.isPremium ? 'pointer' : 'default',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    position: 'relative',
                    zIndex: 2,
                    overflow: 'hidden'
                }}
                onMouseEnter={e => {
                    if (!user?.isPremium) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 28px rgba(var(--primary-rgb),0.3)';
                    }
                }}
                onMouseLeave={e => {
                    if (!user?.isPremium) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(var(--primary-rgb),0.25)';
                    }
                }}
            >
                <div className="tier-badge-top" style={{
                    padding: '1.25rem 1.5rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '1rem'
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
                            <p style={{ fontWeight: 900, fontSize: '1.1rem', color: '#fff', margin: 0, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                {user?.isPremium ? '✨ Premium Account' : 'Free Account'}
                            </p>
                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', margin: '0.2rem 0 0', fontWeight: 500 }}>
                                {user?.isPremium
                                    ? 'Unlimited items  |  Lifetime access'
                                    : '5 items max  |  Upgrade to remove limits'}
                            </p>
                        </div>
                    </div>
                    {!user?.isPremium && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onUpgrade();
                            }}
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
                                e.currentTarget.style.color = 'var(--primary)';
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

                {!user?.isPremium && (
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.12)',
                        backdropFilter: 'blur(4px)',
                        padding: '0.4rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                        transition: 'background 0.2s'
                    }}>
                        {isExpanded ? <ChevronUp size={20} color="rgba(255,255,255,0.9)" /> : <ChevronDown size={20} color="rgba(255,255,255,0.9)" />}
                    </div>
                )}
            </div>

            {/* Accordion Content */}
            {!user?.isPremium && isExpanded && (
                <div style={{
                    animation: 'slideDown 0.3s cubic-bezier(0.2,0.8,0.4,1) backwards',
                    marginTop: '-20px',
                    paddingTop: '30px',
                    background: 'var(--surface)',
                    borderRadius: '0 0 24px 24px',
                    border: '1px solid var(--border)',
                    borderTop: 'none',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
                    position: 'relative',
                    zIndex: 1,
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '0 1rem' }}>
                        <PricingBanner onUpgrade={onUpgrade} />
                    </div>
                </div>
            )}
        </div>
    );
}
