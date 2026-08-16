import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Bookmark, FolderHeart, Share2 } from 'lucide-react';

const KEYFRAMES = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
@keyframes lp-fadeIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
@keyframes lp-glow { 0%,100%{opacity:.55;transform:scale(1)} 50%{opacity:.85;transform:scale(1.06)} }
`;
const FONT = '"Outfit", sans-serif';

const SLIDES = [
    {
        id: 0,
        Icon: Bookmark,
        label: 'Save Anything',
        desc: 'Save any product from any website that you want to purchase in future',
        cardGrad: 'linear-gradient(160deg, #4ade80 0%, #16a34a 50%, #064e3b 100%)',
        glow: 'rgba(74,222,128,0.45)',
    },
    {
        id: 1,
        Icon: FolderHeart,
        label: 'Collections',
        desc: 'Organize your wishlist products for any events/occasions',
        cardGrad: 'linear-gradient(160deg, #f472b6 0%, #db2777 50%, #831843 100%)',
        glow: 'rgba(244,114,182,0.45)',
    },
    {
        id: 2,
        Icon: Share2,
        label: 'Share Wishlists',
        desc: 'Share with friends & family and make gifting meaningful',
        cardGrad: 'linear-gradient(160deg, #60a5fa 0%, #2563eb 50%, #1e3a8a 100%)',
        glow: 'rgba(96,165,250,0.45)',
    },
];

/* ── Asterisk logo ── */
function WFLogo({ size = 40 }) {
    const cx = size / 2, cy = size / 2;
    const sw = size * 0.09;
    const r = size * 0.38;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" style={{ flexShrink: 0 }}>
            {[30, 90, 150, 210, 270, 330].map((deg, i) => {
                const rad = (deg * Math.PI) / 180;
                return (
                    <line key={i} x1={cx} y1={cy}
                        x2={cx + r * Math.cos(rad)} y2={cy + r * Math.sin(rad)}
                        stroke="white" strokeWidth={sw} strokeLinecap="round" />
                );
            })}
        </svg>
    );
}

const NOISE_URI = `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/* ── Mobile single card ── */
function SlideCard({ slide, scale = 1, opacity = 1 }) {
    const { Icon, label, desc, cardGrad } = slide;
    return (
        <div style={{
            width: '100%', height: '100%',
            background: cardGrad, borderRadius: '28px',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '24px',
            transform: `scale(${scale})`, opacity,
            transition: 'transform 0.38s cubic-bezier(.34,1.46,.64,1), opacity 0.38s ease',
            position: 'relative', overflow: 'hidden',
            boxShadow: opacity > 0.9
                ? '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)'
                : '0 12px 40px rgba(0,0,0,0.4)',
        }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '28px', backgroundImage: NOISE_URI, opacity: 0.12, mixBlendMode: 'screen', pointerEvents: 'none' }} />
            <div style={{ width: '150px', height: '150px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', zIndex: 1 }}>
                <div style={{ width: '92px', height: '92px', borderRadius: '50%', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)' }}>
                    <Icon size={42} color="#fff" strokeWidth={1.75} />
                </div>
            </div>
            <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, marginTop: '24px' }}>
                <h3 style={{ fontFamily: FONT, fontWeight: 800, fontSize: '1.85rem', color: '#fff', margin: '0 0 24px', letterSpacing: '0.01em', lineHeight: 1.2 }}>{label}</h3>
                <div style={{ width: '100px', height: '1.5px', background: 'rgba(255,255,255,0.22)', borderRadius: '2px', margin: '0 auto 20px auto', position: 'relative', zIndex: 1 }} />
                <p style={{ fontFamily: FONT, fontSize: '1.15rem', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.5, maxWidth: '260px' }}>{desc}</p>
            </div>
        </div>
    );
}

