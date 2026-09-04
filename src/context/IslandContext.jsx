import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Info, X, Loader2 } from 'lucide-react';

const IslandContext = createContext();

export function useIsland() {
    return useContext(IslandContext);
}

export function IslandProvider({ children }) {
    const [islandState, setIslandState] = useState({
        isOpen: false,
        title: '',
        subtitle: '',
        type: 'info', // 'success', 'error', 'info', 'loading'
        action: null, // { label: 'Undo', onClick: () => {} }
    });
    
    const timeoutRef = useRef(null);

    const showIsland = useCallback(({ title, subtitle, type = 'info', action = null, duration = 3000 }) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        setIslandState({ isOpen: true, title, subtitle, type, action });

        if (type !== 'loading' && duration > 0) {
            timeoutRef.current = setTimeout(() => {
                setIslandState(prev => ({ ...prev, isOpen: false }));
            }, duration);
        }
    }, []);

    const hideIsland = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIslandState(prev => ({ ...prev, isOpen: false }));
    }, []);

    return (
        <IslandContext.Provider value={{ showIsland, hideIsland }}>
            {children}
            
            {/* Dynamic Island Portal/Overlay */}
            <div style={{
                position: 'fixed',
                top: 16,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                zIndex: 99999,
                pointerEvents: 'none'
            }}>
                <AnimatePresence mode="wait">
                    {islandState.isOpen && (
                        <motion.div
                            key="island"
                            initial={{ y: -50, scale: 0.8, opacity: 0, filter: 'blur(10px)' }}
                            animate={{ y: 0, scale: 1, opacity: 1, filter: 'blur(0px)' }}
                            exit={{ y: -30, scale: 0.85, opacity: 0, filter: 'blur(5px)' }}
                            transition={{ type: 'spring', damping: 24, stiffness: 400 }}
                            style={{
                                background: '#000',
                                color: '#fff',
                                borderRadius: '32px',
                                padding: islandState.subtitle ? '0.75rem 1.25rem' : '0.55rem 1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                                minWidth: '140px',
                                maxWidth: '90vw',
                                pointerEvents: 'auto',
                                cursor: 'default',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Icon Area */}
                            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {islandState.type === 'success' && <div style={{ background: '#34C759', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={14} color="#000" strokeWidth={3} /></div>}
                                {islandState.type === 'error' && <div style={{ background: '#FF3B30', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} color="#000" strokeWidth={3} /></div>}
                                {islandState.type === 'loading' && <Loader2 size={20} color="#007AFF" className="spin-anim" />}
                                {islandState.type === 'info' && <Info size={20} color="#007AFF" />}
                            </div>

                            {/* Text Area */}
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, justifyContent: 'center' }}>
                                <motion.span layout="position" style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.1 }}>
                                    {islandState.title}
                                </motion.span>
                                <AnimatePresence>
                                    {islandState.subtitle && (
                                        <motion.span 
                                            initial={{ opacity: 0, height: 0, marginTop: 0 }} 
                                            animate={{ opacity: 0.7, height: 'auto', marginTop: 4 }} 
                                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                            style={{ fontSize: '0.78rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.1 }}
                                        >
                                            {islandState.subtitle}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Action Button */}
                            {islandState.action && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        islandState.action.onClick();
                                        hideIsland();
                                    }}
                                    style={{
                                        background: 'rgba(255,255,255,0.15)',
                                        border: 'none',
                                        color: '#fff',
                                        fontWeight: 700,
                                        fontSize: '0.75rem',
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '99px',
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                        marginLeft: '0.5rem',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                                >
                                    {islandState.action.label}
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <style>{`
                .spin-anim { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </IslandContext.Provider>
    );
}
