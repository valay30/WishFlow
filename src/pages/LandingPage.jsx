import { useNavigate, Link } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useInView, useScroll, useSpring } from 'framer-motion';
import { Bookmark, FolderHeart, Share2, Link2, Tag, Bell, ChevronDown, Star, Zap, Shield, Check, Compass } from 'lucide-react';
import AdUnit from '../components/AdUnit';
import MagneticButton from '../components/MagneticButton';

/* ─────────────────────────────────────────
   Fonts & Keyframes
───────────────────────────────────────── */
const KEYFRAMES = `
@keyframes lp-fadeIn { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes lp-glow { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:.8;transform:scale(1.07)} }
@keyframes lp-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes lp-pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
@keyframes lp-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
@keyframes lp-shine { 0% { left: -100%; } 20% { left: 200%; } 100% { left: 200%; } }
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
                    width: '100%', background: 'transparent', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1.4rem 1rem', cursor: 'pointer', gap: '1rem', textAlign: 'left',
                    fontFamily: FONT, borderRadius: '12px',
                    transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(232,92,44,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
                <span style={{ fontWeight: 600, fontSize: 'clamp(0.95rem, 2vw, 1.05rem)', color: open ? '#E85C2C' : '#111', lineHeight: 1.4, transition: 'color 0.2s' }}>{q}</span>
                <ChevronDown size={20} color="#E85C2C" style={{ flexShrink: 0, transition: 'transform 0.3s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                    >
                        <p style={{
                            margin: '0 1rem 1.4rem', color: '#666',
                            fontSize: 'clamp(0.88rem, 1.8vw, 0.98rem)', lineHeight: 1.75, fontFamily: FONT,
                        }}>{a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
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
   Scroll-Telling Components
───────────────────────────────────────── */
function StepCard({ step, index, setActiveStep }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { margin: "-50% 0px -50% 0px" });

    useEffect(() => {
        if (isInView) {
            setActiveStep(index);
        }
    }, [isInView, index, setActiveStep]);

    return (
        <div ref={ref} style={{ height: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{
                background: isInView ? '#ffffff' : 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(12px)',
                border: isInView ? '1px solid rgba(232, 92, 44, 0.15)' : '1px solid #f0f0f0',
                borderRadius: '28px',
                padding: '3rem 2.5rem',
                boxShadow: isInView
                    ? '0 32px 80px rgba(232, 92, 44, 0.12), 0 4px 20px rgba(232,92,44,0.05)'
                    : '0 4px 12px rgba(0,0,0,0.02)',
                transform: isInView ? 'scale(1)' : 'scale(0.92)',
                opacity: isInView ? 1 : 0.3,
                transition: 'all 0.6s cubic-bezier(0.2, 1, 0.2, 1)'
            }}>
                <div style={{
                    flexShrink: 0, width: '64px', height: '64px', borderRadius: '20px',
                    background: isInView ? '#FFF5F2' : '#f5f5f5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem',
                    transition: 'all 0.6s'
                }}>
                    <step.Icon size={32} color={isInView ? "#E85C2C" : "#999"} strokeWidth={2} />
                </div>
                <div style={{ color: isInView ? '#E85C2C' : '#999', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.2em', marginBottom: '0.75rem', fontFamily: FONT, transition: 'color 0.6s' }}>STEP {step.step}</div>
                <h3 style={{ fontFamily: FONT, fontWeight: 800, fontSize: '1.75rem', color: isInView ? '#111' : '#666', margin: '0 0 1rem', transition: 'color 0.6s', lineHeight: 1.2 }}>{step.title}</h3>
                <p style={{ fontFamily: FONT, fontSize: '1.1rem', color: '#666', margin: 0, lineHeight: 1.75 }}>{step.desc}</p>
            </div>
        </div>
    );
}

function MockupStep1() {
    return (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(to bottom, #fdfbfb, #ebedee)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '85%' }}>
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,1)' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#FFF5F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Link2 size={14} color="#E85C2C" />
                        </div>
                        <div style={{ height: '8px', width: '40%', background: '#e2e8f0', borderRadius: '4px' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <div style={{ flex: 1, height: '40px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '0 1rem', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                            <motion.span
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ delay: 0.5, duration: 1, ease: 'linear' }}
                                style={{ color: '#64748b', fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', display: 'inline-block' }}
                            >
                                https://amazon.in/p/xyz
                            </motion.span>
                        </div>
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: [0.8, 1.1, 0.9, 1] }}
                            transition={{ delay: 1.5, duration: 0.5 }}
                            style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #E85C2C 0%, #FF3D3D 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(232,92,44,0.3)' }}
                        >
                            <Star size={16} color="#fff" fill="#fff" />
                        </motion.div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.2, duration: 0.5, type: 'spring', damping: 15 }}
                    style={{ marginTop: '1rem', background: '#fff', borderRadius: '20px', padding: '1rem', boxShadow: '0 12px 30px rgba(0,0,0,0.06)' }}
                >
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)' }} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ height: '10px', width: '80%', background: '#94a3b8', borderRadius: '3px', marginBottom: '8px' }} />
                            <div style={{ height: '10px', width: '40%', background: '#cbd5e1', borderRadius: '3px', marginBottom: '8px' }} />
                            <div style={{ height: '12px', width: '30%', background: '#E85C2C', borderRadius: '3px' }} />
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function MockupStep2() {
    return (
        <div style={{ width: '100%', height: '100%', background: '#f8fafc', padding: '5rem 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ height: '24px', width: '50%', background: '#cbd5e1', borderRadius: '8px' }} />
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} style={{ aspectRatio: '4/5', background: 'linear-gradient(180deg, #fdfbfb 0%, #ebedee 100%)', borderRadius: '20px', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', boxShadow: '0 10px 20px rgba(0,0,0,0.04)' }}>
                    <div style={{ height: '8px', width: '70%', background: '#cbd5e1', borderRadius: '4px', marginBottom: '6px' }} />
                    <div style={{ height: '12px', width: '40%', background: '#94a3b8', borderRadius: '4px' }} />
                </motion.div>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} style={{ aspectRatio: '1', background: 'linear-gradient(180deg, #FFF5F2 0%, #FFE4DB 100%)', borderRadius: '20px', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', boxShadow: '0 10px 20px rgba(232,92,44,0.1)' }}>
                    <div style={{ height: '8px', width: '80%', background: '#E85C2C', opacity: 0.5, borderRadius: '4px', marginBottom: '6px' }} />
                    <div style={{ height: '12px', width: '50%', background: '#E85C2C', borderRadius: '4px' }} />
                </motion.div>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} style={{ aspectRatio: '1', background: 'linear-gradient(180deg, #EFF6FF 0%, #DBEAFE 100%)', borderRadius: '20px', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', boxShadow: '0 10px 20px rgba(59,130,246,0.1)' }}>
                    <div style={{ height: '8px', width: '60%', background: '#3b82f6', opacity: 0.5, borderRadius: '4px', marginBottom: '6px' }} />
                    <div style={{ height: '12px', width: '40%', background: '#3b82f6', borderRadius: '4px' }} />
                </motion.div>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} style={{ aspectRatio: '4/5', background: 'linear-gradient(180deg, #F5F3FF 0%, #EDE9FE 100%)', borderRadius: '20px', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', boxShadow: '0 10px 20px rgba(139,92,246,0.1)' }}>
                    <div style={{ height: '8px', width: '70%', background: '#8b5cf6', opacity: 0.5, borderRadius: '4px', marginBottom: '6px' }} />
                    <div style={{ height: '12px', width: '40%', background: '#8b5cf6', borderRadius: '4px' }} />
                </motion.div>
            </div>
        </div>
    );
}

function MockupStep3() {
    return (
        <div style={{ width: '100%', height: '100%', background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
            <div style={{ padding: '4rem 1rem 1rem' }}>
                <div style={{ width: '100%', height: '180px', background: '#e2e8f0', borderRadius: '20px', opacity: 0.5 }} />
            </div>

            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.1 }}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderTopLeftRadius: '28px', borderTopRightRadius: '28px', padding: '1.5rem 1.25rem 2.5rem', boxShadow: '0 -20px 40px rgba(0,0,0,0.08)' }}
            >
                <div style={{ width: '40px', height: '4px', background: '#e2e8f0', borderRadius: '2px', margin: '0 auto 1.5rem' }} />
                <div style={{ height: '16px', width: '60%', background: '#cbd5e1', borderRadius: '4px', marginBottom: '1.5rem', margin: '0 auto 1.5rem' }} />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                    {[
                        { c: '#25D366' }, { c: '#1DA1F2' }, { c: '#E1306C' }, { c: '#0088cc' }
                    ].map((app, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                            <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 + (i * 0.1), type: 'spring' }}
                                style={{ width: '40px', height: '40px', borderRadius: '12px', background: app.c, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 16px ${app.c}40` }}
                            >
                                <Share2 size={16} color="#fff" />
                            </motion.div>
                            <div style={{ height: '4px', width: '20px', background: '#e2e8f0', borderRadius: '2px' }} />
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

