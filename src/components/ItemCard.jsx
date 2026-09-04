import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Globe, Edit2, Share, Trash2 } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import MagneticButton from './MagneticButton';
import { useSettings } from '../context/SettingsContext';
import { useIsland } from '../context/IslandContext';
import confetti from 'canvas-confetti';

const ORANGE = 'var(--primary)';
const SURFACE = 'var(--surface)';
const BORDER = 'var(--border)';

export default function ItemCard({
    item, categoryName, onRemove, onTogglePurchased, onTogglePublic
}) {
    const navigate = useNavigate();
    const { currency, viewMode, darkMode } = useSettings();
    const { showIsland } = useIsland();
    const price = new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 2 }).format(item.price);
    
    const [showPublicConfirm, setShowPublicConfirm] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Context Menu State
    const [contextMenuData, setContextMenuData] = useState(null);
    const longPressTimerRef = useRef(null);
    const startPos = useRef({ x: 0, y: 0 });
    const wasLongPressed = useRef(false);
    const cardRef = useRef(null);

    // Parallax Tilt Setup
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7.5deg", "-7.5deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7.5deg", "7.5deg"]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        x.set(mouseX / width - 0.5);
        y.set(mouseY / height - 0.5);
    };

    const handlePointerDown = (e) => {
        if (e.type === 'mousedown' && e.button !== 0) return;
        wasLongPressed.current = false;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        startPos.current = { x: clientX, y: clientY };
        
        longPressTimerRef.current = setTimeout(() => {
            wasLongPressed.current = true;
            if (navigator.vibrate) navigator.vibrate(50);
            
            // Calculate position
            const rect = cardRef.current.getBoundingClientRect();
            const clientWidth = document.documentElement.clientWidth;
            const clientHeight = document.documentElement.clientHeight;
            const menuWidth = 220;
            const menuHeight = 220; // approximate max height
            const padding = 16;
            
            let menuX, menuY, originX, originY;
            let cardTop = rect.top; // default clone position

            if (rect.right + padding + menuWidth <= clientWidth) {
                // Place to the right
                menuX = rect.right + padding;
                menuY = rect.top;
                originX = 'left';
                originY = 'top';
                
                // Clamp menuY to screen bounds (top and bottom)
                menuY = Math.max(padding, Math.min(menuY, clientHeight - padding - menuHeight));
            } else if (rect.left - padding - menuWidth >= 0) {
                // Place to the left
                menuX = rect.left - padding - menuWidth;
                menuY = rect.top;
                originX = 'right';
                originY = 'top';
                
                // Clamp menuY to screen bounds (top and bottom)
                menuY = Math.max(padding, Math.min(menuY, clientHeight - padding - menuHeight));
            } else {
                // Mobile layout: Not enough space left or right. Place it below the card, centered.
                menuX = Math.max(padding, Math.min(clientWidth - padding - menuWidth, rect.left + (rect.width / 2) - (menuWidth / 2)));
                
                menuY = rect.bottom + padding;
                originX = 'center';
                originY = 'top';

                // Check if it goes off the bottom of the screen
                const overflowY = (menuY + menuHeight) - (clientHeight - padding);
                if (overflowY > 0) {
                    // Shift both the menu AND the cloned card up so they don't overlap, while staying on screen
                    menuY -= overflowY;
                    cardTop -= overflowY;
                }
                
                // Ensure the card doesn't get pushed completely off the top of the screen
                if (cardTop < padding) {
                    const underflow = padding - cardTop;
                    cardTop += underflow;
                    menuY += underflow; 
                }
            }
            
            setContextMenuData({ rect, menuX, menuY, originX, originY, cardTop });
        }, 400);
    };

    const handlePointerMove = (e) => {
        if (longPressTimerRef.current) {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const dx = clientX - startPos.current.x;
            const dy = clientY - startPos.current.y;
            if (Math.hypot(dx, dy) > 10) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
            }
        }
        if (e.type === 'mousemove') {
            handleMouseMove(e);
        }
    };

    const handlePointerUpOrLeave = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    const handleMouseLeaveInner = () => {
        handlePointerUpOrLeave();
        setIsHovered(false);
        x.set(0);
        y.set(0);
    };

    const handleClick = (e) => {
        if (wasLongPressed.current) {
            e.preventDefault();
            e.stopPropagation();
            wasLongPressed.current = false;
            return;
        }
        navigate(`/product/${item.id}`);
    };

    // Close menu on scroll to prevent detached menus
    useEffect(() => {
        if (!contextMenuData) return;
        const handleScroll = () => setContextMenuData(null);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [contextMenuData]);

    const handleAction = (e, action) => {
        e.stopPropagation();
        setContextMenuData(null);
        setTimeout(action, 150); // slight delay to allow menu animation to start closing
    };

    const renderCardContent = (isClone = false) => (
        <>
            {/* ── Inset image box ── */}
            <div style={{ padding: '0.8rem 0.8rem 0.4rem', position: 'relative' }}>
                <div style={{
                    background: 'var(--surface-2)',
                    borderRadius: '16px',
                    aspectRatio: viewMode === 'masonry' ? 'auto' : '1 / 1',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)',
                    border: '1px solid var(--border)',
                    position: 'relative'
                }}>
                    {item.image ? (
                        <img src={item.image} alt={item.name} style={{ width: '100%', height: viewMode === 'masonry' ? 'auto' : '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                        <span style={{ fontSize: '2.5rem', color: 'var(--text-muted)', padding: viewMode === 'masonry' ? '3rem 0' : 0 }}>📦</span>
                    )}
                    
                    {/* Only show inline buttons if NOT the context menu clone */}
                    {!isClone && onTogglePublic && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!item.is_public) setShowPublicConfirm(true);
                                else onTogglePublic(item.id, false);
                            }}
                            title={item.is_public ? 'Remove from Discover' : 'Share on Discover'}
                            style={{
                                position: 'absolute', bottom: '0.5rem', left: '0.5rem',
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: item.is_public ? 'rgba(var(--primary-rgb),0.85)' : 'rgba(0,0,0,0.45)',
                                backdropFilter: 'blur(8px)',
                                color: '#fff',
                                border: `1.5px solid ${item.is_public ? 'rgba(var(--primary-rgb),1)' : 'rgba(255,255,255,0.25)'}`,
                                cursor: 'pointer', zIndex: 10,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: item.is_public ? '0 0 10px rgba(var(--primary-rgb),0.5)' : '0 2px 8px rgba(0,0,0,0.15)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            <Globe size={14} strokeWidth={2} />
                        </div>
                    )}
                </div>
            </div>

            {/* ── Content below image ── */}
            <div style={{ padding: '0.75rem 0.9rem 1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <p style={{
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    color: 'var(--text)',
                    lineHeight: 1.3,
                    minHeight: '2.6em',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    margin: '0 0 0.5rem 0',
                    flex: 1,
                }}>
                    {item.name}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <span style={{
                            display: 'inline-block',
                            fontSize: '0.65rem', fontWeight: 800,
                            color: 'var(--text-muted)',
                            background: 'var(--surface-2)',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                            border: '1px solid var(--border)',
                            whiteSpace: 'nowrap',
                        }}>
                            {categoryName}
                        </span>
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '0.5rem',
                    }}>
                        <p style={{
                            fontWeight: 900,
                            fontSize: '1.15rem',
                            color: 'var(--text)',
                            letterSpacing: '-0.02em',
                        }}>
                            {price}
                        </p>

                        {!isClone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <MagneticButton>
                                    <a
                                        href={item.link || '#'}
                                        target={item.link ? '_blank' : '_self'}
                                        rel="noopener noreferrer"
                                        onClick={e => {
                                            if (!item.link) {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                navigate(`/product/${item.id}`);
                                            } else {
                                                e.stopPropagation();
                                            }
                                        }}
                                        style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            background: ORANGE,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            boxShadow: '0 4px 12px rgba(var(--primary-rgb),0.28)',
                                            transition: 'transform 0.18s ease, background 0.18s ease',
                                            textDecoration: 'none',
                                            cursor: 'pointer',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; }}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                        title={item.link ? 'Open product link' : 'View details'}
                                    >
                                        <ArrowRight size={17} color="#fff" strokeWidth={2.5} />
                                    </a>
                                </MagneticButton>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <>
            <motion.div
                ref={cardRef}
                onClick={handleClick}
                onMouseDown={handlePointerDown}
                onTouchStart={handlePointerDown}
                onMouseMove={handlePointerMove}
                onTouchMove={handlePointerMove}
                onMouseUp={handlePointerUpOrLeave}
                onTouchEnd={handlePointerUpOrLeave}
                onTouchCancel={handlePointerUpOrLeave}
                onMouseLeave={handleMouseLeaveInner}
                onMouseEnter={() => setIsHovered(true)}
                animate={{
                    y: isHovered ? -6 : 0,
                    opacity: contextMenuData ? 0 : 1 // hide original when context menu is open
                }}
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                    background: SURFACE,
                    border: isHovered
                        ? `1.5px solid ${ORANGE}`
                        : `1.5px solid ${BORDER}`,
                    borderRadius: '24px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'border-color 0.22s ease, box-shadow 0.22s ease',
                    overflow: 'hidden',
                    position: 'relative',
                    filter: item.is_purchased ? 'grayscale(0.6)' : 'none',
                    boxShadow: isHovered
                        ? `0 12px 32px rgba(var(--primary-rgb),0.18)`
                        : '0 4px 12px rgba(0,0,0,0.03)',
                }}
            >
                {renderCardContent()}
            </motion.div>

            {/* Context Menu Portal */}
            {createPortal(
                <AnimatePresence>
                    {contextMenuData && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 99999 }}>
                            {/* Blur Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                onClick={() => setContextMenuData(null)}
                                style={{
                                    position: 'absolute', inset: 0,
                                    background: darkMode ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)',
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                }}
                            />
                            
                            {/* Cloned Card */}
                            <motion.div
                                initial={{ 
                                    top: contextMenuData.rect.top, 
                                    left: contextMenuData.rect.left, 
                                    width: contextMenuData.rect.width, 
                                    height: contextMenuData.rect.height,
                                    scale: 1,
                                    boxShadow: '0 0 0 rgba(0,0,0,0)'
                                }}
                                animate={{ 
                                    top: contextMenuData.cardTop, // animate to shifted position
                                    scale: 1.05,
                                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)'
                                }}
                                exit={{ 
                                    top: contextMenuData.rect.top, // animate back to original position
                                    scale: 1,
                                    boxShadow: '0 0 0 rgba(0,0,0,0)',
                                    opacity: 0
                                }}
                                transition={{ type: "spring", damping: 22, stiffness: 300 }}
                                style={{
                                    position: 'absolute',
                                    background: SURFACE,
                                    borderRadius: '24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden',
                                    filter: item.is_purchased ? 'grayscale(0.6)' : 'none',
                                    border: `1.5px solid ${BORDER}`,
                                    pointerEvents: 'none', // purely visual clone
                                }}
                            >
                                {renderCardContent(true)}
                            </motion.div>

                            {/* Floating Context Menu Options */}
                            <motion.div
                                initial={{ 
                                    opacity: 0, 
                                    scale: 0.8, 
                                    x: contextMenuData.originX === 'left' ? -15 : (contextMenuData.originX === 'right' ? 15 : 0),
                                    y: contextMenuData.originY === 'top' && contextMenuData.originX === 'center' ? -15 : (contextMenuData.originY === 'bottom' ? 15 : 0)
                                }}
                                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                                transition={{ type: "spring", damping: 25, stiffness: 350, delay: 0.05 }}
                                style={{
                                    position: 'absolute',
                                    top: contextMenuData.menuY,
                                    left: contextMenuData.menuX,
                                    width: '220px',
                                    background: darkMode ? 'rgba(30, 30, 30, 0.75)' : 'rgba(255, 255, 255, 0.85)',
                                    backdropFilter: 'blur(30px) saturate(1.5)',
                                    WebkitBackdropFilter: 'blur(30px) saturate(1.5)',
                                    borderRadius: '16px',
                                    padding: '6px',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transformOrigin: `${contextMenuData.originX} ${contextMenuData.originY}`
                                }}
                            >
                                <ContextMenuItem 
                                    icon={Edit2} label="Edit Details" 
                                    onClick={(e) => handleAction(e, () => navigate(`/product/${item.id}?edit=true`))} 
                                />
                                {onTogglePurchased && (
                                    <ContextMenuItem 
                                        icon={Check} label={item.is_purchased ? "Unmark Purchased" : "Mark Purchased"} 
                                        onClick={(e) => handleAction(e, () => {
                                            if (!item.is_purchased) {
                                                const end = Date.now() + 2 * 1000;
                                                const colors = ['#059669', '#10B981', '#34D399', '#ffffff'];
                                                (function frame() {
                                                    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: colors });
                                                    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: colors });
                                                    if (Date.now() < end) requestAnimationFrame(frame);
                                                }());
                                            }
                                            onTogglePurchased(item.id, !item.is_purchased);
                                        })} 
                                    />
                                )}
                                {onTogglePublic && (
                                    <ContextMenuItem 
                                        icon={Globe} label={item.is_public ? "Remove from Discover" : "Share to Discover"} 
                                        onClick={(e) => handleAction(e, () => {
                                            if (!item.is_public) setShowPublicConfirm(true);
                                            else onTogglePublic(item.id, false);
                                        })} 
                                    />
                                )}
                                {onRemove && (
                                    <ContextMenuItem 
                                        icon={Trash2} label="Delete Item" 
                                        color="#ef4444" isLast
                                        onClick={(e) => handleAction(e, () => onRemove())} 
                                    />
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Confirmation Modal for Discover */}
            {showPublicConfirm && createPortal(
                <div
                    onClick={(e) => { e.stopPropagation(); setShowPublicConfirm(false); }}
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(4px)'
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'var(--surface)', padding: '2.5rem 2rem', borderRadius: '24px',
                            maxWidth: '400px', width: '90%',
                            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
                            textAlign: 'center',
                            cursor: 'default',
                            animation: 'disc-fadeIn 0.25s ease'
                        }}
                    >
                        <Globe size={48} color={ORANGE} style={{ margin: '0 auto 1rem' }} />
                        <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.4rem', color: 'var(--text)', fontWeight: 800 }}>Share to Discover?</h3>
                        <p style={{ margin: '0 0 1.5rem', color: 'var(--text-muted)', lineHeight: 1.5, fontSize: '0.95rem' }}>
                            This will make your item visible to everyone on the public Discover feed. Other users will be able to see it and save it to their own wishlists.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowPublicConfirm(false); }}
                                style={{ flex: 1, padding: '0.9rem', borderRadius: '12px', background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowPublicConfirm(false);
                                    onTogglePublic(item.id, true);
                                }}
                                style={{ flex: 1, padding: '0.9rem', borderRadius: '12px', background: ORANGE, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                            >
                                Share Publicly
                            </button>
                        </div>
                    </div>
                </div>
                , document.body)}
        </>
    );
}

const ContextMenuItem = ({ icon: Icon, label, onClick, color = 'var(--text)', isLast = false }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px',
                color: color,
                cursor: 'pointer',
                borderBottom: isLast ? 'none' : '1px solid rgba(128,128,128,0.15)',
                fontWeight: 600,
                fontSize: '0.95rem',
                background: hovered ? 'rgba(128,128,128,0.1)' : 'transparent',
                borderRadius: '10px',
                transition: 'background 0.15s ease'
            }}
        >
            <span>{label}</span>
            <Icon size={18} strokeWidth={2.5} />
        </div>
    );
};
