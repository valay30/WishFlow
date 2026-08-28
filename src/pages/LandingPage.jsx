import { useNavigate, Link } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Bookmark, FolderHeart, Share2, Link2, Tag, Bell, ChevronDown, Star, Zap, Shield, Check, Compass } from 'lucide-react';

/* ─────────────────────────────────────────
   Fonts & Keyframes
───────────────────────────────────────── */
const KEYFRAMES = `
@keyframes lp-fadeIn { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes lp-glow { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:.8;transform:scale(1.07)} }
@keyframes lp-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes lp-pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
`;
const FONT = '"Outfit Variable", "Outfit", sans-serif';

/* ─────────────────────────────────────────
   Feature Cards Data
───────────────────────────────────────── */
const FEATURES = [
    {
        id: 0,
        Icon: Bookmark,
        label: 'Save Anything, Instantly',
        desc: 'Save any product from any website that you want to purchase in future',
        longDesc: 'Simply paste a product URL from any shopping website. WishFlow automatically fetches the product name, image, and price for you. No more juggling browser tabs or losing track of things you want to buy.',
        cardGrad: '#fff',
        glow: 'rgba(232,92,44,0.1)',
    },
    {
        id: 1,
        Icon: FolderHeart,
        label: 'Collections for Every Occasion',
        desc: 'Organize your wishlist products for any events/occasions',
        longDesc: 'Create separate collections for birthdays, weddings, festivals, and more. Keep your wishlist perfectly organized so you always know what you want and when you want it. Add items from multiple stores into a single themed collection.',
        cardGrad: '#fff',
        glow: 'rgba(232,92,44,0.12)',
    },
    {
        id: 2,
        Icon: Share2,
        label: 'Share with Friends & Family',
        desc: 'Share with friends & family and make gifting meaningful',
        longDesc: 'Share your wishlist collections with a single link. No app download required for your friends or family to view it. Make birthdays and festivals stress free by letting your loved ones know exactly what you want.',
        cardGrad: '#fff',
        glow: 'rgba(232,92,44,0.15)',
    },
];

