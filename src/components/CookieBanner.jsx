import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // Small delay so it doesn't flash on load
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      background: 'rgba(17,17,17,0.92)',
      backdropFilter: 'blur(12px)',
      color: '#fff',
      padding: '0.65rem 0.9rem',
      borderRadius: '999px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
      fontSize: '0.82rem',
      fontFamily: '"Outfit", sans-serif',
      whiteSpace: 'nowrap',
      flexWrap: 'wrap',
      justifyContent: 'center',
      maxWidth: 'calc(100vw - 2rem)',
      animation: 'cookie-slide-up 0.35s ease',
    }}>
      <style>{`
        @keyframes cookie-slide-up {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <span style={{ opacity: 0.85 }}>
        🍪 We use cookies to improve your experience.{' '}
        <a
          href="/privacy"
          style={{ color: '#E97451', textDecoration: 'none', fontWeight: 600 }}
        >
          Learn more
        </a>
      </span>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={decline}
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '999px',
            padding: '0.35rem 0.85rem',
            fontSize: '0.78rem',
            fontFamily: '"Outfit", sans-serif',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          Decline
        </button>
        <button
          onClick={accept}
          style={{
            background: '#E97451',
            color: '#fff',
            border: 'none',
            borderRadius: '999px',
            padding: '0.35rem 0.85rem',
            fontSize: '0.78rem',
            fontFamily: '"Outfit", sans-serif',
            cursor: 'pointer',
            fontWeight: 700,
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#d4623e'}
          onMouseLeave={e => e.currentTarget.style.background = '#E97451'}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
