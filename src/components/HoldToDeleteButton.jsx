import React, { useState, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

/**
 * HoldToDeleteButton
 * 
 * A pill-shaped button that requires the user to press and hold for a specified duration
 * to trigger the delete action. Features a smooth progress fill animation.
 * 
 * @param {function} onDelete - Callback triggered when the hold duration is complete
 * @param {number} duration - Hold duration in milliseconds (default: 2000)
 * @param {object} style - Additional inline styles for the button container
 */
export default function HoldToDeleteButton({
    onDelete,
    duration = 1500,
    style = {},
}) {
    const [isHolding, setIsHolding] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const timeoutRef = useRef(null);

    const handleStart = (e) => {
        // Prevent default drag/selection on touch if possible without breaking scroll
        // In React, preventDefault on touchstart might be passive by default in some cases,
        // but we can at least stop propagation to avoid parent clicks.
        e.stopPropagation();

        if (isComplete) return;
        setIsHolding(true);

        timeoutRef.current = setTimeout(() => {
            setIsComplete(true);
            setIsHolding(false);
            if (onDelete) onDelete();
            
            // Optional: Reset after a short delay so the button can be reused
            // (Useful if the item isn't immediately unmounted)
            setTimeout(() => {
                setIsComplete(false);
            }, 1000);
        }, duration);
    };

    const handleCancel = (e) => {
        e.stopPropagation();
        if (isComplete) return;
        setIsHolding(false);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <button
            type="button"
            onMouseDown={handleStart}
            onMouseUp={handleCancel}
            onMouseLeave={handleCancel}
            onTouchStart={handleStart}
            onTouchEnd={handleCancel}
            style={{
                position: 'relative',
                overflow: 'hidden',
                padding: '0.9rem',
                background: 'var(--surface-2)', // Light gray background
                border: 'none',
                borderRadius: '9999px', // Pill shape
                cursor: isComplete ? 'default' : 'pointer',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'none', // Prevents touch scrolling while holding
                width: '100%',
                boxSizing: 'border-box',
                ...style
            }}
        >
            {/* Progress Fill Layer */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: isComplete ? '100%' : (isHolding ? '100%' : '0%'),
                    background: '#fecdd3', // Soft pink color
                    transition: isComplete 
                        ? 'none' 
                        : (isHolding ? `width ${duration}ms linear` : 'width 0.3s ease-out'),
                    zIndex: 0,
                }}
            />

            {/* Content Layer */}
            <div
                style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    transition: 'color 0.2s ease',
                }}
            >
                <Trash2 size={17} />
                <span>Hold to Delete</span>
            </div>
        </button>
    );
}
