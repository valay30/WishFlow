import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ExternalLink, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

const ORANGE = 'var(--primary)';

/* Used on non-home pages (search results etc.) — horizontal list style */
export default function ProductCard({ item, categoryName, onTogglePurchased, onRemove, onUpdatePriority }) {
    const navigate = useNavigate();
    const { currency, darkMode } = useSettings();
    const price = new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 2 }).format(item.price);
    
    const [priorityMenuData, setPriorityMenuData] = useState(null);

    // Close menu on scroll to prevent detached menus
    useEffect(() => {
        if (!priorityMenuData) return;
        const handleScroll = () => setPriorityMenuData(null);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [priorityMenuData]);

    return (
        <div
            className="item-card"
            onClick={() => navigate(`/product/${item.id}`)}
            style={{
                opacity: item.is_purchased ? 0.65 : 1,
                filter: item.is_purchased ? 'grayscale(0.6)' : 'none',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: 'var(--surface)',
                padding: '1rem',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
            }}
        >
            {/* Thumbnail */}
            <div style={{
                width: '64px', height: '64px', borderRadius: '14px', overflow: 'hidden',
                background: 'var(--surface-2)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
                position: 'relative'
            }}>
                {item.image
                    ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '1.8rem' }}>🛍️</span>
                }
                {onTogglePurchased && (
                    <div
                        onClick={(e) => { e.stopPropagation(); onTogglePurchased(item.id, !item.is_purchased); }}
                        style={{
                            position: 'absolute', bottom: '0.2rem', right: '0.2rem',
                            width: '22px', height: '22px', borderRadius: '50%',
                            background: item.is_purchased ? '#059669' : 'rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(4px)',
                            color: '#fff',
                            border: `1.5px solid ${item.is_purchased ? '#059669' : 'rgba(255,255,255,0.3)'}`,
                            cursor: 'pointer', zIndex: 10,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Check size={12} strokeWidth={item.is_purchased ? 3 : 2} style={{ opacity: item.is_purchased ? 1 : 0.7 }} />
                    </div>
                )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <p style={{
                    fontWeight: 700, color: 'var(--text)', fontSize: '1rem',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden', margin: 0, lineHeight: 1.2
                }}>
                    {item.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '0.15rem 0.5rem', borderRadius: '99px', border: '1px solid var(--border)' }}>
                        {categoryName}
                    </span>
                    {onUpdatePriority && item.priority && (
                        <span 
                        onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setPriorityMenuData({ x: rect.left, y: rect.bottom + 6 });
                        }}
                            style={{
                                display: 'inline-flex', alignItems: 'center',
                                fontSize: '0.72rem', fontWeight: 800,
                                background: item.priority === 3 ? 'rgba(252, 165, 165, 0.2)' : item.priority === 2 ? 'rgba(253, 224, 71, 0.2)' : 'var(--surface-2)',
                                color: item.priority === 3 ? '#f87171' : item.priority === 2 ? '#eab308' : 'var(--text-muted)',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '99px',
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                border: `1px solid ${item.priority === 3 ? 'rgba(252, 165, 165, 0.3)' : item.priority === 2 ? 'rgba(253, 224, 71, 0.3)' : 'var(--border)'}`,
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {item.priority === 3 ? '🔥 High' : item.priority === 2 ? '⭐ Med' : '⏬ Low'}
                        </span>
                    )}
                    {item.link && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ display: 'flex', alignItems: 'center', color: 'var(--text-dim)', textDecoration: 'none' }}
                            title="Open link" >
                            <ExternalLink size={13} />
                        </a>
                    )}
                </div>
            </div>

            {/* Price + Action */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                <span style={{ color: 'var(--text)', fontWeight: 800, fontSize: '1.05rem', marginRight: '0.2rem' }}>{price}</span>
                {onRemove ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        style={{
                            width: '32px', height: '32px', borderRadius: '10px',
                            background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                ) : (
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '10px',
                        background: 'var(--surface-2)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <ChevronRight size={16} color="var(--text-muted)" />
                    </div>
                )}
            </div>

            {/* Priority Menu Portal */}
            {priorityMenuData && createPortal(
                <div 
                    onClick={(e) => { e.stopPropagation(); setPriorityMenuData(null); }}
                    style={{ position: 'fixed', inset: 0, zIndex: 999999 }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            position: 'absolute', top: priorityMenuData.y, left: priorityMenuData.x,
                            background: darkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                            borderRadius: '14px', padding: '6px',
                            boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                            display: 'flex', flexDirection: 'column', gap: '4px',
                            minWidth: '160px', transformOrigin: 'top left'
                        }}
                    >
                        <div 
                            onClick={(e) => { e.stopPropagation(); onUpdatePriority(3); setPriorityMenuData(null); }} 
                            style={{ padding: '10px 14px', cursor: 'pointer', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', transition: 'background 0.15s' }} 
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(252, 165, 165, 0.15)'} 
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            🔥 High Priority
                        </div>
                        <div 
                            onClick={(e) => { e.stopPropagation(); onUpdatePriority(2); setPriorityMenuData(null); }} 
                            style={{ padding: '10px 14px', cursor: 'pointer', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#eab308', transition: 'background 0.15s' }} 
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(253, 224, 71, 0.15)'} 
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            ⭐ Medium Priority
                        </div>
                        <div 
                            onClick={(e) => { e.stopPropagation(); onUpdatePriority(1); setPriorityMenuData(null); }} 
                            style={{ padding: '10px 14px', cursor: 'pointer', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', transition: 'background 0.15s' }} 
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'} 
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            ⏬ Low Priority
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}
        </div>
    );
}
