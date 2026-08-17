import { useEffect, useRef, useCallback, useState } from 'react';

/* ─── Node data ─── */
const NODES = [
  { id: 0, x: 12, y: 15, label: 'SYNC', size: 52 },
  { id: 1, x: 32, y: 8, label: 'WIFI', size: 44 },
  { id: 2, x: 58, y: 12, label: 'DATA', size: 48 },
  { id: 3, x: 80, y: 18, label: 'CLOUD', size: 56 },
  { id: 4, x: 8, y: 38, label: 'DNS', size: 40 },
  { id: 5, x: 28, y: 32, label: 'HTTP', size: 44 },
  { id: 6, x: 48, y: 28, label: 'API', size: 52 },
  { id: 7, x: 70, y: 35, label: 'CDN', size: 42 },
  { id: 8, x: 88, y: 42, label: 'PROXY', size: 38 },
  { id: 9, x: 18, y: 55, label: 'TCP', size: 46 },
  { id: 10, x: 42, y: 50, label: 'SSL', size: 50 },
  { id: 11, x: 65, y: 55, label: 'VPN', size: 44 },
  { id: 12, x: 85, y: 62, label: 'NAT', size: 38 },
  { id: 13, x: 10, y: 70, label: 'ROUTER', size: 54 },
  { id: 14, x: 35, y: 68, label: 'PING', size: 42 },
  { id: 15, x: 58, y: 72, label: 'SIGNAL', size: 48 },
  { id: 16, x: 78, y: 78, label: 'LINK', size: 40 },
  { id: 17, x: 22, y: 84, label: 'HOST', size: 46 },
  { id: 18, x: 50, y: 88, label: 'NO CONNECTION', size: 72, isFinal: true },
  { id: 19, x: 75, y: 90, label: 'RETRY', size: 44 },
  { id: 20, x: 92, y: 25, label: 'SOCKET', size: 36 },
  { id: 21, x: 5, y: 22, label: 'IP', size: 34 },
];

/* ─── Spotlight path keyframes (% of screen) ─── */
const PATH = [
  { x: 10, y: 10 },
  { x: 30, y: 8 },
  { x: 58, y: 12 },
  { x: 80, y: 20 },
  { x: 88, y: 42 },
  { x: 65, y: 55 },
  { x: 42, y: 50 },
  { x: 18, y: 55 },
  { x: 10, y: 70 },
  { x: 35, y: 68 },
  { x: 58, y: 72 },
  { x: 50, y: 88 },
];

function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

