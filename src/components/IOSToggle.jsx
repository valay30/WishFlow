import { motion } from 'framer-motion';

export default function IOSToggle({ checked, onChange, disabled }) {
    return (
        <div 
            onClick={disabled ? undefined : onChange}
            style={{
                width: '50px',
                height: '30px',
                borderRadius: '30px',
                background: checked ? '#34C759' : 'var(--surface-3)', // fallback to grey
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
                cursor: disabled ? 'default' : 'pointer',
                justifyContent: checked ? 'flex-end' : 'flex-start',
                transition: 'background 0.3s ease',
                opacity: disabled ? 0.5 : 1,
                flexShrink: 0,
                boxSizing: 'border-box'
            }}
        >
            <motion.div
                layout
                style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'var(--surface)',
                    boxShadow: '0 3px 8px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.06)'
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
        </div>
    );
}
