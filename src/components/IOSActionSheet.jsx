import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

export default function IOSActionSheet({ isOpen, onClose, title, options, selectedValue, onSelect }) {
    if (typeof window === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '16px' }}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(5px)',
                            WebkitBackdropFilter: 'blur(5px)',
                        }}
                    />
                    
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 340 }}
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '400px',
                            margin: '0 auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            zIndex: 1,
                            paddingBottom: 'env(safe-area-inset-bottom, 8px)'
                        }}
                    >
                        <style>{`
                            .ios-action-btn:hover {
                                background: rgba(128,128,128,0.1) !important;
                            }
                            .ios-action-btn:active {
                                background: rgba(128,128,128,0.2) !important;
                            }
                        `}</style>
                        
                        {/* Main Group */}
                        <div style={{
                            background: 'var(--surface)',
                            borderRadius: '14px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {title && (
                                <div style={{
                                    padding: '14px 16px',
                                    textAlign: 'center',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    color: 'var(--text-dim)',
                                    borderBottom: '1px solid var(--border)'
                                }}>
                                    {title}
                                </div>
                            )}
                            
                            {options.map((opt, idx) => {
                                if (opt.id === 'divider') {
                                    return <div key={'div-'+idx} style={{ height: '1px', background: 'var(--border)' }} />;
                                }
                                
                                const Icon = opt.icon;
                                const isActive = selectedValue === opt.id;
                                
                                return (
                                    <button
                                        key={opt.id}
                                        className="ios-action-btn"
                                        onClick={() => {
                                            onSelect(opt.id);
                                            onClose();
                                        }}
                                        style={{
                                            padding: '16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            background: 'transparent',
                                            border: 'none',
                                            borderBottom: idx < options.length - 1 ? '1px solid var(--border)' : 'none',
                                            fontSize: '1rem',
                                            fontWeight: 500,
                                            color: opt.destructive ? '#ff3b30' : 'var(--text)',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s',
                                            WebkitTapHighlightColor: 'transparent',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {Icon && <Icon size={18} style={{ color: opt.destructive ? '#ff3b30' : 'var(--text)' }} />}
                                            <span>{opt.label}</span>
                                        </div>
                                        {isActive && <Check size={18} color="var(--primary)" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Cancel Button */}
                        <button
                            className="ios-action-btn"
                            onClick={onClose}
                            style={{
                                background: 'var(--surface)',
                                borderRadius: '14px',
                                padding: '16px',
                                fontSize: '1.05rem',
                                fontWeight: 700,
                                color: 'var(--text)', // Default iOS is blue, but we stick to theme color
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                                WebkitTapHighlightColor: 'transparent',
                                display: 'flex',
                                justifyContent: 'center',
                            }}
                        >
                            Cancel
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
