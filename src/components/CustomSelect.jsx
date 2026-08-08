import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

export default function CustomSelect({
    value,
    onChange,
    options = [],
    placeholder = 'Select...',
    style = {},
    disabled = false,
    required = false,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    // Normalize options format: array of { value, label, icon } or simple strings/numbers
    const normalizedOptions = options.map(opt => {
        if (typeof opt === 'object' && opt !== null) {
            return {
                value: opt.value ?? opt.id,
                label: opt.label ?? opt.name,
                icon: opt.icon || opt.emoji,
            };
        }
        return { value: opt, label: String(opt), icon: null };
    });

    const selectedOption = normalizedOptions.find(o => String(o.value) === String(value));

    // Update position on open or scroll
    const updatePosition = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + 6,
                left: rect.left,
                width: rect.width,
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [isOpen]);

    // Close on click outside (desktop & fallback)
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const ORANGE = 'var(--primary)';
    const SURFACE2 = 'var(--surface-2)';
    const BORDER = 'var(--border)';

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            {/* Hidden native input for form validation if required */}
            <input
                type="text"
                value={value || ''}
                onChange={() => { }}
                required={required}
                tabIndex={-1}
                style={{
                    position: 'absolute',
                    opacity: 0,
                    width: 0,
                    height: 0,
                    pointerEvents: 'none',
                }}
            />

            {/* Custom Trigger Button */}
            <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(prev => !prev);
                }}
                style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    background: SURFACE2,
                    border: `1.5px solid ${isOpen ? ORANGE : BORDER}`,
                    borderRadius: '14px',
                    color: selectedOption ? 'var(--text)' : 'var(--text-dim)',
                    fontFamily: 'inherit',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    outline: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxShadow: isOpen ? '0 0 0 4px rgba(var(--primary-rgb),0.12)' : 'none',
                    opacity: disabled ? 0.6 : 1,
                    boxSizing: 'border-box',
                    touchAction: 'manipulation',
                    ...style,
                }}
            >
                <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {selectedOption?.icon && (
                        typeof selectedOption.icon === 'string' ? <span>{selectedOption.icon}</span> : <selectedOption.icon size={16} />
                    )}
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={16}
                    style={{
                        color: 'var(--text-muted)',
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s ease',
                        flexShrink: 0,
                        marginLeft: 'auto',
                    }}
                />
            </button>

            {/* Custom Floating Card Dropdown Menu via Portal to document.body */}
            {isOpen && createPortal(
                <>
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                        }}
                        style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'transparent' }}
                    />
                    <div
                        className="custom-select-menu"
                        style={{
                            position: 'fixed',
                            top: coords.top,
                            left: coords.left,
                            width: coords.width,
                            zIndex: 9999,
                            maxHeight: '260px',
                            overflowY: 'auto',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            background: 'var(--surface)',
                            border: `1.5px solid ${BORDER}`,
                            borderRadius: '20px',
                            padding: '0.45rem',
                            boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
                            animation: 'fadeIn 0.15s ease-out',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.2rem',
                            boxSizing: 'border-box',
                        }}
                    >
                        {normalizedOptions.map((opt) => {
                            const isActive = String(opt.value) === String(value);
                            const IconComp = typeof opt.icon !== 'string' ? opt.icon : null;

                            return (
                                <button
                                    key={String(opt.value)}
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justify: 'space-between',
                                        width: '100%',
                                        padding: '0.7rem 0.85rem',
                                        borderRadius: '14px',
                                        border: 'none',
                                        background: isActive ? 'rgba(var(--primary-rgb),0.12)' : 'transparent',
                                        color: isActive ? ORANGE : 'var(--text)',
                                        fontWeight: isActive ? 700 : 500,
                                        fontSize: '0.9rem',
                                        fontFamily: 'inherit',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.15s ease',
                                        touchAction: 'manipulation',
                                    }}
                                    onMouseEnter={e => {
                                        if (!isActive) e.currentTarget.style.background = 'var(--surface-2)';
                                    }}
                                    onMouseLeave={e => {
                                        if (!isActive) e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        {opt.icon && (
                                            IconComp ? <IconComp size={16} color={isActive ? ORANGE : 'var(--text-muted)'} /> : <span>{opt.icon}</span>
                                        )}
                                        {opt.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </>,
                document.body
            )}
            <style>{`
                .custom-select-menu::-webkit-scrollbar {
                    display: none !important;
                    width: 0 !important;
                    height: 0 !important;
                }
            `}</style>
        </div>
    );
}
