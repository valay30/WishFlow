import { Check } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function PricingBanner({ onUpgrade }) {
    const { settings } = useSettings();
    const currency = settings?.currency || '₹';

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.6rem',
            padding: '0.25rem 0',
            fontFamily: 'inherit',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            {/* Free Plan */}
            <div style={{
                background: '#ffffff',
                borderRadius: '24px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                border: '1px solid #f1f5f9',
                overflow: 'hidden'
            }}>
                {/* Header block */}
                <div style={{
                    background: '#f1f5f9',
                    padding: '1.25rem 0.85rem 1.25rem 0.85rem',
                    borderRadius: '20px',
                    margin: '6px'
                }}>
                    <div style={{
                        background: '#ffffff',
                        display: 'inline-block',
                        padding: '0.35rem 0.85rem',
                        borderRadius: '99px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        marginBottom: '1.25rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                        Free
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'nowrap' }}>
                        <span style={{ fontSize: '1.60rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                            {new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 0 }).format(0)}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginLeft: '2px', whiteSpace: 'nowrap' }}>
                            /lifetime
                        </span>
                    </div>
                </div>

                {/* Body block */}
                <div style={{ padding: '0.85rem 0.85rem 1.25rem 0.85rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.85rem 0' }}>
                        Basic Features
                    </p>

                    <button
                        disabled
                        style={{
                            width: '100%',
                            padding: '0.75rem 0.4rem',
                            background: '#f1f5f9',
                            color: '#475569',
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            border: 'none',
                            cursor: 'not-allowed',
                            marginBottom: '1.25rem',
                            textAlign: 'center'
                        }}>
                        Current Plan
                    </button>

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
                        {[
                            'Up to 5 wishes',
                            'Basic support'
                        ].map((feature, i) => (
                            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#0f172a', fontWeight: 700 }}>
                                <Check size={15} color="#22c55e" strokeWidth={3} style={{ flexShrink: 0 }} />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Premium Plan */}
            <div style={{
                background: '#ffffff',
                borderRadius: '24px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                border: '1px solid #f1f5f9',
                overflow: 'hidden'
            }}>
                {/* Header block */}
                <div style={{
                    background: '#e0eaff',
                    padding: '1.25rem 0.85rem 1.25rem 0.85rem',
                    borderRadius: '20px',
                    margin: '6px'
                }}>
                    <div style={{
                        background: '#ffffff',
                        display: 'inline-block',
                        padding: '0.35rem 0.85rem',
                        borderRadius: '99px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        marginBottom: '1.25rem',
                        letterSpacing: '0.4px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                        PREMIUM
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'nowrap' }}>
                        <span style={{ fontSize: '1.60rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                            {new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 0 }).format(100)}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginLeft: '2px', whiteSpace: 'nowrap' }}>
                            /lifetime
                        </span>
                    </div>
                </div>

                {/* Body block */}
                <div style={{ padding: '0.85rem 0.85rem 1.25rem 0.85rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.85rem 0' }}>
                        Unlock all features
                    </p>

                    <button
                        onClick={onUpgrade}
                        style={{
                            width: '100%',
                            padding: '0.75rem 0.4rem',
                            background: '#0f172a',
                            color: '#ffffff',
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            border: 'none',
                            cursor: 'pointer',
                            marginBottom: '1.25rem',
                            textAlign: 'center',
                            transition: 'transform 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        Upgrade Now
                    </button>

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
                        {[
                            'Unlimited wishes',
                            'Lifetime access',
                            'Dark mode & themes',
                            'Priority support'
                        ].map((feature, i) => (
                            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#0f172a', fontWeight: 700 }}>
                                <Check size={15} color="#22c55e" strokeWidth={3} style={{ flexShrink: 0 }} />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
