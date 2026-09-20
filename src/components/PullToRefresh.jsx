import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

const MAX_PULL = 150;
const REFRESH_THRESHOLD = 80;

export default function PullToRefresh({ onRefresh, children }) {
    const controls = useAnimation();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const startY = useRef(0);
    const currentY = useRef(0);
    const isPulling = useRef(false);

    useEffect(() => {
        // Prevent default only when pulling down at the top of the page
        const handleTouchStart = (e) => {
            if (window.scrollY > 0) return;
            isPulling.current = true;
            startY.current = e.touches[0].clientY;
        };

        const handleTouchMove = (e) => {
            if (!isPulling.current) return;
            const y = e.touches[0].clientY;
            const diff = y - startY.current;

            if (diff > 0 && window.scrollY <= 0) {
                // Prevent default scrolling when pulling down
                if (e.cancelable) e.preventDefault();
                
                // Elastic rubber-band math
                const pull = diff * 0.4;
                currentY.current = Math.min(pull, MAX_PULL);
                
                controls.set({ y: currentY.current });
            } else if (diff < 0) {
                // If they start scrolling back up normally, cancel pull
                isPulling.current = false;
                currentY.current = 0;
                controls.set({ y: 0 });
            }
        };

        const handleTouchEnd = async () => {
            if (!isPulling.current) return;
            isPulling.current = false;

            if (currentY.current >= REFRESH_THRESHOLD && !isRefreshing) {
                setIsRefreshing(true);
                // Snap to loading position
                await controls.start({ y: 60, transition: { type: 'spring', stiffness: 300, damping: 20 } });
                
                if (onRefresh) {
                    await onRefresh();
                }
                
                // After refresh, spring back up
                setIsRefreshing(false);
                currentY.current = 0;
                controls.start({ y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
            } else {
                // Spring back if didn't pull far enough
                currentY.current = 0;
                controls.start({ y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
            }
        };

        // Needs to be non-passive to prevent default scrolling behavior
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [controls, isRefreshing, onRefresh]);

    return (
        <motion.div animate={controls} style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
            <div style={{
                position: 'absolute',
                top: '-70px',
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '70px',
                pointerEvents: 'none' // Ensure it doesn't block touches
            }}>
                <motion.div
                    animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
                    transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: (t) => Math.floor(t * 12) / 12 } : {}}
                    style={{
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <rect
                                key={i}
                                x="11"
                                y="1"
                                width="2"
                                height="6"
                                rx="1"
                                fill="currentColor"
                                style={{ color: 'var(--text-muted)' }}
                                opacity={Math.max(0.25, (i + 1) / 12)}
                                transform={`rotate(${i * 30} 12 12)`}
                            />
                        ))}
                    </svg>
                </motion.div>
            </div>
            {children}
        </motion.div>
    );
}