const NOISE_URI = `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/* ─────────────────────────────────────────
   Logo
───────────────────────────────────────── */
function WFLogo({ size = 40 }) {
    return (
        <img 
            src="/192x192.png" 
            alt="WishFlow Logo" 
            width={size} 
            height={size} 
            style={{ flexShrink: 0, borderRadius: size * 0.2 }} 
        />
    );
}

/* ─────────────────────────────────────────
   FAQ Accordion
───────────────────────────────────────── */
const FAQS = [
    {
        q: 'What is WishFlow and how does it work?',
        a: 'WishFlow is a smart wishlist app that helps you save, organize, and share products you want to buy. Simply paste the URL of any product from any website. WishFlow automatically extracts the product name, image, and price using its smart scraper. You can then organize your saved products into collections and share them with anyone using a link.'
    },
    {
        q: 'Is WishFlow free to use?',
        a: 'Yes! WishFlow has a free tier that lets you save and organize products. We also offer a Premium plan which unlocks additional features like unlimited collections, advanced price tracking, and collection sharing. You can upgrade anytime from your profile page.'
    },
    {
        q: 'Can I save products from any website?',
        a: 'WishFlow supports products from most major e-commerce websites including Amazon, Flipkart, Myntra, Ajio, Meesho, Nykaa, and thousands more. As long as the product page has a public URL, WishFlow can save it. Some websites with login-gated product pages may not be supported.'
    },
    {
        q: 'How do I share my wishlist?',
        a: 'You can share individual collections by opening a collection and tapping the Share button. This generates a unique public link that anyone can open in their browser — no account or app download required. It is perfect for sharing with friends and family before birthdays or festivals.'
    },
    {
        q: 'Is my wishlist data private?',
        a: 'Absolutely. By default, all your wishlists are completely private and visible only to you. You choose to share specific collections by generating a share link. You can revoke the share link at any time from within the app, making that collection private again instantly.'
    },
    {
        q: 'Does WishFlow work on mobile?',
        a: 'Yes! WishFlow is a Progressive Web App (PWA). You can install it on your Android or iOS home screen directly from your browser — no App Store download needed. It works offline as well, so you can browse your saved wishlists even without an internet connection.'
    },
];

function FAQItem({ q, a }) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            overflow: 'hidden',
        }}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    width: '100%', background: 'none', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1.4rem 0', cursor: 'pointer', gap: '1rem', textAlign: 'left',
                    fontFamily: FONT,
                }}
            >
                <span style={{ fontWeight: 600, fontSize: 'clamp(0.95rem, 2vw, 1.05rem)', color: '#111', lineHeight: 1.4 }}>{q}</span>
                <ChevronDown size={20} color="#E85C2C" style={{ flexShrink: 0, transition: 'transform 0.3s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>
            <div style={{
                maxHeight: open ? '500px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.35s ease',
            }}>
                <p style={{
                    margin: '0 0 1.4rem', color: '#666',
                    fontSize: 'clamp(0.88rem, 1.8vw, 0.98rem)', lineHeight: 1.75, fontFamily: FONT,
                }}>{a}</p>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   How It Works Steps
───────────────────────────────────────── */
const HOW_IT_WORKS = [
    {
        step: '01',
        Icon: Link2,
        title: 'Paste a Product URL',
        desc: 'Find any product you love on any e-commerce site. Copy its URL and paste it into WishFlow. Our smart engine automatically pulls the product name, photo, price, and website — so you save it in seconds.',
    },
    {
        step: '02',
        Icon: Tag,
        title: 'Organize into Collections',
        desc: 'Create themed collections for any occasion — a birthday wishlist, a home makeover list, a festival shopping guide. Drag products between collections and keep everything tidy in one beautiful place.',
    },
    {
        step: '03',
        Icon: Share2,
        title: 'Share & Get the Perfect Gift',
        desc: 'Share a collection link with your friends or family before your birthday or a festival. They see exactly what you want, in the right style and size. No more guessing, no more unwanted gifts.',
    },
    {
        step: '04',
        Icon: Bell,
        title: 'Track Prices & Get Notified',
        desc: 'WishFlow keeps an eye on the products you have saved. When the price drops or an item goes on sale, you get a push notification instantly. Save money by buying at exactly the right moment.',
    },
];

/* ─────────────────────────────────────────
   Full Page (Scrollable)
───────────────────────────────────────── */
export default function LandingPage() {
    const navigate = useNavigate();
    const [activeSlide, setActiveSlide] = useState(0);
    const [dragDelta, setDragDelta] = useState(0);
    const [dragging, setDragging] = useState(false);
    const touchStartX = useRef(null);
    const touchStartY = useRef(null);
    const autoRef = useRef(null);
    const carouselRef = useRef(null);
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Carousel auto-advance
    const startAuto = useCallback(() => {
        autoRef.current = setInterval(() => setActiveSlide(prev => (prev + 1) % FEATURES.length), 3800);
    }, []);
    useEffect(() => { startAuto(); return () => clearInterval(autoRef.current); }, [startAuto]);
    const resetAuto = () => { clearInterval(autoRef.current); startAuto(); };

    // Touch handlers for mobile carousel
    const PEEK = 44, GAP = 16;
    const cardW = typeof window !== 'undefined' ? window.innerWidth - PEEK * 2 - GAP : 280;
    const cardH = Math.min(420, typeof window !== 'undefined' ? window.innerHeight * 0.52 : 400);

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
        if (dragDelta < -52) setActiveSlide(a => Math.min(a + 1, FEATURES.length - 1));
        else if (dragDelta > 52) setActiveSlide(a => Math.max(a - 1, 0));
        setDragDelta(0); touchStartX.current = null; resetAuto();
    };

    return (
        <div style={{ background: '#fdfdfd', fontFamily: FONT, overflowX: 'hidden' }}>
            <style>{KEYFRAMES}</style>

            {/* ── NAVBAR ── */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem 2rem',
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <WFLogo size={28} />
                    <span style={{ color: '#111', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>WishFlow</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    {!isMobile && (
                        <Link
                            to="/discover"
                            style={{
                                color: '#444', fontWeight: 600, fontSize: '0.95rem',
                                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem',
                                transition: 'color 0.2s', fontFamily: FONT
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#E85C2C'}
                            onMouseLeave={e => e.currentTarget.style.color = '#444'}
                        >
                            <Compass size={18} />
                            Discover
                        </Link>
                    )}
                    <button
                        onClick={() => navigate('/auth')}
                        style={{
                            background: '#E85C2C', color: '#fff', border: 'none',
                            borderRadius: '50px', padding: '0.5rem 1.4rem',
                            fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: FONT,
                        }}
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            {/* ── HERO SECTION ── */}
            <section style={{
                minHeight: '100dvh',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center',
                paddingTop: isMobile ? '80px' : '90px',
                paddingBottom: isMobile ? '3rem' : '5rem',
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Ambient glows */}
                {FEATURES.map((s, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        top: isMobile ? '28%' : '45%',
                        left: isMobile ? '50%' : `${18 + i * 32}%`,
                        transform: 'translate(-50%, -50%)',
                        width: isMobile ? '340px' : '460px', height: isMobile ? '340px' : '460px',
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${s.glow} 0%, transparent 68%)`,
                        pointerEvents: 'none', transition: 'opacity 0.6s ease',
                        opacity: isMobile ? (i === activeSlide ? 1 : 0) : 1,
                        animation: `lp-glow ${5 + i}s ease-in-out ${i * 1.2}s infinite`,
                    }} />
                ))}

                {/* Headline */}
                <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 1.5rem', animation: 'lp-fadeIn 0.5s ease both', marginBottom: isMobile ? '1.5rem' : '2rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#FFF5F2', border: '1px solid rgba(232,92,44,0.15)', borderRadius: '99px', padding: '0.35rem 1rem', marginBottom: '1.25rem' }}>
                        <Star size={13} color="#E85C2C" fill="#E85C2C" />
                        <span style={{ color: '#E85C2C', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>YOUR SMART WISHLIST APP</span>
                    </div>
                    <h1 style={{ fontWeight: 900, fontSize: isMobile ? '2.4rem' : 'clamp(2.8rem, 5vw, 4rem)', color: '#111', margin: '0 0 0.5rem', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                        WishFlow,
                    </h1>
                    <div style={{ fontWeight: 900, fontSize: isMobile ? '2.2rem' : 'clamp(2.6rem, 4.5vw, 3.6rem)', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
                        <span style={{ color: '#111' }}>your </span>
                        <span style={{ color: '#E85C2C' }}>wishlist assistant</span>
                        {/* <span style={{ color: '#FF9A5A' }}>assistant</span> */}
                    </div>
                    <p style={{ color: '#666', fontSize: isMobile ? '1rem' : '1.15rem', maxWidth: '540px', margin: '0 auto 1.75rem', lineHeight: 1.6 }}>
                        Save products from any website, organize them into beautiful collections, and share your wishlist with friends & family — all for free.
                    </p>
                    <button
                        onClick={() => navigate('/auth')}
                        style={{
                            background: '#E85C2C', color: '#fff', border: 'none',
                            borderRadius: '50px', padding: isMobile ? '0.95rem 2.2rem' : '1rem 2.75rem',
                            fontWeight: 700, fontSize: '1rem', cursor: 'pointer', fontFamily: FONT,
                            boxShadow: '0 12px 32px rgba(232,92,44,0.25)', letterSpacing: '-0.01em',
                            transition: 'transform 0.15s',
                            display: 'block', margin: '0 auto'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        Start for Free — No Card Needed
                    </button>
                    {isMobile && (
                        <button
                            onClick={() => navigate('/discover')}
                            style={{
                                marginTop: '1rem',
                                background: '#fff',
                                color: '#111',
                                border: '2px solid rgba(0,0,0,0.08)',
                                borderRadius: '50px',
                                padding: '0.9rem 2.2rem',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                fontFamily: FONT,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                margin: '1rem auto 0',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                            }}
                        >
                            <Compass size={18} color="#E85C2C" />
                            Explore Discover Feed
                        </button>
                    )}
                </div>

                {/* Mobile: Carousel / Desktop: 3 cards row */}
                {isMobile ? (
                    <div
                        ref={carouselRef}
                        onTouchStart={onTouchStart}
                        onTouchEnd={onTouchEnd}
                        style={{ width: '100%', position: 'relative', height: `${cardH}px`, flexShrink: 0, userSelect: 'none', touchAction: 'pan-y', zIndex: 2 }}
                    >
                        {FEATURES.map((s, i) => {
                            const offset = i - activeSlide;
                            const tx = offset * (cardW + GAP) + dragDelta;
                            const isActive = i === activeSlide;
                            return (
                                <div key={s.id} style={{ position: 'absolute', left: `calc(50% - ${cardW / 2}px)`, top: '50%', width: `${cardW}px`, height: `${cardH}px`, transform: `translate(${tx}px, -50%)`, transition: dragging ? 'none' : 'transform 0.42s cubic-bezier(.25,.8,.25,1)', zIndex: isActive ? 2 : 1 }}>
                                    <div style={{ width: '100%', height: '100%', background: '#fff', borderRadius: '24px', border: isActive ? '2px solid #E85C2C' : '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', overflow: 'hidden', transform: `scale(${isActive ? 1 : 0.87})`, opacity: isActive ? 1 : 0.4, transition: 'transform 0.38s ease, opacity 0.38s ease, border 0.38s ease, box-shadow 0.38s ease', boxShadow: isActive ? '0 25px 60px rgba(232,92,44,0.15)' : '0 12px 30px rgba(0,0,0,0.05)' }}>
                                        <div style={{ position: 'absolute', inset: 0, backgroundImage: NOISE_URI, opacity: 0.1, mixBlendMode: 'screen', pointerEvents: 'none' }} />
                                        <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', zIndex: 1 }}>
                                            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#FFF5F2', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <s.Icon size={30} color="#E85C2C" strokeWidth={2} />
                                            </div>
                                        </div>
                                        <h3 style={{ fontFamily: FONT, fontWeight: 800, fontSize: '1.5rem', color: '#111', margin: '0 0 0.75rem', textAlign: 'center', zIndex: 1 }}>{s.label}</h3>
                                        <div style={{ width: '50px', height: '1.5px', background: 'rgba(232,92,44,0.3)', borderRadius: '2px', marginBottom: '0.75rem', zIndex: 1 }} />
                                        <p style={{ fontFamily: FONT, fontSize: '0.95rem', color: '#666', margin: 0, lineHeight: 1.55, textAlign: 'center', zIndex: 1 }}>{s.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', width: '100%', maxWidth: '960px', height: 'clamp(300px, 42vh, 440px)', position: 'relative', zIndex: 2, padding: '0 2rem', boxSizing: 'border-box', animation: 'lp-fadeIn 0.5s ease 0.1s both' }}>
                        {FEATURES.map(s => (
                            <div 
                                key={s.id} 
                                style={{ background: '#fff', borderRadius: '24px', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.06)', transition: 'transform 0.3s ease, border 0.3s ease, box-shadow 0.3s ease' }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.border = '2px solid #E85C2C';
                                    e.currentTarget.style.boxShadow = '0 25px 60px rgba(232,92,44,0.15)';
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.border = '1px solid #f0f0f0';
                                    e.currentTarget.style.boxShadow = '0 24px 64px rgba(0,0,0,0.06)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{ position: 'absolute', inset: 0, backgroundImage: NOISE_URI, opacity: 0.08, mixBlendMode: 'screen', pointerEvents: 'none' }} />
                                <div style={{ width: '110px', height: '110px', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', zIndex: 1 }}>
                                    <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#FFF5F2', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <s.Icon size={28} color="#E85C2C" strokeWidth={2} />
                                    </div>
                                </div>
                                <h3 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 'clamp(1rem, 1.5vw, 1.3rem)', color: '#111', margin: '0 0 0.5rem', textAlign: 'center', zIndex: 1, padding: '0 1rem' }}>{s.label}</h3>
                                <div style={{ width: '36px', height: '1.5px', background: 'rgba(232,92,44,0.3)', borderRadius: '2px', marginBottom: '0.5rem', zIndex: 1 }} />
                                <p style={{ fontFamily: FONT, fontSize: 'clamp(0.78rem, 1vw, 0.88rem)', color: '#666', margin: 0, lineHeight: 1.6, textAlign: 'center', maxWidth: '210px', zIndex: 1, padding: '0 1rem' }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Dots (mobile only) */}
                {isMobile && (
                    <div style={{ display: 'flex', gap: '0.4rem', zIndex: 2, marginTop: '1rem', marginBottom: '1.5rem' }}>
                        {FEATURES.map((_, i) => (
                            <button key={i} onClick={() => { setActiveSlide(i); resetAuto(); }} aria-label={`Go to slide ${i + 1}`} aria-current={i === activeSlide ? 'true' : undefined} style={{ width: i === activeSlide ? '1.75rem' : '0.45rem', height: '0.45rem', borderRadius: '99px', background: i === activeSlide ? '#E85C2C' : 'rgba(0,0,0,0.1)', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0 }} />
                        ))}
                    </div>
                )}

                {/* Scroll nudge — desktop only */}
                {!isMobile && (
                    <div style={{ position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', animation: 'lp-pulse 2.2s ease-in-out infinite', opacity: 0.5, cursor: 'pointer' }} onClick={() => window.scrollBy({ top: window.innerHeight * 0.9, behavior: 'smooth' })}>
                        <span style={{ color: '#888', fontSize: '0.7rem', fontFamily: FONT, letterSpacing: '0.08em', fontWeight: 600 }}>SCROLL</span>
                        <ChevronDown size={18} color="#888" />
                    </div>
                )}
            </section>

            {/* ── WHY WISHFLOW (3 Feature Bullets) ── */}
            <section style={{ padding: isMobile ? '5rem 1.5rem' : '7rem 2rem', maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: isMobile ? '3rem' : '4rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#FFF5F2', border: '1px solid rgba(232,92,44,0.15)', borderRadius: '99px', padding: '0.35rem 1rem', marginBottom: '1rem' }}>
                        <Zap size={13} color="#E85C2C" fill="#E85C2C" />
                        <span style={{ color: '#E85C2C', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>FEATURES</span>
                    </div>
                    <h2 style={{ fontWeight: 900, fontSize: isMobile ? '2rem' : 'clamp(2rem, 3.5vw, 2.75rem)', color: '#111', margin: '0 0 1rem', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                        Everything your wishlist needs
                    </h2>
                    <p style={{ color: '#666', fontSize: isMobile ? '0.95rem' : '1.05rem', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
                        WishFlow is more than just bookmarks. It is a complete wishlist management system designed for the way you shop online today.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.5rem' }}>
                    {FEATURES.map(f => (
                        <div key={f.id} style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '20px', padding: '2rem', transition: 'border-color 0.2s ease' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(232,92,44,0.3)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = '#f0f0f0'}
                        >
                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#FFF5F2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                                <f.Icon size={22} color="#E85C2C" strokeWidth={2} />
                            </div>
                            <h3 style={{ fontFamily: FONT, fontWeight: 800, fontSize: '1.1rem', color: '#111', margin: '0 0 0.75rem' }}>{f.label}</h3>
                            <p style={{ fontFamily: FONT, fontSize: '0.92rem', color: '#666', margin: 0, lineHeight: 1.7 }}>{f.longDesc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section style={{ padding: isMobile ? '5rem 1.5rem' : '7rem 2rem', background: '#fafafa', borderTop: '1px solid rgba(0,0,0,0.04)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: isMobile ? '3rem' : '4rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#FFF5F2', border: '1px solid rgba(232,92,44,0.15)', borderRadius: '99px', padding: '0.35rem 1rem', marginBottom: '1rem' }}>
                            <Zap size={13} color="#E85C2C" fill="#E85C2C" />
                            <span style={{ color: '#FF9A5A', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>HOW IT WORKS</span>
                        </div>
                        <h2 style={{ fontWeight: 900, fontSize: isMobile ? '2rem' : 'clamp(2rem, 3.5vw, 2.75rem)', color: '#111', margin: '0 0 1rem', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                            From URL to organized wishlist in seconds
                        </h2>
                        <p style={{ color: '#666', fontSize: isMobile ? '0.95rem' : '1.05rem', maxWidth: '500px', margin: '0 auto', lineHeight: 1.7 }}>
                            WishFlow is designed to be effortless. Here is how it works in four simple steps.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '1.5rem' }}>
                        {HOW_IT_WORKS.map((step, i) => (
                            <div key={i} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', background: '#fff', border: '1px solid #f0f0f0', borderRadius: '20px', padding: '1.75rem' }}>
                                <div style={{ flexShrink: 0, width: '48px', height: '48px', borderRadius: '14px', background: '#FFF5F2', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <step.Icon size={22} color="#E85C2C" strokeWidth={2} />
                                </div>
                                <div>
                                    <div style={{ color: '#E85C2C', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '0.4rem', fontFamily: FONT }}>STEP {step.step}</div>
                                    <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: '1rem', color: '#111', margin: '0 0 0.6rem' }}>{step.title}</h3>
                                    <p style={{ fontFamily: FONT, fontSize: '0.88rem', color: '#666', margin: 0, lineHeight: 1.72 }}>{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PRICING SECTION ── */}
            <section style={{ padding: isMobile ? '5rem 1.5rem' : '7rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: isMobile ? '3rem' : '4rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#FFF5F2', border: '1px solid rgba(232,92,44,0.15)', borderRadius: '99px', padding: '0.35rem 1rem', marginBottom: '1rem' }}>
                        <Star size={13} color="#E85C2C" fill="#E85C2C" />
                        <span style={{ color: '#111', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em' }}>SIMPLE PRICING</span>
                    </div>
                    <h2 style={{ fontWeight: 900, fontSize: isMobile ? '2rem' : 'clamp(2rem, 3.5vw, 2.75rem)', color: '#111', margin: '0 0 1rem', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                        Choose the plan that fits you
                    </h2>
                    <p style={{ color: '#666', fontSize: isMobile ? '0.95rem' : '1.05rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
                        Get started for free or unlock unlimited wishes with a one time lifetime payment.
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                    gap: '2rem',
                    maxWidth: '740px',
                    margin: '0 auto',
                    alignItems: 'stretch',
                }}>
                    {/* Free Card */}
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '28px',
                        padding: isMobile ? '1.75rem' : '2.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
                        position: 'relative',
                    }}>
                        <div>
                            {/* Top header pill */}
                            <div style={{
                                background: '#f1f5f9',
                                borderRadius: '20px',
                                padding: '1.5rem',
                                marginBottom: '1.5rem',
                            }}>
                                <span style={{
                                    display: 'inline-block',
                                    background: '#ffffff',
                                    padding: '0.35rem 1rem',
                                    borderRadius: '99px',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    color: '#0f172a',
                                    marginBottom: '1rem',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                                }}>
                                    Free
                                </span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                                    <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>₹0</span>
                                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#64748b' }}>/lifetime</span>
                                </div>
                            </div>

                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', marginBottom: '1.25rem' }}>
                                Basic Features
                            </div>

                            <button
                                onClick={() => navigate('/auth')}
                                style={{
                                    width: '100%',
                                    padding: '0.95rem',
                                    background: '#f1f5f9',
                                    color: '#334155',
                                    border: 'none',
                                    borderRadius: '16px',
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    fontFamily: FONT,
                                    cursor: 'pointer',
                                    marginBottom: '1.75rem',
                                    transition: 'background 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                                onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                            >
                                Start for Free
                            </button>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                {[
                                    'Up to 5 wishes',
                                    'Basic support',
                                    'Auto fetch product information'
                                ].map((feature, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                        <Check size={18} color="#E85C2C" strokeWidth={2.5} />
                                        <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#1e293b' }}>{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Premium Card */}
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '28px',
                        padding: isMobile ? '1.75rem' : '2.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 25px 60px rgba(232,92,44,0.15), 0 0 0 2px #E85C2C',
                        position: 'relative',
                    }}>
                        <div>
                            {/* Top header pill */}
                            <div style={{
                                background: '#FFF5F2',
                                borderRadius: '20px',
                                padding: '1.5rem',
                                marginBottom: '1.5rem',
                            }}>
                                <span style={{
                                    display: 'inline-block',
                                    background: '#ffffff',
                                    padding: '0.35rem 1rem',
                                    borderRadius: '99px',
                                    fontSize: '0.82rem',
                                    fontWeight: 800,
                                    color: '#E85C2C',
                                    marginBottom: '1rem',
                                    boxShadow: '0 1px 3px rgba(232,92,44,0.1)',
                                    letterSpacing: '0.03em'
                                }}>
                                    PREMIUM
                                </span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                                    <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>₹100</span>
                                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#64748b' }}>/lifetime</span>
                                </div>
                            </div>

                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', marginBottom: '1.25rem' }}>
                                Unlock all features
                            </div>

                            <button
                                onClick={() => {
                                    sessionStorage.setItem('upgradeIntent', '1');
                                    navigate('/auth');
                                }}
                                style={{
                                    width: '100%',
                                    padding: '0.95rem',
                                    background: 'linear-gradient(135deg, #FF9A5A 0%, #FF3D3D 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '16px',
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    fontFamily: FONT,
                                    cursor: 'pointer',
                                    marginBottom: '1.75rem',
                                    transition: 'transform 0.15s, background 0.2s',
                                    boxShadow: '0 8px 24px rgba(232,92,44,0.25)',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                Upgrade Now
                            </button>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                {[
                                    'Unlimited wishes',
                                    'Lifetime access',
                                    'Dark mode & themes',
                                    'Collection sharing',
                                    'Auto fetch product information'
                                ].map((feature, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                        <Check size={18} color="#E85C2C" strokeWidth={2.5} />
                                        <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#1e293b' }}>{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── TRUST BADGES ── */}
            <section style={{ padding: isMobile ? '4rem 1.5rem' : '5rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
                <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    gap: isMobile ? '1.75rem' : '3rem',
                    width: isMobile ? 'fit-content' : '100%',
                    margin: '0 auto',
                }}>
                    {[
                        { Icon: Shield, label: 'Private by Default', sub: 'Your wishlist is only visible to you' },
                        { Icon: Zap, label: 'Works Offline', sub: 'Browse saved items without internet' },
                        { Icon: Star, label: 'Completely Free', sub: 'Core features are free forever' },
                    ].map((b, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#FFF5F2', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <b.Icon size={18} color="#E85C2C" />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ color: '#111', fontWeight: 700, fontSize: '0.92rem', fontFamily: FONT }}>{b.label}</div>
                                <div style={{ color: '#666', fontSize: '0.8rem', fontFamily: FONT }}>{b.sub}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FAQ ── */}
            <section style={{ padding: isMobile ? '5rem 1.5rem' : '7rem 2rem', background: '#fafafa', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ maxWidth: '720px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: isMobile ? '2.5rem' : '3.5rem' }}>
                        <h2 style={{ fontWeight: 900, fontSize: isMobile ? '2rem' : 'clamp(2rem, 3.5vw, 2.75rem)', color: '#111', margin: '0 0 1rem', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                            Frequently Asked Questions
                        </h2>
                        <p style={{ color: '#666', fontSize: isMobile ? '0.95rem' : '1.05rem', margin: 0, lineHeight: 1.7 }}>
                            Everything you need to know about WishFlow.
                        </p>
                    </div>
                    <div>
                        {FAQS.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
                    </div>
                </div>
            </section>

            {/* ── CTA BANNER ── */}
            <section style={{ padding: isMobile ? '5rem 1.5rem' : '7rem 2rem', textAlign: 'center' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h2 style={{ fontWeight: 900, fontSize: isMobile ? '2.2rem' : 'clamp(2.2rem, 4vw, 3.2rem)', color: '#111', margin: '0 0 1rem', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                        Start saving your wishlist today
                    </h2>
                    <p style={{ color: '#666', fontSize: '1.05rem', margin: '0 0 2rem', lineHeight: 1.7 }}>
                        Join thousands of smart shoppers who use WishFlow to never forget a product they love.
                    </p>
                    <button
                        onClick={() => navigate('/auth')}
                        style={{
                            background: '#E85C2C', color: '#fff', border: 'none',
                            borderRadius: '50px', padding: '1rem 2.75rem',
                            fontWeight: 700, fontSize: '1rem', cursor: 'pointer', fontFamily: FONT,
                            boxShadow: '0 12px 32px rgba(232,92,44,0.25)',
                            transition: 'transform 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        Create Free Account
                    </button>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{
                borderTop: '1px solid rgba(0,0,0,0.04)',
                padding: isMobile ? '2rem 1.5rem' : '2.5rem 2rem',
                display: 'flex', flexWrap: 'wrap', gap: '1rem',
                alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <WFLogo size={22} />
                    <span style={{ color: '#888', fontFamily: FONT, fontSize: '0.85rem' }}>
                        © {new Date().getFullYear()} WishFlow. All rights reserved.
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Privacy Policy', to: '/privacy' },
                        { label: 'Terms of Service', to: '/terms' },
                        { label: 'Refund Policy', to: '/refund' },
                    ].map(link => (
                        <Link key={link.to} to={link.to} style={{ color: '#888', fontFamily: FONT, fontSize: '0.85rem', textDecoration: 'none', transition: 'color 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#111'}
                            onMouseLeave={e => e.currentTarget.style.color = '#888'}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </footer>
        </div>
    );
}
