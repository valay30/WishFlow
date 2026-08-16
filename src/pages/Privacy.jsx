import React from 'react';
import { Link } from 'react-router-dom';

export default function Privacy() {
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
                    Privacy Policy
                </h1>
                <p style={{ color: 'var(--text-dim, #88909D)', fontSize: '0.95rem', margin: '0 0 3.5rem 0', fontWeight: 500 }}>
                    Last updated: August 16, 2026
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                    <section>
                        <p style={{ color: 'var(--text-dim, #4B5563)', lineHeight: 1.7, fontSize: '1.05rem', margin: 0 }}>
                            At WishFlow, accessible from our application, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by WishFlow and how we use it.
                        </p>
                    </section>

                    <section>
                        <h3 style={{ fontWeight: 800, fontSize: '1.25rem', margin: '0 0 1rem 0' }}>1. Information We Collect</h3>
                        <p style={{ color: 'var(--text-dim, #4B5563)', lineHeight: 1.7, fontSize: '1.05rem', margin: 0 }}>
                            The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information. We may collect your name, email address, and authentication data via Google Auth.
                        </p>
                    </section>

                    <section>
                        <h3 style={{ fontWeight: 800, fontSize: '1.25rem', margin: '0 0 1rem 0' }}>2. How We Use Your Information</h3>
                        <p style={{ color: 'var(--text-dim, #4B5563)', lineHeight: 1.7, fontSize: '1.05rem', margin: '0 0 1rem 0' }}>
                            We use the information we collect in various ways, including to:
                        </p>
                        <ul style={{ color: 'var(--text-dim, #4B5563)', lineHeight: 1.7, fontSize: '1.05rem', margin: 0, paddingLeft: '1.5rem' }}>
                            <li style={{ marginBottom: '0.5rem' }}>Provide, operate, and maintain our application</li>
                            <li style={{ marginBottom: '0.5rem' }}>Improve, personalize, and expand our application</li>
                            <li style={{ marginBottom: '0.5rem' }}>Understand and analyze how you use our application</li>
                            <li>Develop new products, services, features, and functionality</li>
                        </ul>
                    </section>

                    <section>
                        <h3 style={{ fontWeight: 800, fontSize: '1.25rem', margin: '0 0 1rem 0' }}>3. Log Files</h3>
                        <p style={{ color: 'var(--text-dim, #4B5563)', lineHeight: 1.7, fontSize: '1.05rem', margin: 0 }}>
                            WishFlow follows a standard procedure of using log files. The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
