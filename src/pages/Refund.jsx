import React from 'react';
import { Link } from 'react-router-dom';

export default function Refund() {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg, #fff)', color: 'var(--text, #111)', fontFamily: '"Outfit", sans-serif', padding: '4rem 1.5rem' }}>
            <div style={{ maxWidth: '680px', margin: '0 auto' }}>
                <Link 
                    to="/" 
                    style={{ display: 'inline-flex', alignItems: 'center', color: '#E97451', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem', marginBottom: '2.5rem', transition: 'opacity 0.2s' }} 
                    onMouseEnter={e => e.currentTarget.style.opacity = 0.7} 
                    onMouseLeave={e => e.currentTarget.style.opacity = 1}
                >
                    &larr; Back to Home
                </Link>
                
                <h1 style={{ fontWeight: 900, fontSize: 'clamp(2rem, 4vw, 2.8rem)', letterSpacing: '-0.02em', margin: '0 0 0.5rem 0' }}>
                    Cancellation & Refund Policy
                </h1>
                <p style={{ color: 'var(--text-dim, #88909D)', fontSize: '0.95rem', margin: '0 0 3.5rem 0', fontWeight: 500 }}>
                    Last updated: August 16, 2026
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                    <section>
                        <h3 style={{ fontWeight: 800, fontSize: '1.25rem', margin: '0 0 1rem 0' }}>1. Overview</h3>
                        <p style={{ color: 'var(--text-dim, #4B5563)', lineHeight: 1.7, fontSize: '1.05rem', margin: 0 }}>
                            WishFlow is committed to providing a great experience. This policy outlines our guidelines for cancellations and refunds regarding any premium services or payments processed through our platform.
                        </p>
                    </section>

                    <section>
                        <h3 style={{ fontWeight: 800, fontSize: '1.25rem', margin: '0 0 1rem 0' }}>2. Cancellations</h3>
                        <p style={{ color: 'var(--text-dim, #4B5563)', lineHeight: 1.7, fontSize: '1.05rem', margin: 0 }}>
                            You may cancel your subscription or service at any time through your account settings. Cancellations will take effect at the end of the current billing cycle. You will not be charged for the subsequent cycle.
                        </p>
                    </section>

                    <section>
                        <h3 style={{ fontWeight: 800, fontSize: '1.25rem', margin: '0 0 1rem 0' }}>3. Refunds</h3>
                        <p style={{ color: 'var(--text-dim, #4B5563)', lineHeight: 1.7, fontSize: '1.05rem', margin: 0 }}>
                            Refunds are handled on a case-by-case basis. Generally, all payments are non-refundable unless specified otherwise by local consumer protection laws. If you experience technical issues or accidental billing, please contact our support team within 7 days of the transaction for a review of your refund request.
                        </p>
                    </section>

                    <section>
                        <h3 style={{ fontWeight: 800, fontSize: '1.25rem', margin: '0 0 1rem 0' }}>4. Contact Us</h3>
                        <p style={{ color: 'var(--text-dim, #4B5563)', lineHeight: 1.7, fontSize: '1.05rem', margin: 0 }}>
                            If you have any questions about our Cancellation and Refund Policy, please contact our support team via email.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
