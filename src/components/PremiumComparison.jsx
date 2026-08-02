import { CheckCircle2, XCircle, Gift, Gem, Star } from 'lucide-react';

export default function PremiumComparison({ inline = false }) {
    const ORANGE = '#f97316';
    const GREEN = '#10b981';
    
    return (
        <div style={{
            padding: inline ? '1.5rem 0' : '0',
            fontFamily: 'inherit',
            color: '#1f2937' // Use light theme text colors for these cards
        }}>
            {/* Comparison Table */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                alignItems: 'stretch'
            }}>
                
                {/* Free Tier */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    padding: '2rem 1.5rem',
                    border: '1px solid #bbf7d0',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '50%',
                        background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '1rem'
                    }}>
                        <Gift size={28} color={GREEN} />
                    </div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', margin: '0' }}>Free Plan</h3>
                    
                    <div style={{ height: '1px', background: '#e5e7eb', margin: '1.25rem 0' }} />

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#374151' }}>
                            <CheckCircle2 size={22} color={GREEN} style={{ flexShrink: 0 }} />
                            <span>Up to 5 wishes</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#374151' }}>
                            <XCircle size={22} color="#ef4444" style={{ flexShrink: 0 }} />
                            <span>Unlimited wishes</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#374151' }}>
                            <XCircle size={22} color="#ef4444" style={{ flexShrink: 0 }} />
                            <span>Dark mode & Custom themes</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#374151' }}>
                            <XCircle size={22} color="#ef4444" style={{ flexShrink: 0 }} />
                            <span>Priority support</span>
                        </li>
                    </ul>
                </div>

                {/* Premium Tier */}
                <div style={{
                    background: '#fffaf5',
                    borderRadius: '20px',
                    padding: '2rem 1.5rem',
                    border: `1.5px solid #fed7aa`,
                    display: 'flex', flexDirection: 'column',
                    position: 'relative',
                    boxShadow: '0 10px 15px -3px rgba(249, 115, 22, 0.1)'
                }}>
                    <div style={{
                        position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                        background: ORANGE, color: '#fff', fontSize: '0.75rem',
                        fontWeight: 800, padding: '0.35rem 0.8rem', borderRadius: '8px',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                        boxShadow: '0 4px 6px -1px rgba(249, 115, 22, 0.3)',
                        whiteSpace: 'nowrap'
                    }}>
                        <Star size={14} fill="currentColor" color="currentColor" />
                        RECOMMENDED
                    </div>

                    <div style={{
                        width: '56px', height: '56px', borderRadius: '50%',
                        background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '1rem'
                    }}>
                        <Gem size={28} color={ORANGE} />
                    </div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#111827', margin: '0' }}>Premium</h3>
                    
                    <div style={{ height: '1px', background: '#ffedd5', margin: '1.25rem 0' }} />

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#374151' }}>
                            <CheckCircle2 size={22} color={GREEN} style={{ flexShrink: 0 }} />
                            <span>Unlimited wishes</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#374151' }}>
                            <CheckCircle2 size={22} color={GREEN} style={{ flexShrink: 0 }} />
                            <span>Lifetime access</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#374151' }}>
                            <CheckCircle2 size={22} color={GREEN} style={{ flexShrink: 0 }} />
                            <span>Dark mode & Custom themes</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#374151' }}>
                            <CheckCircle2 size={22} color={GREEN} style={{ flexShrink: 0 }} />
                            <span>Priority support</span>
                        </li>
                    </ul>
                </div>

            </div>
        </div>
    );
}
