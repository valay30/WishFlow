import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Home } from 'lucide-react';

const FONT = '"Outfit Variable", "Outfit", sans-serif';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100dvh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg)',
            fontFamily: FONT,
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background decorative elements */}
            <div style={{
                position: 'absolute', top: '15%', left: '10%', width: '350px', height: '350px',
                background: 'rgba(232,92,44,0.06)', borderRadius: '50%', filter: 'blur(80px)',
                zIndex: 0, pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute', bottom: '15%', right: '10%', width: '450px', height: '450px',
                background: 'rgba(232,92,44,0.04)', borderRadius: '50%', filter: 'blur(100px)',
                zIndex: 0, pointerEvents: 'none'
            }} />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.2, 1, 0.2, 1] }}
                style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    maxWidth: '540px'
                }}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6, type: 'spring', bounce: 0.4 }}
                    style={{
                        width: '88px',
                        height: '88px',
                        borderRadius: '24px',
                        background: '#FFF5F2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '2rem',
                        boxShadow: '0 20px 40px rgba(232,92,44,0.1)'
                    }}
                >
                    <Compass size={44} color="#E85C2C" strokeWidth={1.5} />
                </motion.div>

                <h1 style={{
                    fontSize: 'clamp(5rem, 12vw, 8rem)',
                    fontWeight: 900,
                    margin: 0,
                    lineHeight: 1,
                    background: 'linear-gradient(135deg, #111 0%, #666 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.04em'
                }}>
                    404
                </h1>
                
                <h2 style={{
                    fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
                    fontWeight: 800,
                    color: 'var(--text)',
                    margin: '1rem 0',
                    letterSpacing: '-0.02em'
                }}>
                    Lost in the flow
                </h2>
                
                <p style={{
                    fontSize: '1.15rem',
                    color: 'var(--text-muted)',
                    margin: '0 0 3rem',
                    lineHeight: 1.6
                }}>
                    The page you're looking for doesn't exist or has been moved. Let's get you back to your wishlist.
                </p>

                <button
                    onClick={() => navigate('/')}
                    style={{
                        background: '#111',
                        color: '#fff',
                        border: 'none',
                        padding: '1.1rem 2.2rem',
                        borderRadius: '100px',
                        fontSize: '1.05rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.2, 1, 0.2, 1)',
                        boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                        fontFamily: FONT
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.2)';
                        e.currentTarget.style.background = '#000';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.12)';
                        e.currentTarget.style.background = '#111';
                    }}
                    onMouseDown={(e) => {
                        e.currentTarget.style.transform = 'translateY(1px)';
                    }}
                >
                    <Home size={20} />
                    Back to Home
                </button>
            </motion.div>
        </div>
    );
}
