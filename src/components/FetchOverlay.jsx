import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * FetchOverlay — Beautiful multi-stage loading animation shown while
 * the scraper fetches product data from a shared URL.
 *
 * Stages:
 *   1 → Equalizer bars (audio-style)
 *   2 → Bars morph into dots
 *   3 → Dots expand radially into a circle
 *   4 → Dots spin in continuous orbit
 *
 * Dismisses immediately when `visible` becomes false — no waiting for animation.
 */
export default function FetchOverlay({ visible }) {
    const [stage, setStage] = useState(1);
    const timers = useRef([]);

    useEffect(() => {
        if (!visible) {
            // Clear any pending transitions
            timers.current.forEach(clearTimeout);
            timers.current = [];
            setStage(1); // reset for next open
            return;
        }

        // Reset & start stage transitions
        setStage(1);
        timers.current = [
            setTimeout(() => setStage(2), 750),
            setTimeout(() => setStage(3), 1200),
            setTimeout(() => setStage(4), 1700),
        ];

        return () => {
            timers.current.forEach(clearTimeout);
        };
    }, [visible]);

    if (!visible) return null;

    return createPortal(
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            animation: 'fo-fadein 0.2s ease-out',
        }}>
            {/* Pill container */}
            <div style={{
                background: '#000',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '32px',
                padding: '1.8rem 2.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 24px 64px rgba(0,0,0,0.8), 0 0 30px rgba(255,255,255,0.03)',
            }}>
                {/* Animation canvas */}
                <AnimationCanvas stage={stage} />
            </div>

            <style>{`
                @keyframes fo-fadein { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fo-bar { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.3); } }
                @keyframes fo-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fo-dot-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(0.6); } }
            `}</style>
        </div>,
        document.body
    );
}

function AnimationCanvas({ stage }) {
    const DOT_COUNT = 8;
    const RADIUS = 28;

    if (stage === 1) {
        // Stage 1: Equalizer bars
        const bars = [
            { delay: '0s', height: 36 },
            { delay: '0.15s', height: 52 },
            { delay: '0.3s', height: 36 },
        ];
        return (
            <div style={{ width: '72px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {bars.map((b, i) => (
                    <div key={i} style={{
                        width: '10px',
                        height: `${b.height}px`,
                        borderRadius: '99px',
                        background: '#fff',
                        animation: `fo-bar 0.7s ease-in-out infinite`,
                        animationDelay: b.delay,
                        transition: 'height 0.4s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                ))}
            </div>
        );
    }

    if (stage === 2) {
        // Stage 2: Bars morphing to equal-height dots
        return (
            <div style={{ width: '72px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                {[0, 1, 2].map(i => (
                    <div key={i} style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: '#fff',
                        animation: `fo-dot-pulse 0.5s ease-in-out infinite`,
                        animationDelay: `${i * 0.15}s`,
                        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                ))}
            </div>
        );
    }

    if (stage === 3) {
        // Stage 3: Dots expanding into a radial circle
        return (
            <div style={{ width: '80px', height: '80px', position: 'relative' }}>
                {Array.from({ length: DOT_COUNT }).map((_, i) => {
                    const angle = (i / DOT_COUNT) * 360;
                    const rad = (angle * Math.PI) / 180;
                    const x = RADIUS * Math.cos(rad);
                    const y = RADIUS * Math.sin(rad);
                    return (
                        <div key={i} style={{
                            position: 'absolute',
                            width: '9px',
                            height: '9px',
                            borderRadius: '50%',
                            background: '#fff',
                            top: '50%',
                            left: '50%',
                            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                            opacity: 1 - (i / DOT_COUNT) * 0.5,
                            transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
                            animationDelay: `${i * 0.05}s`,
                        }} />
                    );
                })}
            </div>
        );
    }

    // Stage 4: Spinning orbit with staggered trail
    return (
        <div style={{
            width: '80px',
            height: '80px',
            position: 'relative',
            animation: 'fo-spin 1.2s linear infinite',
        }}>
            {Array.from({ length: DOT_COUNT }).map((_, i) => {
                const angle = (i / DOT_COUNT) * 360;
                const rad = (angle * Math.PI) / 180;
                const x = RADIUS * Math.cos(rad);
                const y = RADIUS * Math.sin(rad);
                const trailOpacity = 0.15 + ((DOT_COUNT - i) / DOT_COUNT) * 0.85;
                const trailScale = 0.4 + ((DOT_COUNT - i) / DOT_COUNT) * 0.6;
                return (
                    <div key={i} style={{
                        position: 'absolute',
                        width: `${9 * trailScale}px`,
                        height: `${9 * trailScale}px`,
                        borderRadius: '50%',
                        background: '#fff',
                        top: '50%',
                        left: '50%',
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                        opacity: trailOpacity,
                    }} />
                );
            })}
        </div>
    );
}
