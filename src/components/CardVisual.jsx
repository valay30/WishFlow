import React from 'react';
import { ArrowDown, Loader2, ShoppingCart } from 'lucide-react';

const GRAIN_URL = "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")";
const FOIL_BG = "linear-gradient(115deg, #bfbfbf 0%, #ffffff 15%, #999999 30%, #595959 45%, #ffffff 60%, #999999 75%, #ffffff 90%, #bfbfbf 100%)";

export const ROAST_THEMES = [
  {
    id: 'classic',
    layout: 'ticket'
  },
  {
    id: 'purple',
    bg: '#0c41a7',
    circle1: '#F33D84',
    circle2: '#FFCE20',
    textColor: '#ffffff'
  },
  {
    id: 'midnight',
    layout: 'split',
    headerBg: '#392176',
    headerTextColor: '#ffffff',
    bg: '#DFD5F8',
    circle1: '#FCD267',
    circle2: '#F4874E',
    textColor: '#231647'
  },
  {
    id: 'sunset',
    bg: 'linear-gradient(135deg, #f05232 0%, #d63d20 100%)',
    circle1: '#f4815a',
    circle2: '#fbe08f',
    textColor: '#ffffff'
  },
  {
    id: 'emerald',
    layout: 'memphis',
    bg: '#F5F3ED',
    textColor: '#151E3A',
    blobPink: '#F15B8C',
    blobYellow: '#FBB91B',
    blobBlue: '#3CA0E7',
    blobOrange: '#F47625',
    circleBehindCart: '#F8AFC9',
    cartShadow: '#D0DBF8'
  }
];

