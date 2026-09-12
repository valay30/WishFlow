import { useEffect, useState, useRef } from 'react';
import { motion, useSpring } from 'framer-motion';
import { API_URL } from '../config';

export default function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Exact position for the small dot
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Spring position for the trailing ring
  const cursorX = useSpring(0, { stiffness: 500, damping: 28 });
  const cursorY = useSpring(0, { stiffness: 500, damping: 28 });

  // Admin setting
  const [isEnabledByAdmin, setIsEnabledByAdmin] = useState(true);

  useEffect(() => {
    // Fetch feature flag for custom cursor
    fetch(`${API_URL}/api/public/features`)
      .then(res => res.json())
      .then(data => {
        if (data.custom_cursor_enabled !== undefined) {
          setIsEnabledByAdmin(data.custom_cursor_enabled);
        }
      })
      .catch(err => console.error('Failed to fetch cursor setting:', err));

    const handleCursorSetting = (e) => {
      setIsEnabledByAdmin(e.detail.enabled);
    };

    window.addEventListener('cursorSettingChanged', handleCursorSetting);
    return () => window.removeEventListener('cursorSettingChanged', handleCursorSetting);
  }, []);

  useEffect(() => {
    if (!isEnabledByAdmin) {
      document.body.classList.remove('custom-cursor-active');
      return;
    }

    // Disable on touch devices (mobile/tablet)
    if (window.matchMedia("(pointer: coarse)").matches) {
      setIsTouchDevice(true);
      return;
    }

    const moveCursor = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseOver = (e) => {
      const isInteractive = e.target.closest('a, button, input, textarea, select, .item-card, .cat-card, [role="button"], .sidebar-nav-link');
      setIsHovering(!!isInteractive);
    };

    window.addEventListener('mousemove', moveCursor);
    document.addEventListener('mouseover', handleMouseOver);

    // Hide default cursor globally on non-touch devices when active
    document.body.classList.add('custom-cursor-active');

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseover', handleMouseOver);
      document.body.classList.remove('custom-cursor-active');
    };
  }, [cursorX, cursorY, isVisible, isEnabledByAdmin]);

  if (isTouchDevice || !isVisible || !isEnabledByAdmin) return null;

  return (
    <>
      {/* The main solid dot */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          x: mousePos.x,
          y: mousePos.y,
          width: 8,
          height: 8,
          translateX: '-50%',
          translateY: '-50%',
          borderRadius: '50%',
          backgroundColor: isHovering ? 'transparent' : 'var(--primary)',
          pointerEvents: 'none',
          zIndex: 999999,
        }}
      />
      {/* The trailing magnetic ring */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          x: cursorX,
          y: cursorY,
          width: 32, // Default size overridden by animate
          height: 32,
          translateX: '-50%',
          translateY: '-50%',
          borderRadius: '50%',
          backgroundColor: isHovering ? 'rgba(var(--primary-rgb), 0.15)' : 'transparent',
          border: `1.5px solid ${isHovering ? 'var(--primary)' : 'var(--text-muted)'}`,
          pointerEvents: 'none',
          zIndex: 999998,
          opacity: isHovering ? 1 : 0.5,
        }}
        animate={{
          width: isHovering ? 56 : 32,
          height: isHovering ? 56 : 32,
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      />
    </>
  );
}
