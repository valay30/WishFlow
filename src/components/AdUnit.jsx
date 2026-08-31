import { useEffect, useRef } from 'react';

/**
 * AdUnit — Manual AdSense ad placement component.
 *
 * Usage:
 *   <AdUnit slot="1234567890" />
 *   <AdUnit slot="1234567890" format="rectangle" style={{ minHeight: 250 }} />
 *
 * Props:
 *   slot               — Your AdSense ad unit slot ID (from AdSense dashboard)
 *   format             — 'auto' (default) | 'rectangle' | 'vertical' | 'horizontal'
 *   fullWidthResponsive — true (default) | false
 *   style              — Extra inline styles for the container wrapper
 */

const ADSENSE_CLIENT = 'ca-pub-2581694669556317';
const IS_DEV = import.meta.env.DEV;

export default function AdUnit({
  slot,
  format = 'auto',
  fullWidthResponsive = true,
  style = {},
}) {
  const insRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    // Never run in dev — show placeholder instead
    if (IS_DEV) return;
    // Prevent double-push (StrictMode / re-renders)
    if (pushed.current) return;
    pushed.current = true;

    // Inject the AdSense script once into <head> if not already there
    const SCRIPT_ID = 'adsense-script';
    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    // Push the ad slot
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.warn('[AdUnit] adsbygoogle push failed:', err);
    }
  }, []);

  // ── Development placeholder ──────────────────────────────────────────────────
  if (IS_DEV) {
    return (
      <div
        aria-hidden="true"
        style={{
          background: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 10px, transparent 10px, transparent 20px)',
          border: '1.5px dashed rgba(0,0,0,0.18)',
          borderRadius: '10px',
          minHeight: '90px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: 'rgba(0,0,0,0.35)',
          fontSize: '0.72rem',
          fontFamily: 'monospace',
          fontWeight: 600,
          letterSpacing: '0.04em',
          userSelect: 'none',
          ...style,
        }}
      >
        <span style={{ fontSize: '1rem' }}>📢</span>
        AD UNIT &nbsp;·&nbsp; slot: {slot || '?'} &nbsp;·&nbsp; format: {format}
      </div>
    );
  }

  // ── Production ad slot ───────────────────────────────────────────────────────
  return (
    <ins
      ref={insRef}
      className="adsbygoogle"
      style={{ display: 'block', ...style }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
    />
  );
}