function MockupStep4() {
    return (
        <div style={{ width: '100%', height: '100%', background: '#f8fafc', position: 'relative' }}>
            <motion.div
                initial={{ y: -50, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 0.2 }}
                style={{ position: 'absolute', top: '2.5rem', left: '1rem', right: '1rem', background: '#fff', borderRadius: '20px', padding: '1rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.05)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}
            >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 8px 16px rgba(16,185,129,0.3)' }}>
                    <Bell size={20} color="#fff" fill="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ height: '12px', width: '80%', background: '#1e293b', borderRadius: '3px', marginBottom: '8px' }} />
                    <div style={{ height: '8px', width: '50%', background: '#94a3b8', borderRadius: '3px', marginBottom: '6px' }} />
                    <div style={{ height: '8px', width: '90%', background: '#e2e8f0', borderRadius: '3px' }} />
                </div>
            </motion.div>
        </div>
    );
}

function HowItWorksScroll({ isMobile }) {
    const [activeStep, setActiveStep] = useState(0);
    const [animationKey, setAnimationKey] = useState(0);
    const stickyRef = useRef(null);
    const isStickyInView = useInView(stickyRef, { amount: 0.4 });
    const colors = ['#E85C2C', '#3b82f6', '#8b5cf6', '#10b981'];
    const activeColor = colors[activeStep] || colors[0];

    useEffect(() => {
        if (isStickyInView) {
            setAnimationKey(prev => prev + 1);
        }
    }, [activeStep, isStickyInView]);

    if (isMobile) {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
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
        );
    }

    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative', marginTop: '2rem' }}>
            <div ref={stickyRef} style={{
                position: 'sticky',
                top: '90px',
                width: '50%',
                height: 'calc(100vh - 90px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div style={{
                    position: 'absolute',
                    width: '350px',
                    height: '350px',
                    background: activeColor,
                    borderRadius: '50%',
                    filter: 'blur(100px)',
                    opacity: 0.15,
                    transition: 'all 0.8s ease'
                }} />

                <div style={{
                    width: '280px',
                    height: '580px',
                    background: '#ffffff',
                    borderRadius: '40px',
                    border: '8px solid #111',
                    boxShadow: '0 40px 100px rgba(0,0,0,0.1), inset 0 0 0 2px rgba(255,255,255,0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 10
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '80px',
                        height: '24px',
                        background: '#000',
                        borderRadius: '16px',
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                    }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#111', boxShadow: 'inset 0 0 4px rgba(255,255,255,0.1)' }} />
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#111', boxShadow: 'inset 0 0 4px rgba(255,255,255,0.1)' }} />
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={animationKey}
                            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                            transition={{ duration: 0.5, ease: [0.2, 1, 0.2, 1] }}
                            style={{ flex: 1, display: 'flex', width: '100%', height: '100%', position: 'absolute', inset: 0, background: '#fafafa' }}
                        >
                            {activeStep === 0 && <MockupStep1 />}
                            {activeStep === 1 && <MockupStep2 />}
                            {activeStep === 2 && <MockupStep3 />}
                            {activeStep === 3 && <MockupStep4 />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
            <div style={{ width: '50%', padding: '0 2rem 50vh' }}>
                {HOW_IT_WORKS.map((step, i) => (
                    <StepCard key={i} step={step} index={i} setActiveStep={setActiveStep} />
                ))}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   Full Page (Scrollable)
───────────────────────────────────────── */
export default function LandingPage() {
    const navigate = useNavigate();

    // Manual scroll progress tracker (guaranteed to work across all browsers/setups)
    const [scrollProgress, setScrollProgress] = useState(0);
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            if (scrollHeight > 0) {
                setScrollProgress(scrollTop / scrollHeight);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initial check
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const [activeSlide, setActiveSlide] = useState(0);
    const [dragDelta, setDragDelta] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
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

    const handleMouseMove = (e) => {
        if (isMobile) return;
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = (e.clientY / window.innerHeight) * 2 - 1;
        setMousePos({ x, y });
    };

    return (
        <div style={{ background: '#fdfdfd', fontFamily: FONT, overflowX: 'clip' }}>
            {/* Scroll Progress Bar */}
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '4px', background: 'rgba(0,0,0,0.05)', zIndex: 99999 }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, #E85C2C, #FF3D3D)', width: `${scrollProgress * 100}%`, transition: 'width 0.1s ease-out' }} />
            </div>

            <style>{KEYFRAMES}</style>

            {/* ── NAVBAR ── */}
            <nav style={{
                position: 'fixed', top: isMobile ? '16px' : '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 100,
                width: 'calc(100% - 32px)', maxWidth: '1000px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: isMobile ? '0.75rem 1.25rem' : '0.8rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(40px) saturate(200%)',
                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '100px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.2), inset 0 2px 4px rgba(255,255,255,0.8)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <WFLogo size={28} />
                    <span style={{ color: '#111', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>WishFlow</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    {!isMobile && (
                        <>
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
                            <Link
                                to="/blog"
                                style={{
                                    color: '#444', fontWeight: 600, fontSize: '0.95rem',
                                    textDecoration: 'none', transition: 'color 0.2s', fontFamily: FONT
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#E85C2C'}
                                onMouseLeave={e => e.currentTarget.style.color = '#444'}
                            >
                                Blog
                            </Link>
                            <Link
                                to="/about"
                                style={{
                                    color: '#444', fontWeight: 600, fontSize: '0.95rem',
                                    textDecoration: 'none', transition: 'color 0.2s', fontFamily: FONT
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#E85C2C'}
                                onMouseLeave={e => e.currentTarget.style.color = '#444'}
                            >
                                About
                            </Link>
                        </>
                    )}
                    <button
                        onClick={() => navigate('/auth')}
                        style={{
                            background: 'linear-gradient(135deg, #E85C2C 0%, #FF3D3D 100%)', color: '#fff', border: 'none',
                            borderRadius: '50px', padding: '0.5rem 1.4rem',
                            fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: FONT,
                            boxShadow: '0 4px 12px rgba(232,92,44,0.25), inset 0 1px 1px rgba(255,255,255,0.4)',
                            transition: 'transform 0.15s, box-shadow 0.15s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(232,92,44,0.3), inset 0 1px 1px rgba(255,255,255,0.4)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(232,92,44,0.25), inset 0 1px 1px rgba(255,255,255,0.4)';
                        }}
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            {/* ── HERO SECTION ── */}
            <section
                onMouseMove={handleMouseMove}
                style={{
                    minHeight: '100dvh',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center',
                    paddingTop: isMobile ? '110px' : '150px',
                    paddingBottom: isMobile ? '3rem' : '5rem',
                    position: 'relative', overflow: 'hidden',
                }}>
                {/* Ambient glows */}
                {FEATURES.map((s, i) => (
                    <motion.div key={i}
                        animate={{
                            x: isMobile ? '-50%' : `calc(-50% + ${mousePos.x * -40 * (i + 1)}px)`,
                            y: isMobile ? '-50%' : `calc(-50% + ${mousePos.y * -40 * (i + 1)}px)`
                        }}
                        transition={{ type: "spring", stiffness: 100, damping: 30, mass: 0.5 }}
                        style={{
                            position: 'absolute',
                            top: isMobile ? '28%' : '45%',
                            left: isMobile ? '50%' : `${18 + i * 32}%`,
                            width: isMobile ? '340px' : '460px', height: isMobile ? '340px' : '460px',
                            borderRadius: '50%',
                            pointerEvents: 'none',
                            opacity: isMobile ? (i === activeSlide ? 1 : 0) : 1,
                        }}>
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `radial-gradient(circle, ${s.glow} 0%, transparent 68%)`, animation: `lp-glow ${5 + i}s ease-in-out ${i * 1.2}s infinite` }} />
                    </motion.div>
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
                    <MagneticButton className="magnetic-btn" style={{ display: 'block', margin: '0 auto' }}>
                        <button
                            onClick={() => navigate('/auth')}
                            style={{
                                background: '#E85C2C', color: '#fff', border: 'none',
                                borderRadius: '50px', padding: isMobile ? '0.95rem 2.2rem' : '1rem 2.75rem',
                                fontWeight: 700, fontSize: '1rem', cursor: 'pointer', fontFamily: FONT,
                                boxShadow: '0 12px 32px rgba(232,92,44,0.25)', letterSpacing: '-0.01em',
                                transition: 'transform 0.15s ease-out',

                            }}
                        >
                            Start for Free — No Card Needed
                        </button>
                    </MagneticButton>
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

                {/* Floating Mockup */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.8, ease: "easeOut" }}
                    style={{
                        marginTop: isMobile ? '1.5rem' : '3.5rem',
                        marginBottom: isMobile ? '1.5rem' : '4rem',
                        position: 'relative',
                        width: '100%',
                        maxWidth: '960px',
                        padding: '0 1.5rem',
                        zIndex: 2,
                        perspective: '1200px'
                    }}
                >
                    <motion.div
                        animate={{ y: [0, -15, 0] }}
                        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                        style={{
                            background: 'rgba(255, 255, 255, 0.7)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.8)',
                            borderRadius: '16px',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.08), 0 2px 10px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,1)',
                            overflow: 'hidden',
                            transform: 'rotateX(3deg) rotateY(0deg)',
                            transformStyle: 'preserve-3d',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Fake Mac Header */}
                        <div style={{ height: '32px', background: 'rgba(250, 250, 250, 0.9)', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '6px' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
                        </div>
                        {/* Fake App Body */}
                        <div style={{ display: 'flex', height: isMobile ? '280px' : '480px' }}>
                            {/* Fake Sidebar */}
                            {!isMobile && (
                                <div style={{ width: '22%', borderRight: '1px solid rgba(0,0,0,0.04)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(248, 250, 252, 0.5)' }}>
                                    <div style={{ height: 28, background: 'rgba(232,92,44,0.15)', borderRadius: 8, width: '80%', marginBottom: '1rem' }} />
                                    <div style={{ height: 14, background: 'rgba(0,0,0,0.04)', borderRadius: 4, width: '100%' }} />
                                    <div style={{ height: 14, background: 'rgba(0,0,0,0.04)', borderRadius: 4, width: '90%' }} />
                                    <div style={{ height: 14, background: 'rgba(0,0,0,0.04)', borderRadius: 4, width: '85%' }} />
                                    <div style={{ height: 14, background: 'rgba(0,0,0,0.04)', borderRadius: 4, width: '95%' }} />
                                </div>
                            )}
                            {/* Fake Main Content */}
                            <div style={{ flex: 1, padding: isMobile ? '1.5rem' : '2.5rem', display: 'flex', flexDirection: 'column', gap: isMobile ? '1rem' : '1.5rem', background: '#fff' }}>
                                {/* Fake Navbar */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                                    <div style={{ height: isMobile ? 24 : 32, background: 'rgba(0,0,0,0.04)', borderRadius: 8, width: '35%' }} />
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <div style={{ width: isMobile ? 28 : 36, height: isMobile ? 28 : 36, borderRadius: '50%', background: 'rgba(0,0,0,0.04)' }} />
                                        <div style={{ width: isMobile ? 60 : 90, height: isMobile ? 28 : 36, borderRadius: 16, background: '#E85C2C' }} />
                                    </div>
                                </div>
                                {/* Fake Cards Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? '0.75rem' : '1.5rem', flex: 1 }}>
                                    {[1, 2, 3].slice(0, isMobile ? 2 : 3).map(i => (
                                        <div key={i} style={{ background: 'rgba(248,250,252,0.8)', borderRadius: 16, border: '1px solid rgba(0,0,0,0.03)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <div style={{ height: isMobile ? '60px' : '120px', background: 'rgba(0,0,0,0.04)', borderRadius: 12 }} />
                                            <div style={{ height: 14, background: 'rgba(0,0,0,0.05)', borderRadius: 4, width: '85%' }} />
                                            <div style={{ height: 12, background: 'rgba(0,0,0,0.03)', borderRadius: 4, width: '45%' }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

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


            </section>

            {/* ── MARQUEE SECTION ── */}
            <section style={{ width: '100%', overflow: 'hidden', padding: isMobile ? '1.5rem 0 2.5rem' : '3rem 0', background: '#fdfdfd', borderTop: '1px solid rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.03)', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: isMobile ? '50px' : '150px', background: 'linear-gradient(to right, #fdfdfd, transparent)', zIndex: 10 }} />
                <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: isMobile ? '50px' : '150px', background: 'linear-gradient(to left, #fdfdfd, transparent)', zIndex: 10 }} />

                <div style={{ textAlign: 'center', marginBottom: isMobile ? '1.5rem' : '2rem', color: '#a1a1aa', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', fontFamily: FONT }}>
                    WORKS SEAMLESSLY WITH
                </div>
                <div style={{ display: 'flex', width: 'max-content', animation: 'lp-marquee 30s linear infinite' }}>
                    {[...Array(2)].map((_, arrayIndex) => (
                        <div key={arrayIndex} style={{ display: 'flex', gap: isMobile ? '2.5rem' : '4rem', paddingRight: isMobile ? '2.5rem' : '4rem', alignItems: 'center' }}>
                            {['Amazon', 'Flipkart', 'Myntra', 'Nykaa', 'Ajio', 'Blinkit', 'Zepto', 'Meesho'].map((store, i) => (
                                <span key={i} style={{ fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: 800, color: '#e2e8f0', fontFamily: FONT, letterSpacing: '-0.03em', textTransform: 'lowercase', transition: 'color 0.3s' }} onMouseEnter={e => e.currentTarget.style.color = '#cbd5e1'} onMouseLeave={e => e.currentTarget.style.color = '#e2e8f0'}>
                                    {store}
                                </span>
                            ))}
                        </div>
                    ))}
                </div>
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

                    <HowItWorksScroll isMobile={isMobile} />
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

                            <MagneticButton className="magnetic-btn" style={{ width: '100%', display: 'block' }}>
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
                                >
                                    Start for Free
                                </button>
                            </MagneticButton>

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
                    <div className="premium-glow-card" style={{
                        padding: isMobile ? '1.75rem' : '2.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 25px 60px rgba(232,92,44,0.15)',
                    }}>
                        <div className="ribbon-wrapper">
                            <div className="premium-ribbon">
                                Most Popular
                            </div>
                        </div>
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

                            <MagneticButton className="magnetic-btn" style={{ width: '100%', display: 'block' }}>
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
                                        boxShadow: '0 8px 24px rgba(232,92,44,0.25)',
                                    }}
                                >
                                    Upgrade Now
                                </button>
                            </MagneticButton>

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

            {/* ── AD BANNER — between FAQ and CTA ── */}
            <div style={{ padding: '0 2rem 1rem', maxWidth: '760px', margin: '0 auto' }}>
                <AdUnit
                    slot="6522849733"
                    format="auto"
                    style={{ minHeight: '90px', borderRadius: '16px' }}
                />
            </div>

            {/* ── CTA BANNER ── */}
            <section style={{ padding: isMobile ? '3rem 1.5rem 5rem' : '5rem 2rem 7rem', display: 'flex', justifyContent: 'center' }}>
                <div style={{
                    position: 'relative', overflow: 'hidden',
                    width: '100%', maxWidth: '1000px',
                    borderRadius: '32px',
                    background: '#FFF5F2',
                    border: '1px solid rgba(232,92,44,0.1)',
                    padding: isMobile ? '4rem 1.5rem' : '6rem 4rem',
                    textAlign: 'center',
                }}>
                    {/* Glowing Orbs for the CTA */}
                    <div style={{ position: 'absolute', top: '-50%', left: '-20%', width: '60%', height: '150%', background: 'radial-gradient(ellipse at center, rgba(232,92,44,0.12) 0%, transparent 70%)', transform: 'rotate(-20deg)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: '-50%', right: '-20%', width: '60%', height: '150%', background: 'radial-gradient(ellipse at center, rgba(255,61,61,0.12) 0%, transparent 70%)', transform: 'rotate(20deg)', pointerEvents: 'none' }} />

                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <h2 style={{ fontWeight: 900, fontSize: isMobile ? '2.2rem' : 'clamp(2.5rem, 4vw, 3.5rem)', color: '#111', margin: '0 0 1.25rem', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                            Ready to build your <span style={{ background: 'linear-gradient(135deg, #E85C2C 0%, #FF3D3D 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>dream wishlist?</span>
                        </h2>
                        <p style={{ color: '#555', fontSize: '1.1rem', margin: '0 auto 2.5rem', lineHeight: 1.7, maxWidth: '500px' }}>
                            Join thousands of smart shoppers who use WishFlow to save, organize, and track products they love.
                        </p>

                        <div style={{ position: 'relative', display: 'inline-block', margin: '0 auto' }}>
                            <MagneticButton className="magnetic-btn">
                                <button
                                    onClick={() => navigate('/auth')}
                                    style={{
                                        background: '#E85C2C', color: '#fff', border: 'none',
                                        borderRadius: '50px', padding: '1rem 2.75rem',
                                        fontWeight: 700, fontSize: '1rem', cursor: 'pointer', fontFamily: FONT,
                                        boxShadow: '0 12px 32px rgba(232,92,44,0.25)',
                                        transition: 'transform 0.15s ease-out',
                                    }}
                                >
                                    Start for Free
                                </button>
                            </MagneticButton>
                        </div>
                    </div>
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
                        { label: 'Blog', to: '/blog' },
                        { label: 'About Us', to: '/about' },
                        { label: 'Contact Us', to: '/contact' },
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
