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
    <>
      <style>{`
        .cookie-banner {
          position: fixed;
          bottom: 1.25rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(17, 17, 17, 0.92);
          backdrop-filter: blur(12px);
          color: #fff;
          padding: 0.75rem 1rem;
          border-radius: 999px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
          font-size: 0.85rem;
          font-family: "Outfit", sans-serif;
          white-space: nowrap;
          max-width: calc(100vw - 2rem);
          animation: cookie-slide-up 0.4s cubic-bezier(0.2, 1, 0.2, 1);
        }

        .cookie-banner-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .cookie-btn-decline, .cookie-btn-accept {
          border-radius: 999px;
          padding: 0.4rem 1rem;
          font-size: 0.8rem;
          font-family: "Outfit", sans-serif;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .cookie-btn-decline {
          background: rgba(255,255,255,0.1);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.15);
        }
        .cookie-btn-decline:hover {
          background: rgba(255,255,255,0.18);
        }

        .cookie-btn-accept {
          background: #E97451;
          color: #fff;
          border: none;
          font-weight: 700;
        }
        .cookie-btn-accept:hover {
          background: #d4623e;
        }

        @keyframes cookie-slide-up {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        /* Mobile specific styles */
        @media (max-width: 600px) {
          .cookie-banner {
            flex-direction: column;
            border-radius: 20px;
            white-space: normal;
            text-align: center;
            padding: 1.25rem;
            width: calc(100vw - 2rem);
            gap: 1.25rem;
          }
          .cookie-banner-buttons {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
          }
          .cookie-btn-decline, .cookie-btn-accept {
            padding: 0.75rem;
            font-size: 0.9rem;
          }
        }
      `}</style>

      <div className="cookie-banner">
        <span style={{ opacity: 0.9, lineHeight: 1.5 }}>
          🍪 We use cookies to improve your experience.{' '}
          <a
            href="/privacy"
            style={{ color: '#E97451', textDecoration: 'none', fontWeight: 600 }}
          >
            Learn more
          </a>
        </span>

        <div className="cookie-banner-buttons">
          <button className="cookie-btn-decline" onClick={decline}>
            Decline
          </button>
          <button className="cookie-btn-accept" onClick={accept}>
            Accept
          </button>
        </div>
      </div>
    </>
  );
}