/* ── MOBILE VIEW ── */
function MobileView({ navigate }) {
    const [active, setActive] = useState(0);
    const [dragDelta, setDragDelta] = useState(0);
    const [dragging, setDragging] = useState(false);
    const touchStartX = useRef(null);
    const touchStartY = useRef(null);
    const autoRef = useRef(null);
    const carouselRef = useRef(null);

    const PEEK = 44;
    const GAP = 16;
    const cardW = typeof window !== 'undefined' ? window.innerWidth - PEEK * 2 - GAP : 280;
    const cardH = Math.min(480, typeof window !== 'undefined' ? window.innerHeight * 0.58 : 420);

    const goTo = useCallback((i) => { if (i >= 0 && i < SLIDES.length) setActive(i); }, []);

    const startAuto = useCallback(() => {
        autoRef.current = setInterval(() => setActive(prev => (prev + 1) % SLIDES.length), 3500);
    }, []);

    useEffect(() => { startAuto(); return () => clearInterval(autoRef.current); }, [startAuto]);

    const resetAuto = () => { clearInterval(autoRef.current); startAuto(); };

    const onTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        setDragging(true); setDragDelta(0);
        clearInterval(autoRef.current);
    };

    const touchMoveHandler = useCallback((e) => {
        if (touchStartX.current === null) return;
        const dx = e.touches[0].clientX - touchStartX.current;
        const dy = e.touches[0].clientY - touchStartY.current;
        if (Math.abs(dy) > Math.abs(dx) + 5) return;
        e.preventDefault();
        setDragDelta(dx);
    }, []);

    useEffect(() => {
        const el = carouselRef.current;
        if (!el) return;
        el.addEventListener('touchmove', touchMoveHandler, { passive: false });
        return () => el.removeEventListener('touchmove', touchMoveHandler);
    }, [touchMoveHandler]);

    const onTouchEnd = () => {
        setDragging(false);
        if (dragDelta < -52) goTo(active + 1);
        else if (dragDelta > 52) goTo(active - 1);
        setDragDelta(0); touchStartX.current = null; resetAuto();
    };

    const slide = SLIDES[active];

    return (
        <div style={{ width: '100%', height: '100dvh', background: '#050a10', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: FONT, position: 'relative', overflow: 'hidden' }}>
            <style>{KEYFRAMES}</style>
            {/* Background glow */}
            <div style={{ position: 'absolute', top: '14%', left: '50%', transform: 'translateX(-50%)', width: '380px', height: '380px', borderRadius: '50%', background: `radial-gradient(circle, ${slide.glow} 0%, transparent 70%)`, transition: 'background 0.5s ease', animation: 'lp-glow 5s ease-in-out infinite', pointerEvents: 'none' }} />
            {/* Logo */}
            <div style={{ paddingTop: 'max(40px, env(safe-area-inset-top, 40px))', animation: 'lp-fadeIn 0.4s ease both', zIndex: 2 }}>
                <WFLogo size={44} />
            </div>
            {/* Carousel */}
            <div
                ref={carouselRef}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', position: 'relative', marginTop: '16px', overflow: 'hidden', userSelect: 'none', touchAction: 'pan-y' }}
            >
                {SLIDES.map((s, i) => {
                    const offset = i - active;
                    const tx = offset * (cardW + GAP) + dragDelta;
                    const isActive = i === active;
                    return (
                        <div key={s.id} onClick={() => !dragging && goTo(i)} style={{ position: 'absolute', left: `calc(50% - ${cardW / 2}px)`, top: '50%', width: `${cardW}px`, height: `${cardH}px`, transform: `translate(${tx}px, -50%)`, transition: dragging ? 'none' : 'transform 0.42s cubic-bezier(.25,.8,.25,1)', zIndex: isActive ? 2 : 1, cursor: isActive ? 'default' : 'pointer' }}>
                            <SlideCard slide={s} scale={isActive ? 1 : 0.87} opacity={isActive ? 1 : 0.45} />
                        </div>
                    );
                })}
            </div>
            {/* Bottom */}
            <div style={{ padding: '16px 28px max(40px, calc(32px + env(safe-area-inset-bottom, 0px)))', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, textAlign: 'center', animation: 'lp-fadeIn 0.4s ease 0.1s both', width: '100%', boxSizing: 'border-box' }}>
                <h1 style={{ fontWeight: 900, fontSize: '1.85rem', color: '#fff', margin: 0, lineHeight: 1.2, letterSpacing: '0.02em' }}>
                    Wishflow,<br />
                    <div style={{ fontWeight: 900, fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', lineHeight: 1.1, letterSpacing: '0.03em', marginBottom: '12px' }}>
                        <span style={{ color: '#e879f9' }}>your </span>
                        <span style={{ color: '#c084fc' }}>wishlist </span>
                        <span style={{ color: '#60a5fa' }}>assistant</span>
                    </div>
                </h1>

                <button
                    onClick={() => navigate('/auth')}
                    style={{ marginTop: '28px', background: '#fff', color: '#111', border: 'none', borderRadius: '50px', padding: '16px 40px', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', fontFamily: FONT, display: 'inline-flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.4)', letterSpacing: '0.1em', transition: 'opacity 0.15s' }}
                    onMouseDown={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseUp={e => e.currentTarget.style.opacity = '1'}
                    onTouchStart={e => e.currentTarget.style.opacity = '0.85'}
                    onTouchEnd={e => e.currentTarget.style.opacity = '1'}
                >
                    Let's Get Started
                </button>
            </div>
        </div>
    );
}

/* ── DESKTOP VIEW ── */
function DesktopView({ navigate }) {
    return (
        <div style={{
            width: '100vw', height: '100vh',
            background: '#050a10',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: FONT, position: 'relative',
            overflow: 'hidden', boxSizing: 'border-box',
            padding: '0 40px',
        }}>
            <style>{KEYFRAMES}</style>

            {/* Ambient glows behind each card */}
            {SLIDES.map((s, i) => (
                <div key={i} style={{
                    position: 'absolute', top: '60%',
                    left: `${16 + i * 34}%`, transform: 'translate(-50%, -50%)',
                    width: '500px', height: '500px', borderRadius: '50%',
                    background: `radial-gradient(circle, ${s.glow} 0%, transparent 68%)`,
                    pointerEvents: 'none',
                    animation: `lp-glow ${5 + i}s ease-in-out ${i * 1.2}s infinite`,
                }} />
            ))}

            {/* LOGO */}
            <div style={{ position: 'relative', zIndex: 2, marginBottom: '14px', animation: 'lp-fadeIn 0.45s ease both' }}>
                <WFLogo size={44} />
            </div>

            {/* HEADLINE */}
            <div style={{ textAlign: 'center', marginBottom: '28px', position: 'relative', zIndex: 2, animation: 'lp-fadeIn 0.45s ease 0.06s both' }}>
                <div style={{ fontWeight: 900, fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', color: '#fff', lineHeight: 1.1, letterSpacing: '0.03em', marginBottom: '4px' }}>
                    Wishflow,
                </div>
                <div style={{ fontWeight: 900, fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', lineHeight: 1.1, letterSpacing: '0.03em', marginBottom: '12px' }}>
                    <span style={{ color: '#e879f9' }}>your </span>
                    <span style={{ color: '#c084fc' }}>wishlist </span>
                    <span style={{ color: '#60a5fa' }}>assistant</span>
                </div>

            </div>

            {/* 3 CARDS */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '48px',
                width: '100%', maxWidth: '980px',
                height: 'clamp(320px, 50vh, 500px)',
                position: 'relative', zIndex: 2,
                animation: 'lp-fadeIn 0.45s ease 0.12s both',
            }}>
                {SLIDES.map((s) => {
                    const Icon = s.Icon;
                    return (
                        <div key={s.id} style={{
                            background: s.cardGrad, borderRadius: '24px',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            position: 'relative', overflow: 'hidden',
                            boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
                        }}>
                            <div style={{ position: 'absolute', inset: 0, borderRadius: '24px', backgroundImage: NOISE_URI, opacity: 0.08, mixBlendMode: 'screen', pointerEvents: 'none' }} />
                            {/* Icon circles */}
                            <div style={{ width: '130px', height: '130px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px', position: 'relative', zIndex: 1 }}>
                                <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.22)' }}>
                                    <Icon size={34} color="#fff" strokeWidth={1.75} />
                                </div>
                            </div>
                            {/* Title */}
                            <h3 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 'clamp(1.2rem, 1.8vw, 1.6rem)', color: '#fff', margin: '0 0 10px', letterSpacing: '-0.01em', textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 16px' }}>
                                {s.label}
                            </h3>
                            {/* Divider */}
                            <div style={{ width: '36px', height: '1.5px', background: 'rgba(255,255,255,0.22)', borderRadius: '2px', marginBottom: '10px', position: 'relative', zIndex: 1 }} />
                            {/* Description */}
                            <p style={{ fontFamily: FONT, fontSize: 'clamp(0.78rem, 1vw, 0.92rem)', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.6, textAlign: 'center', maxWidth: '220px', position: 'relative', zIndex: 1, padding: '5px 1px' }}>
                                {s.desc}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* CTA BUTTON */}
            <button
                onClick={() => navigate('/auth')}
                style={{
                    marginTop: '28px', background: '#fff', color: '#111',
                    border: 'none', borderRadius: '50px', padding: '16px 52px',
                    fontWeight: 700, fontSize: '1rem', cursor: 'pointer', fontFamily: FONT,
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    boxShadow: '0 12px 48px rgba(0,0,0,0.5)', letterSpacing: '-0.01em',
                    position: 'relative', zIndex: 2,
                    animation: 'lp-fadeIn 0.45s ease 0.2s both',
                    transition: 'transform 0.15s', flexShrink: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
                Let's Get Started
            </button>
        </div>
    );
}

/* ── ROOT ── */
export default function LandingPage() {
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < 768 : false
    );
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);
    return isMobile ? <MobileView navigate={navigate} /> : <DesktopView navigate={navigate} />;
}