export default function CardVisual({ phase, roastText, dateStr, showButton, onDownload, downloading, isCapture, tearing, theme = ROAST_THEMES[0] }) {

  // --- CLASSIC TICKET LAYOUT (Original Production Design) ---
  if (theme.layout === 'ticket') {
    const innerBoxShadow = isCapture ? "none" : "inset 0 2px 10px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(0,0,0,0.05)";

    const topMask = isCapture ? {} : {
      WebkitMaskImage: "radial-gradient(circle 11.5px at 0 100%, transparent 99%, #000 100%), radial-gradient(circle 11.5px at 100% 100%, transparent 99%, #000 100%)",
      WebkitMaskComposite: "source-in",
      maskComposite: "intersect"
    };

    const bottomMask = isCapture ? {} : {
      WebkitMaskImage: "radial-gradient(circle 11.5px at 0 0, transparent 99%, #000 100%), radial-gradient(circle 11.5px at 100% 0, transparent 99%, #000 100%)",
      WebkitMaskComposite: "source-in",
      maskComposite: "intersect"
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div style={{ position: "relative", width: "100%", borderTopLeftRadius: "30px", borderTopRightRadius: "30px", padding: "5px 5px 0 5px", background: FOIL_BG, backgroundSize: "300% 100%", animation: showButton ? "holoGlow 4s linear infinite" : undefined, overflow: "hidden", zIndex: 1, ...topMask }}>
          <div style={{ position: "relative", borderTopLeftRadius: "25px", borderTopRightRadius: "25px", fontFamily: "'Inter','Helvetica Neue',sans-serif", backgroundColor: "#ffffff", boxShadow: innerBoxShadow }}>
            {!isCapture && <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none", opacity: 0.05, backgroundImage: GRAIN_URL, borderTopLeftRadius: "25px", borderTopRightRadius: "25px" }} />}
            <div style={{ background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", padding: "2rem 1.75rem 1.5rem", position: "relative", overflow: "hidden", borderTopLeftRadius: "25px", borderTopRightRadius: "25px" }}>
              <div style={{ position: "absolute", width: 180, height: 180, borderRadius: "50%", background: "rgba(56, 189, 248, 0.1)", top: -60, right: -40 }} />
              <div style={{ position: "absolute", width: 100, height: 100, borderRadius: "50%", background: "rgba(56, 189, 248, 0.08)", bottom: -30, left: -20 }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                  <span style={{ fontSize: "1.4rem" }}>🔥</span>
                  <span style={{ color: "#0c4a6e", fontWeight: 900, fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>WishFlow Roast Card</span>
                </div>
                <div style={{ color: "#0369a1", fontSize: "0.78rem", fontWeight: 600 }}>{dateStr}</div>
              </div>
            </div>
            <div style={{ position: "relative", height: "1px", margin: 0, zIndex: 2 }}>
              <div style={{ position: "absolute", left: 16, right: 16, top: 0, borderTop: "2px dashed #e2e8f0", zIndex: 1 }} />
            </div>
            <div style={{ padding: "2rem 1.75rem", position: "relative", minHeight: "180px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <img src={`${window.location.origin}/192x192.png`} crossOrigin="anonymous" alt="" style={{ position: "absolute", width: "200px", height: "200px", opacity: 0.2, pointerEvents: "none", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 0 }} />
              <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
                {phase === "loading" ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", color: "#94a3b8" }}>
                    <Loader2 size={32} style={{ animation: "roastSpin 1s linear infinite" }} />
                    <p style={{ fontSize: "0.95rem", fontWeight: 500 }}>Analyzing your taste...</p>
                  </div>
                ) : (
                  <p style={{ fontSize: "1.05rem", lineHeight: 1.6, color: phase === "error" ? "#ef4444" : "#334155", textAlign: "center", fontWeight: 500, margin: 0 }}>
                    &ldquo;{roastText}&rdquo;
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ position: "relative", width: "100%", borderBottomLeftRadius: "30px", borderBottomRightRadius: "30px", padding: "0 5px 5px 5px", background: FOIL_BG, backgroundSize: "300% 100%", animation: showButton ? "holoGlow 4s linear infinite" : undefined, zIndex: 2, clipPath: tearing ? "inset(0 0 0 0 round 0 0 30px 30px)" : "none", transformOrigin: "top left", transition: tearing ? "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s ease-in-out, clip-path 0.8s" : "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease-in, clip-path 0.6s", transform: tearing ? "rotate(-12deg) translateY(150px)" : "none", opacity: tearing ? 0 : 1, ...bottomMask }}>
          <div style={{ position: "relative", borderBottomLeftRadius: "25px", borderBottomRightRadius: "25px", fontFamily: "'Inter','Helvetica Neue',sans-serif", backgroundColor: "#ffffff", boxShadow: innerBoxShadow }}>
            {!isCapture && <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none", opacity: 0.05, backgroundImage: GRAIN_URL, borderBottomLeftRadius: "25px", borderBottomRightRadius: "25px" }} />}
            <div style={{ position: "relative", height: "1px", margin: 0, zIndex: 2 }}>
              <div style={{ position: "absolute", left: 16, right: 16, top: 0, borderTop: "2px dashed #e2e8f0", zIndex: 1 }} />
            </div>
            <div style={{ position: "relative", padding: "1.25rem 1.75rem", background: "#ffffff", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", borderBottomLeftRadius: "25px", borderBottomRightRadius: "25px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <img src={`${window.location.origin}/192x192.png`} crossOrigin="anonymous" alt="WishFlow Logo" style={{ width: "1.8rem", height: "1.8rem", borderRadius: "8px", objectFit: "cover", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                <div style={{ fontSize: "0.95rem", color: "#0f172a", fontWeight: 800, letterSpacing: "-0.01em" }}>wishflow.shop</div>
              </div>
              {showButton && (
                <button onClick={onDownload} disabled={phase === "loading" || downloading || tearing} title="Download Card"
                  style={{ position: "absolute", right: "1.75rem", width: "2.6rem", height: "2.6rem", borderRadius: "50%", background: phase === "loading" ? "#9ca3af" : "radial-gradient(circle at 35% 35%, #e1f5fe 0%, #64b5f6 60%, #2196f3 100%)", color: "#ffffff", border: phase === "loading" ? "none" : "2px solid #ffffff", display: "flex", alignItems: "center", justifyContent: "center", cursor: phase === "loading" ? "not-allowed" : "pointer", boxShadow: phase !== "loading" ? "0 6px 14px rgba(33,150,243,0.3), inset 0 4px 10px rgba(255,255,255,0.8), inset 0 -4px 6px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s", padding: 0 }}>
                  {downloading ? <Loader2 size={18} style={{ animation: "roastSpin 1s linear infinite" }} /> : <ArrowDown size={20} strokeWidth={3} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- COMMON CARD CONTAINER STYLES ---
  const cardStyle = {
    position: 'relative',
    width: '100%',
    borderRadius: '24px',
    overflow: 'hidden',
    fontFamily: "'Inter','Helvetica Neue',sans-serif",
    boxShadow: isCapture ? 'none' : '0 20px 40px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '480px'
  };

  // --- MEMPHIS LAYOUT (Emerald Theme) ---
  if (theme.layout === 'memphis') {
    const dateParts = dateStr.split(" ");
    const dayMonth = dateParts.length >= 2 ? `${dateParts[0]} ${(dateParts[1] || '').toUpperCase()}` : dateStr;
    const year = dateParts.length >= 3 ? dateParts[2] : new Date().getFullYear().toString();

    return (
      <div style={{ ...cardStyle, borderRadius: '32px', background: theme.bg, color: theme.textColor, zIndex: 1, minHeight: '610px', display: 'flex', flexDirection: 'column', boxShadow: isCapture ? 'none' : '0 24px 60px -12px rgba(20, 28, 58, 0.18), 0 10px 24px -8px rgba(20, 28, 58, 0.12)' }}>
        {!isCapture && (
          <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none", opacity: 0.04, backgroundImage: GRAIN_URL, mixBlendMode: 'overlay', borderRadius: '32px' }} />
        )}

        {/* Vector Background Blobs and Radiating Dashes */}
        <svg
          viewBox="0 0 380 610"
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
        >
          {/* Top-Left Pink Blob: Organic wavy contour scooping gracefully around the circle badge matching Image 2 */}
          <path
            d="M 0,0 L 94,0 C 94,8 89,17 78,22 C 62,28 42,34 32,50 C 25,62 26,76 28,88 C 30,98 37,105 36,116 C 35,128 24,142 0,154 Z"
            fill={theme.blobPink}
          />

          {/* Top-Right Yellow Blob: Organic wavy contour scooping across and down matching Image 2 */}
          <path
            d="M 278,0 C 279,8 281,14 286,19 C 291,24 306,28 332,34 C 350,38 358,48 361,65 C 364,82 364,104 374,124 C 378,132 380,138 380,140 L 380,0 Z"
            fill={theme.blobYellow}
          />

          {/* Bottom-Left Blue Blob: Hugs left perimeter and fills bottom-left corner completely */}
          <path
            d="M 0,310 C 14,325 15,350 12,380 C 10,410 7,440 9,470 C 12,500 20,530 28,555 C 38,580 58,595 82,610 L 0,610 Z"
            fill={theme.blobBlue}
          />

          {/* Bottom-Right Orange Blob: Hugs right perimeter and fills bottom-right corner completely */}
          <path
            d="M 380,440 C 356,462 344,490 338,518 C 332,546 322,576 285,610 L 380,610 Z"
            fill={theme.blobOrange}
          />

          {/* Radiating Dashes Group */}
          <g>
            {/* Top 4 dashes fanning out across the top cream margin as in Image 2 */}
            <g transform="translate(120, 26) rotate(-14)"><rect x="-2.75" y="-8.5" width="5.5" height="17" rx="2.75" fill={theme.blobYellow} /></g>
            <g transform="translate(156, 26) rotate(-5)"><rect x="-2.75" y="-8.5" width="5.5" height="17" rx="2.75" fill={theme.blobYellow} /></g>
            <g transform="translate(192, 26) rotate(7)"><rect x="-2.75" y="-8.5" width="5.5" height="17" rx="2.75" fill={theme.blobYellow} /></g>
            <g transform="translate(228, 26) rotate(20)"><rect x="-2.75" y="-8.5" width="5.5" height="17" rx="2.75" fill={theme.blobYellow} /></g>

            {/* Right side 7 dashes along right border */}
            <g transform="translate(346, 148) rotate(-42)"><rect x="-2.5" y="-8" width="5" height="16" rx="2.5" fill={theme.blobYellow} /></g>
            <g transform="translate(350, 188) rotate(-28)"><rect x="-2.5" y="-8" width="5" height="16" rx="2.5" fill={theme.blobYellow} /></g>
            <g transform="translate(352, 228) rotate(-14)"><rect x="-2.5" y="-8" width="5" height="16" rx="2.5" fill={theme.blobYellow} /></g>
            <g transform="translate(353, 268) rotate(0)"><rect x="-2.5" y="-8" width="5" height="16" rx="2.5" fill={theme.blobYellow} /></g>
            <g transform="translate(352, 308) rotate(14)"><rect x="-2.5" y="-8" width="5" height="16" rx="2.5" fill={theme.blobYellow} /></g>
            <g transform="translate(350, 348) rotate(28)"><rect x="-2.5" y="-8" width="5" height="16" rx="2.5" fill={theme.blobYellow} /></g>
            <g transform="translate(346, 388) rotate(42)"><rect x="-2.5" y="-8" width="5" height="16" rx="2.5" fill={theme.blobYellow} /></g>

            {/* Bottom-Right accent dash above orange blob matching Image 2 */}
            <g transform="translate(317, 553) rotate(-45)"><rect x="-3" y="-10.5" width="6" height="21" rx="3" fill={theme.blobYellow} /></g>

            {/* Bottom 5 dashes distributed across bottom margin matching Image 2 */}
            <g transform="translate(98, 588) rotate(18)"><rect x="-3" y="-10.5" width="6" height="21" rx="3" fill={theme.blobYellow} /></g>
            <g transform="translate(142, 586) rotate(7)"><rect x="-3" y="-10.5" width="6" height="21" rx="3" fill={theme.blobYellow} /></g>
            <g transform="translate(185, 582) rotate(0)"><rect x="-3" y="-10.5" width="6" height="21" rx="3" fill={theme.blobYellow} /></g>
            <g transform="translate(231, 584) rotate(-16)"><rect x="-3" y="-10.5" width="6" height="21" rx="3" fill={theme.blobYellow} /></g>
            <g transform="translate(275, 578) rotate(-27)"><rect x="-3" y="-10.5" width="6" height="21" rx="3" fill={theme.blobYellow} /></g>

            {/* Left side dashes along left border */}
            <g transform="translate(34, 175) rotate(38)"><rect x="-2.5" y="-8" width="5" height="16" rx="2.5" fill={theme.blobYellow} /></g>
            <g transform="translate(30, 212) rotate(20)"><rect x="-2.5" y="-8" width="5" height="16" rx="2.5" fill={theme.blobYellow} /></g>
            <g transform="translate(28, 248) rotate(0)"><rect x="-2.5" y="-8" width="5" height="16" rx="2.5" fill={theme.blobYellow} /></g>
            <g transform="translate(30, 284) rotate(-18)"><rect x="-2.5" y="-8" width="5" height="16" rx="2.5" fill={theme.blobYellow} /></g>
            <g transform="translate(36, 435) rotate(-45)"><rect x="-2.5" y="-8" width="5" height="16" rx="2.5" fill={theme.blobYellow} /></g>
          </g>
        </svg>

        {/* Header Block */}
        <div style={{ padding: '2.5rem 2.2rem 0.5rem 2.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '46px', height: '46px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
              🔥
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.12rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.02em', lineHeight: 1.1, color: theme.textColor }}>WISHFLOW</h2>
              <h2 style={{ margin: 0, fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.08em', opacity: 0.75, color: theme.textColor }}>ROAST CARD</h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '1.5px', height: '28px', background: theme.textColor, opacity: 0.35 }} />
            <div style={{ textAlign: 'left', fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.25, color: theme.textColor }}>
              <div>{dayMonth}</div>
              <div>{year}</div>
            </div>
          </div>
        </div>

        {/* Stylized Shopping Cart Illustration Area */}
        <div style={{ position: 'relative', width: '100%', height: '175px', margin: '0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
          <svg width="220" height="175" viewBox="0 0 220 175" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
            {/* Pink Circle Behind Basket */}
            <circle cx="138" cy="70" r="50" fill={theme.circleBehindCart} />

            {/* Soft Lavender Shadow Under Wheels */}
            <rect x="68" y="152" width="118" height="13" rx="6.5" fill={theme.cartShadow} />

            {/* Speed Lines on Left with exact spacing */}
            <path d="M 50,66 L 66,73" stroke={theme.textColor} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 44,89 L 66,89" stroke={theme.textColor} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 50,112 L 66,105" stroke={theme.textColor} strokeWidth="3.5" strokeLinecap="round" />

            {/* Cart Handle: Yellow Filled Pill with Navy Outline */}
            <g transform="translate(85, 44) rotate(16)">
              <rect x="-13" y="-5.5" width="26" height="11" rx="5.5" fill={theme.blobYellow} stroke={theme.textColor} strokeWidth="3.5" />
            </g>

            {/* Main Strut Connecting Handle to Chassis */}
            <path d="M 93,48 L 109,122" stroke={theme.textColor} strokeWidth="3.5" strokeLinecap="round" />

            {/* Wedge-Shaped Cart Basket seamlessly meeting the strut */}
            <path
              d="M 98,62 L 174,62 C 177,62 179,64 178.5,67 L 171,90 C 170.5,92.5 168.5,94 166,94.5 L 108,112 Z"
              stroke={theme.textColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Lower Chassis: Horizontal Racetrack Loop */}
            <path
              d="M 109,122 L 159,122 C 163,122 166,124.5 166,128 C 166,131.5 163,134 159,134 L 109,134 C 105,134 102,131.5 102,128 C 102,124.5 105,122 109,122 Z"
              stroke={theme.textColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Wheel Legs */}
            <path d="M 110,134 L 110,139" stroke={theme.textColor} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 158,134 L 158,139" stroke={theme.textColor} strokeWidth="3.5" strokeLinecap="round" />

            {/* Wheels (Navy Rings with Hollow Cream Centers) */}
            <circle cx="110" cy="147" r="9" stroke={theme.textColor} strokeWidth="3.5" fill={theme.bg} />
            <circle cx="158" cy="147" r="9" stroke={theme.textColor} strokeWidth="3.5" fill={theme.bg} />
          </svg>
        </div>

        {/* Roast Text Area: max-width constraint ensures exact 6-line word-for-word wrap matching reference image */}
        <div style={{ padding: '0 3.1rem 3.4rem 3.1rem', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2 }}>
          {phase === "loading" ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", color: theme.textColor, padding: "2rem 0" }}>
              <Loader2 size={24} style={{ animation: "roastSpin 1s linear infinite", opacity: 0.85 }} />
              <p style={{ fontSize: "1.05rem", fontWeight: 600, margin: 0, color: theme.textColor, opacity: 0.9 }}>Analyzing your taste...</p>
            </div>
          ) : (
            <p style={{ margin: 0, maxWidth: '275px', fontSize: '1.01rem', lineHeight: 1.56, fontWeight: 500, color: phase === 'error' ? '#dc2626' : theme.textColor, textAlign: 'left', position: 'relative', zIndex: 2 }}>
              {roastText}
            </p>
          )}

          {/* Footer: Positioned comfortably ABOVE the bottom margin dashes */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '2.5rem', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(0,0,0,0.06)' }}>
                <img src={`${window.location.origin}/192x192.png`} crossOrigin="anonymous" alt="WishFlow Logo" style={{ width: "24px", height: "24px", objectFit: "contain" }} />
              </div>
              <div style={{ width: '1.5px', height: '22px', background: theme.textColor, opacity: 0.35, margin: '0 0.1rem' }} />
              <a href="https://wishflow.shop" target="_blank" rel="noreferrer" style={{ color: theme.textColor, textDecoration: 'none', fontWeight: 700, fontSize: '0.98rem' }}>wishflow.shop</a>
            </div>

            {showButton && (
              <button onClick={onDownload} disabled={phase === "loading" || downloading || tearing} title="Download Card"
                style={{ width: "2.6rem", height: "2.6rem", borderRadius: "50%", background: theme.blobOrange, color: '#ffffff', border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: phase === "loading" ? "not-allowed" : "pointer", boxShadow: "0 4px 14px rgba(244,118,37,0.3)", transition: "all 0.2s", padding: 0 }}>
                {downloading ? <Loader2 size={18} style={{ animation: "roastSpin 1s linear infinite" }} /> : <ArrowDown size={20} strokeWidth={3} />}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }


  // --- SPLIT LAYOUT (Midnight Theme) ---
  if (theme.layout === 'split') {
    const dateParts = dateStr.split(" ");
    const dayMonth = dateParts.length >= 3 ? `${dateParts[0]} ${dateParts[1].toUpperCase()}` : dateStr;
    const year = dateParts.length >= 3 ? dateParts[2] : "";

    return (
      <div style={{ ...cardStyle, background: theme.bg, color: theme.textColor }}>
        {!isCapture && (
          <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", opacity: 0.05, backgroundImage: GRAIN_URL, mixBlendMode: 'overlay' }} />
        )}

        {/* Header Block */}
        <div style={{ background: theme.headerBg, padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: theme.headerTextColor, zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
              🔥
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.02em', lineHeight: 1, color: theme.headerTextColor }}>WISHFLOW</h2>
              <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 300, letterSpacing: '0.02em', opacity: 0.8, color: theme.headerTextColor }}>ROAST CARD</h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.4)' }} />
            <div style={{ textAlign: 'left', fontSize: '0.85rem', opacity: 0.9, lineHeight: 1.4, fontWeight: 500 }}>
              <div>{dayMonth}</div>
              <div>{year}</div>
            </div>
          </div>
        </div>

        {/* Body Block */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', zIndex: 2 }}>

          {/* Illustration Area */}
          <div style={{ position: 'relative', height: '160px', width: '100%', marginBottom: '1rem' }}>
            {/* Yellow Circle behind cart */}
            <div style={{ position: 'absolute', top: '10px', right: '-5%', width: '50%', aspectRatio: '1/1', background: theme.circle1, borderRadius: '50%' }} />

            <div style={{ position: 'absolute', bottom: '26px', left: '130px', color: theme.textColor, zIndex: 2 }}>
              <ShoppingCart size={80} strokeWidth={1.5} />
            </div>

            {/* Connecting Lines */}
            <svg width="100%" height="160" viewBox="0 0 300 160" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, zIndex: 1 }}>
              <path d="M 0,126 L 135,126" fill="none" stroke={theme.textColor} strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 195,126 L 300,126" fill="none" stroke={theme.textColor} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Text Content */}
          <div style={{ padding: '0 2rem 2rem 2rem', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2 }}>
            {phase === "loading" ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", color: theme.textColor, padding: "2rem 0" }}>
                <Loader2 size={24} style={{ animation: "roastSpin 1s linear infinite", opacity: 0.85 }} />
                <p style={{ fontSize: "1.05rem", fontWeight: 600, margin: 0, color: theme.textColor, opacity: 0.9 }}>Analyzing your taste...</p>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '1.25rem', lineHeight: 1.5, fontWeight: 400, color: theme.textColor, letterSpacing: '0.01em', position: 'relative', zIndex: 2 }}>
                {roastText}
              </p>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '3rem', position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                  <img src={`${window.location.origin}/192x192.png`} crossOrigin="anonymous" alt="WishFlow Logo" style={{ width: "26px", height: "26px", objectFit: "contain" }} />
                </div>
                <div style={{ width: '2px', height: '24px', background: 'rgba(38, 28, 76, 0.3)', borderRadius: '2px' }} />
                <a href="https://wishflow.shop" target="_blank" rel="noreferrer" style={{ color: theme.textColor, textDecoration: 'none', fontWeight: 600, fontSize: '1.05rem', letterSpacing: '0.02em' }}>wishflow.shop</a>
              </div>

              {showButton && (
                <button onClick={onDownload} disabled={phase === "loading" || downloading || tearing} title="Download Card"
                  style={{ width: "2.8rem", height: "2.8rem", borderRadius: "50%", background: theme.textColor, color: theme.bg, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: phase === "loading" ? "not-allowed" : "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", transition: "all 0.2s", padding: 0 }}>
                  {downloading ? <Loader2 size={18} style={{ animation: "roastSpin 1s linear infinite" }} /> : <ArrowDown size={22} strokeWidth={3} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- DEFAULT LAYOUT (Purple, Sunset) ---
  return (
    <div style={{ ...cardStyle, background: theme.bg, color: theme.textColor }}>
      {!isCapture && (
        <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", opacity: 0.05, backgroundImage: GRAIN_URL, mixBlendMode: 'overlay' }} />
      )}

      {/* Decorative Circles */}
      <div style={{ position: 'absolute', top: '-7.5rem', right: '-25%', width: '65%', aspectRatio: '1/1', background: theme.circle1, borderRadius: '50%', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: '3rem', right: '-45%', width: '55%', aspectRatio: '1/1', background: theme.circle2, borderRadius: '50%', zIndex: 0 }} />

      {/* Content Container */}
      <div style={{ position: 'relative', zIndex: 2, padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>

        {/* Header */}
        <div>
          <div style={{ width: '52px', height: '52px', background: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', marginBottom: '1.25rem', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
            🔥
          </div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.2, letterSpacing: '0.02em', textTransform: 'uppercase', color: theme.textColor }}>
            WISHFLOW<br />ROAST CARD
          </h2>
          <p style={{ margin: '0.6rem 0 0', fontSize: '0.95rem', color: theme.textColor, opacity: 0.85, fontWeight: 400 }}>
            {dateStr}
          </p>
        </div>

        {/* Roast Text */}
        <div style={{ margin: '2.5rem 0 3.5rem 0', flex: 1, display: 'flex', alignItems: 'flex-start' }}>
          {phase === "loading" ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", color: theme.textColor, opacity: 0.9 }}>
              <Loader2 size={24} style={{ animation: "roastSpin 1s linear infinite" }} />
              <p style={{ fontSize: "1.1rem", fontWeight: 400, margin: 0, color: theme.textColor }}>Analyzing your taste...</p>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '1.25rem', lineHeight: 1.5, fontWeight: 400, color: phase === 'error' ? '#fca5a5' : theme.textColor, letterSpacing: '0.01em', opacity: 0.95 }}>
              &ldquo;{roastText}&rdquo;
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <img src={`${window.location.origin}/192x192.png`} crossOrigin="anonymous" alt="WishFlow Logo" style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ffffff', padding: '2px' }} />
            <div style={{ width: '2px', height: '24px', background: 'currentColor', opacity: 0.5, borderRadius: '2px' }} />
            <a href="https://wishflow.shop" target="_blank" rel="noreferrer" style={{ color: theme.textColor, textDecoration: 'none', fontWeight: 600, fontSize: '1.05rem', letterSpacing: '0.02em' }}>wishflow.shop</a>
          </div>

          {showButton && (
            <button onClick={onDownload} disabled={phase === "loading" || downloading || tearing} title="Download Card"
              style={{ width: "2.8rem", height: "2.8rem", borderRadius: "50%", background: phase === "loading" ? "rgba(255,255,255,0.3)" : "#ffffff", color: "#3629b3", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: phase === "loading" ? "not-allowed" : "pointer", boxShadow: phase !== "loading" ? "0 4px 16px rgba(0,0,0,0.2)" : "none", transition: "all 0.2s", padding: 0 }}>
              {downloading ? <Loader2 size={18} style={{ animation: "roastSpin 1s linear infinite" }} /> : <ArrowDown size={22} strokeWidth={3} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
