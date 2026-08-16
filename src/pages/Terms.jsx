import React from 'react';
import { Link } from 'react-router-dom';

export default function Terms() {
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
                    Terms of Service
                </h1>
                <p style={{ color: 'var(--text-dim, #88909D)', fontSize: '0.95rem', margin: '0 0 3.5rem 0', fontWeight: 500 }}>
                    Last updated: August 16, 2026
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                    <section>
                        <h3 style={{ fontWeight: 800, fontSize: '1.25rem', margin: '0 0 1rem 0' }}>1. Terms</h3>
                        <p style={{ color: 'var(--text-dim, #4B5563)', lineHeight: 1.7, fontSize: '1.05rem', margin: 0 }}>
                            By accessing the WishFlow application, you agree to be bound by these Terms of Service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.
                        </p>
                    </section>

                    <section>
                        <h3 style={{ fontWeight: 800, fontSize: '1.25rem', margin: '0 0 1rem 0' }}>2. Use License</h3>
                        <p style={{ color: 'var(--text-dim, #4B5563)', lineHeight: 1.7, fontSize: '1.05rem', margin: 0 }}>
                            Permission is granted to temporarily download one copy of the materials (information or software) on WishFlow for personal, non-commercial transitory viewing only.
                        </p>
                    </section>

                    <section>
                        <h3 style={{ fontWeight: 800, fontSize: '1.25rem', margin: '0 0 1rem 0' }}>3. Disclaimer</h3>
                        <p style={{ color: 'var(--text-dim, #4B5563)', lineHeight: 1.7, fontSize: '1.05rem', margin: 0 }}>
                            The materials on WishFlow are provided on an 'as is' basis. WishFlow makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                        </p>
                    </section>

                    <section>
                        <h3 style={{ fontWeight: 800, fontSize: '1.25rem', margin: '0 0 1rem 0' }}>4. Limitations</h3>
                        <p style={{ color: 'var(--text-dim, #4B5563)', lineHeight: 1.7, fontSize: '1.05rem', margin: 0 }}>
                            In no event shall WishFlow or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on WishFlow.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