export default function OfflinePage({ onRetry }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [isChecking, setIsChecking] = useState(false);
  const stateRef = useRef({
    lensX: 10, lensY: 10,
    pathIndex: 0,
    segT: 0,
    phase: 'travel',
    bounceScale: 1,
    bounceDir: 1,
    finalGlow: 0,
    finalGlowDir: 1,
  });

  const handleRetry = async () => {
    if (isChecking) return;
    setIsChecking(true);
    if (onRetry) {
      await onRetry();
    } else {
      window.location.reload();
    }
    setTimeout(() => {
      setIsChecking(false);
    }, 1000);
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);

    const S = stateRef.current;
    const lx = (S.lensX / 100) * W;
    const ly = (S.lensY / 100) * H;
    const lensR = Math.min(W, H) * 0.16;
    const isFinalPhase = S.phase === 'bounce';

    NODES.forEach(node => {
      const nx = (node.x / 100) * W;
      const ny = (node.y / 100) * H;
      const dist = Math.hypot(nx - lx, ny - ly);
      const inside = dist < lensR + node.size * 0.5;
      const isFinalNode = node.isFinal;

      let alpha = 0.12;
      let textAlpha = 0.08;
      let isNeonGreen = false;

      if (inside) {
        if (isFinalNode && isFinalPhase) {
          isNeonGreen = true;
          alpha = 1;
          textAlpha = 1;
        } else {
          const fade = Math.max(0, 1 - dist / (lensR + node.size * 0.5));
          alpha = 0.12 + fade * 0.88;
          textAlpha = 0.08 + fade * 0.92;
        }
      }

      const nodeScale = isFinalNode && isFinalPhase ? S.bounceScale : 1;
      const r = (node.size / 2) * nodeScale;

      ctx.save();
      ctx.translate(nx, ny);

      if (isNeonGreen) {
        ctx.shadowColor = '#00FF87';
        ctx.shadowBlur = 8 + S.finalGlow * 20;

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,40,20,${alpha})`;
        ctx.fill();
        ctx.strokeStyle = '#00FF87';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        const fs = Math.max(7, r * 0.28);
        ctx.font = `700 ${fs}px Inter,sans-serif`;
        ctx.fillStyle = `rgba(0,255,135,${textAlpha})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const words = node.label.split(' ');
        if (words.length > 1) {
          ctx.fillText(words[0], 0, -fs * 0.6);
          ctx.fillText(words[1], 0, fs * 0.6);
        } else {
          ctx.fillText(node.label, 0, 0);
        }
      } else {
        if (inside) { ctx.shadowColor = 'rgba(255,255,255,0.4)'; ctx.shadowBlur = 10; }
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(21,21,21,${alpha})`;
        ctx.fill();
        ctx.strokeStyle = inside
          ? `rgba(255,255,255,${alpha * 0.8})`
          : `rgba(60,60,60,${alpha})`;
        ctx.lineWidth = inside ? 1.5 : 1;
        ctx.stroke();

        const fs = Math.max(6, r * 0.3);
        ctx.font = `600 ${fs}px Inter,sans-serif`;
        ctx.fillStyle = `rgba(255,255,255,${textAlpha})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, 0, 0);
      }
      ctx.restore();
    });

    // Magnifying glass
    ctx.save();
    ctx.translate(lx, ly);

    ctx.beginPath();
    ctx.arc(0, 0, lensR, 0, Math.PI * 2);
    ctx.strokeStyle = isFinalPhase ? 'rgba(0,255,135,0.45)' : 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = isFinalPhase ? '#00FF87' : 'rgba(255,255,255,0.3)';
    ctx.shadowBlur = isFinalPhase ? 18 : 8;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(-lensR * 0.25, -lensR * 0.3, lensR * 0.35, Math.PI * 1.1, Math.PI * 1.7);
    ctx.strokeStyle = isFinalPhase ? 'rgba(0,255,135,0.25)' : 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1.2;
    ctx.shadowBlur = 0;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(lensR * 0.7, lensR * 0.7);
    ctx.lineTo(lensR * 1.32, lensR * 1.32);
    ctx.strokeStyle = isFinalPhase ? 'rgba(0,255,135,0.6)' : 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.shadowColor = isFinalPhase ? '#00FF87' : 'rgba(255,255,255,0.3)';
    ctx.shadowBlur = isFinalPhase ? 12 : 6;
    ctx.stroke();

    ctx.restore();
  }, []);

  const tick = useCallback(() => {
    const S = stateRef.current;
    const SPEED = 0.006;

    if (S.phase === 'travel') {
      S.segT += SPEED;
      if (S.segT >= 1) {
        S.segT = 0;
        S.pathIndex++;
        if (S.pathIndex >= PATH.length - 1) {
          S.lensX = PATH[PATH.length - 1].x;
          S.lensY = PATH[PATH.length - 1].y;
          S.phase = 'bounce';
          S.bounceTimer = 0;
        }
      } else {
        const a = PATH[S.pathIndex];
        const b = PATH[S.pathIndex + 1];
        const t = easeInOut(S.segT);
        S.lensX = lerp(a.x, b.x, t);
        S.lensY = lerp(a.y, b.y, t);
      }
    }

    if (S.phase === 'bounce') {
      S.bounceScale += S.bounceDir * 0.012;
      if (S.bounceScale > 1.18) S.bounceDir = -1;
      if (S.bounceScale < 0.92) S.bounceDir = 1;
      S.finalGlow += S.finalGlowDir * 0.03;
      if (S.finalGlow > 1) S.finalGlowDir = -1;
      if (S.finalGlow < 0) S.finalGlowDir = 1;

      // After ~3 seconds (≈180 frames @60fps), auto-replay
      S.bounceTimer = (S.bounceTimer || 0) + 1;
      if (S.bounceTimer > 180) {
        Object.assign(S, {
          lensX: 10, lensY: 10,
          pathIndex: 0,
          segT: 0,
          phase: 'travel',
          bounceScale: 1,
          bounceDir: 1,
          finalGlow: 0,
          finalGlowDir: 1,
          bounceTimer: 0,
        });
      }
    }

    draw();
    animRef.current = requestAnimationFrame(tick);
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    };

    resize();
    window.addEventListener('resize', resize);
    animRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [tick]);



  return (
    <div style={styles.wrapper}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes offlineFadeIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes badgePulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes retryGlow { 0%,100%{box-shadow:0 0 18px rgba(0,255,135,.30)} 50%{box-shadow:0 0 32px rgba(0,255,135,.55)} }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        #offline-retry-btn:active {
          transform: translateY(1px) scale(0.96) !important;
          box-shadow: 0 0 10px rgba(0,255,135,.20) !important;
          opacity: 0.8;
        }
      `}</style>

      <canvas ref={canvasRef} aria-hidden="true" style={styles.canvas} />

      <div style={styles.overlay}>
        {/* OFFLINE badge */}
        <div style={styles.badge}>
          <span style={styles.badgeDot} />
          <span style={styles.badgeText}>OFFLINE</span>
        </div>

        {/* Bottom card */}
        <div style={styles.card}>
          <div style={styles.iconWrap}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,0.75)" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
              <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
          </div>

          <h1 style={styles.title}>No Internet Connection</h1>
          <p style={styles.subtitle}>
            We can&apos;t reach the network. Check your Wi‑Fi or mobile data and try again.
          </p>

          <div style={styles.actions}>
            <button
              id="offline-retry-btn"
              style={styles.retryBtn}
              onClick={handleRetry}
              onMouseEnter={e => Object.assign(e.currentTarget.style, {
                background: 'linear-gradient(135deg,#00e87a,#00c060)',
                transform: 'translateY(-2px) scale(1.03)',
                boxShadow: '0 0 32px rgba(0,255,135,.55)',
              })}
              onMouseLeave={e => Object.assign(e.currentTarget.style, {
                background: 'linear-gradient(135deg,#00FF87,#00cc6a)',
                transform: 'none',
                boxShadow: '0 0 18px rgba(0,255,135,.30)',
                animation: 'retryGlow 2s ease-in-out infinite',
              })}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
                style={{
                  marginRight: 8,
                  animation: isChecking ? 'spin 1s linear infinite' : 'none'
                }}>
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    position: 'fixed', inset: 0,
    background: '#000',
    fontFamily: '"Inter","Segoe UI",sans-serif',
    overflow: 'hidden',
    zIndex: 9999,
  },
  canvas: {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    display: 'block',
  },
  overlay: {
    position: 'relative', zIndex: 2,
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'space-between',
    padding: '32px 20px',
    pointerEvents: 'none',
    animation: 'offlineFadeIn 0.9s ease both',
  },
  badge: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(0,0,0,0.65)',
    border: '1px solid rgba(255,50,50,0.3)',
    borderRadius: 100,
    padding: '6px 14px',
    backdropFilter: 'blur(10px)',
    pointerEvents: 'auto',
  },
  badgeDot: {
    width: 7, height: 7, borderRadius: '50%',
    background: '#ff4444',
    display: 'inline-block',
    animation: 'badgePulse 1.4s ease-in-out infinite',
    boxShadow: '0 0 7px rgba(255,68,68,.75)',
  },
  badgeText: {
    fontSize: 10, fontWeight: 700,
    letterSpacing: '0.13em',
    color: 'rgba(255,100,100,0.9)',
  },
  card: {
    width: '100%', maxWidth: 400,
    background: 'rgba(8,8,8,0.88)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 24,
    padding: '28px 24px 24px',
    backdropFilter: 'blur(22px)',
    boxShadow: '0 28px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.03)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 10,
    pointerEvents: 'auto',
  },
  iconWrap: {
    width: 56, height: 56, borderRadius: 14,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 21, fontWeight: 800,
    color: '#fff', margin: 0,
    textAlign: 'center', letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: 13, color: 'rgba(255,255,255,0.42)',
    margin: '2px 0 10px',
    textAlign: 'center', lineHeight: 1.65,
  },
  actions: {
    display: 'flex', flexDirection: 'column', gap: 9, width: '100%',
  },
  retryBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '100%', padding: '14px 20px',
    borderRadius: 13, border: 'none',
    background: 'linear-gradient(135deg,#00FF87,#00cc6a)',
    color: '#000', fontSize: 15, fontWeight: 700,
    fontFamily: 'inherit', cursor: 'pointer',
    boxShadow: '0 0 18px rgba(0,255,135,.30)',
    transition: 'all 0.2s ease',
    animation: 'retryGlow 2s ease-in-out infinite',
  },
};
