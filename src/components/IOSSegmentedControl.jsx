import { useId } from 'react';
import { motion } from 'framer-motion';

export default function IOSSegmentedControl({ options, value, onChange, trackStyle = {}, activePillStyle = {}, iconColor, activeIconColor }) {
    const uniqueId = useId();

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--surface-2)',
            padding: '3px',
            borderRadius: '9px',
            position: 'relative',
            width: '100%',
            ...trackStyle
        }}>
            {options.map((option) => {
                const isActive = value === option.value;
                const Icon = option.icon;

                return (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        style={{
                            flex: 1,
                            position: 'relative',
                            padding: '6px 12px',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            zIndex: 1,
                            WebkitTapHighlightColor: 'transparent',
                        }}
                    >
                        {isActive && (
                            <motion.div
                                layoutId={`ios-segmented-${uniqueId}`}
                                transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'var(--surface)',
                                    borderRadius: '7px',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.06), 0 1px 1px rgba(0,0,0,0.04)',
                                    zIndex: -1,
                                    ...activePillStyle
                                }}
                            />
                        )}
                        {Icon && (
                            <Icon 
                                size={15} 
                                style={{ 
                                    color: isActive ? (activeIconColor || 'var(--text)') : (iconColor || 'var(--text-muted)'),
                                    transition: 'color 0.2s',
                                    strokeWidth: isActive ? 2.5 : 2
                                }} 
                            />
                        )}
                        {option.label && (
                            <span style={{
                                fontSize: '0.85rem',
                                fontWeight: isActive ? 600 : 500,
                                color: isActive ? (activeIconColor || 'var(--text)') : (iconColor || 'var(--text-muted)'),
                                transition: 'color 0.2s',
                                whiteSpace: 'nowrap'
                            }}>
                                {option.label}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
