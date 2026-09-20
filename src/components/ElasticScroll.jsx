import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function ElasticScroll({ children, style, gap = '0px', padding = '0px' }) {
    const containerRef = useRef(null);
    const contentRef = useRef(null);
    const [constraints, setConstraints] = useState({ left: 0, right: 0 });

    // Calculate constraints on mount and resize
    useEffect(() => {
        const calculateConstraints = () => {
            if (containerRef.current && contentRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                const contentWidth = contentRef.current.scrollWidth;
                // If content is smaller than container, don't allow dragging left
                const left = Math.min(containerWidth - contentWidth, 0);
                setConstraints({ left, right: 0 });
            }
        };

        calculateConstraints();
        window.addEventListener('resize', calculateConstraints);
        // Small delay to ensure children are fully rendered
        setTimeout(calculateConstraints, 100);

        return () => window.removeEventListener('resize', calculateConstraints);
    }, [children]);

    return (
        <div ref={containerRef} style={{ overflow: 'hidden', width: '100%', ...style }}>
            <motion.div
                ref={contentRef}
                drag="x"
                dragConstraints={constraints}
                dragElastic={0.2} // Classic iOS rubber band resistance
                dragTransition={{ bounceStiffness: 400, bounceDamping: 30 }}
                style={{
                    display: 'flex',
                    minWidth: '100%',
                    width: 'max-content',
                    gap,
                    padding,
                    cursor: 'grab',
                }}
                whileTap={{ cursor: 'grabbing' }}
            >
                {children}
            </motion.div>
        </div>
    );
}
