import { useState, useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';
import { ShoppingBag, Star, Sparkles, ArrowRight } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const SLIDES = [
    {
        id: 'track',
        title: 'Track Everything\nYou Love',
        body: 'Save products from any store or website. Keep all your wishes in one beautiful, organized place.',
        icon: ShoppingBag,
        color: '#3b82f6', // Blue
        gradient: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.01) 100%)',
    },
    {
        id: 'organize',
        title: 'Organize &\nDiscover',
        body: 'Group your wishes into custom collections and categories. Find exactly what you need in seconds.',
        icon: Star,
        color: '#8b5cf6', // Purple
        gradient: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0.01) 100%)',
    },
    {
        id: 'premium',
        title: 'Unlimited\nWishes Await',
        body: 'Upgrade to Premium for just ₹100. Unlock unlimited items, dark mode, and collection sharing.',
        icon: Sparkles,
        color: '#10b981', // Green
        gradient: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.01) 100%)',
    },
];

function DesktopSlide({ slide, index, setStep, isLast, onComplete, currency }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { margin: "-40% 0px -40% 0px" });
    
    useEffect(() => {
        if (isInView) {
            setStep(index);
        }
    }, [isInView, index, setStep]);

    const bodyText = slide.id === 'premium' ? `Upgrade to Premium for just ${new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 0 }).format(100)}. Unlock unlimited items, dark mode, and collection sharing.` : slide.body;

    return (
        <div ref={ref} className="desktop-slide">
            <h2 style={{
                margin: 0,
                fontSize: '2.5rem',
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.15,
                whiteSpace: 'pre-line',
                letterSpacing: '-0.02em',
                marginBottom: '1rem'
            }}>
                {slide.title}
            </h2>
            <p style={{
                margin: 0,
                fontSize: '1.1rem',
                lineHeight: 1.6,
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: 400,
                marginBottom: '2rem'
            }}>
                {bodyText}
            </p>
            {isLast && (
                <button
                    onClick={onComplete}
                    className="get-started-btn"
                    style={{
                        background: slide.color,
                        boxShadow: `0 8px 24px ${slide.color}40`,
                    }}
                >
                    Get Started
                    <ArrowRight size={20} />
                </button>
            )}
        </div>
    );
}

export default function OnboardingFlow({ onComplete }) {
    const { currency } = useSettings();
    const [step, setStep] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Override body text for the premium slide with dynamic currency
    const slide = { ...SLIDES[step] };
    if (slide.id === 'premium') {
        slide.body = `Upgrade to Premium for just ${new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 0 }).format(100)}. Unlock unlimited items, dark mode, and collection sharing.`;
    }

    useEffect(() => {
        setMounted(true);
    }, []);


    const isLast = step === SLIDES.length - 1;
    const Icon = slide.icon;

    const goNext = () => {
        if (isAnimating) return;
        if (isLast) {
            onComplete();
            return;
        }
        setIsAnimating(true);
        setTimeout(() => {
            setStep((s) => s + 1);
            setIsAnimating(false);
        }, 300); // matches animation duration
    };

    if (!mounted) return null;

    return (
        <div className="onboarding-overlay">
            <div className="onboarding-container">
                {/* Top/Left area - Visuals */}
                <div className="onboarding-visuals">
                    {/* Dynamic Background Gradient */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: slide.gradient,
                        transition: 'background 0.5s ease-in-out',
                    }} />

                    {/* Grid pattern overlay for texture */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                        opacity: 0.5,
                    }} />

                    {/* Glowing Icon Container */}
                    <div 
                        key={slide.id} // Forces re-render for animation
                        style={{
                            position: 'relative',
                            zIndex: 2,
                            width: '160px',
                            height: '160px',
                            borderRadius: '40px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(12px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 0 80px ${slide.color}40`, // glow effect
                            animation: 'scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    >
                        <Icon size={72} color={slide.color} strokeWidth={1.5} />
                    </div>
                    
                    {/* Skip Button (Mobile only, desktop goes to content area) */}
                    <div className="skip-button-mobile">
                        {!isLast && (
                            <button onClick={onComplete} className="skip-btn">Skip</button>
                        )}
                    </div>
                </div>

                {/* Bottom/Right area - Content Card */}
                <div className="onboarding-content">
                    {/* Skip Button (Desktop only) */}
                    <div className="skip-button-desktop">
                        {!isLast && (
                            <button onClick={onComplete} className="skip-btn">Skip</button>
                        )}
                    </div>
                
                    {/* MOBILE CONTENT (Single Slide) */}
                    <div className="onboarding-content-mobile">
                        {/* Text Content */}
                        <div 
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                opacity: isAnimating ? 0 : 1,
                                transform: isAnimating ? 'translateY(10px)' : 'translateY(0)',
                                transition: 'opacity 0.3s ease, transform 0.3s ease',
                            }}
                        >
                            <h2 style={{
                                margin: 0,
                                fontSize: '2.25rem',
                                fontWeight: 700,
                                color: '#ffffff',
                                lineHeight: 1.15,
                                whiteSpace: 'pre-line',
                                letterSpacing: '-0.02em',
                            }}>
                                {slide.title}
                            </h2>
                            <p style={{
                                margin: 0,
                                fontSize: '1rem',
                                lineHeight: 1.6,
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontWeight: 400,
                            }}>
                                {slide.body}
                            </p>
                        </div>

                        {/* Controls (Dots + Button) */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '1rem',
                        }}>
                            {/* Progress Dots */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {SLIDES.map((_, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            height: '6px',
                                            borderRadius: '3px',
                                            background: i === step ? slide.color : 'rgba(255, 255, 255, 0.15)',
                                            width: i === step ? '24px' : '6px',
                                            transition: 'all 0.3s ease',
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Next Button */}
                            <button
                                onClick={goNext}
                                className="next-btn-mobile"
                                style={{
                                    background: slide.color,
                                    boxShadow: `0 8px 24px ${slide.color}40`,
                                }}
                            >
                                {isLast ? 'Get Started' : 'Next'}
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>

                    {/* DESKTOP CONTENT (Scrollable) */}
                    <div className="onboarding-content-desktop">
                        <div className="desktop-scroll-container">
                            <div className="desktop-scroll-padding-top"></div>
                            {SLIDES.map((s, i) => (
                                <DesktopSlide 
                                    key={s.id} 
                                    slide={s} 
                                    index={i} 
                                    setStep={setStep} 
                                    isLast={i === SLIDES.length - 1} 
                                    onComplete={onComplete}
                                    currency={currency}
                                />
                            ))}
                            <div className="desktop-scroll-padding-bottom"></div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .onboarding-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    background-color: #000;
                    display: flex;
                    font-family: 'Outfit', sans-serif;
                }
                .onboarding-container {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    height: 100%;
                    position: relative;
                }
                .onboarding-visuals {
                    flex: 1;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
                .onboarding-content {
                    position: relative;
                    z-index: 10;
                    background: #111;
                    border-top-left-radius: 32px;
                    border-top-right-radius: 32px;
                    padding: 2.5rem 1.5rem calc(2rem + env(safe-area-inset-bottom));
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    border-top: 1px solid rgba(255,255,255,0.05);
                    box-shadow: 0 -20px 40px rgba(0,0,0,0.5);
                }
                .onboarding-content-mobile {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    gap: 2rem;
                }
                .onboarding-content-desktop {
                    display: none;
                }
                .next-btn-mobile {
                    color: #ffffff;
                    border: none;
                    padding: 16px 32px;
                    border-radius: 100px;
                    font-size: 1rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .next-btn-mobile:hover {
                    transform: translateY(-2px);
                }
                .get-started-btn {
                    color: #ffffff;
                    border: none;
                    padding: 16px 32px;
                    border-radius: 100px;
                    font-size: 1rem;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    width: fit-content;
                }
                .get-started-btn:hover {
                    transform: translateY(-2px);
                }
                .desktop-slide {
                    min-height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 4rem 0;
                    scroll-snap-align: center;
                }
                .desktop-scroll-container {
                    height: 100%;
                    overflow-y: auto;
                    scroll-snap-type: y mandatory;
                    scroll-behavior: smooth;
                    padding-right: 2rem;
                }
                .desktop-scroll-container::-webkit-scrollbar {
                    width: 6px;
                }
                .desktop-scroll-container::-webkit-scrollbar-track {
                    background: rgba(255,255,255,0.05);
                    border-radius: 4px;
                }
                .desktop-scroll-container::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.2);
                    border-radius: 4px;
                }
                .desktop-scroll-padding-top, .desktop-scroll-padding-bottom {
                    height: 10vh;
                    scroll-snap-align: none;
                }
                .skip-btn {
                    background: rgba(255,255,255,0.1);
                    border: none;
                    color: rgba(255,255,255,0.7);
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    backdrop-filter: blur(8px);
                    transition: all 0.2s;
                    font-family: inherit;
                }
                .skip-btn:hover {
                    background: rgba(255,255,255,0.15);
                    color: #fff;
                }
                .skip-button-mobile {
                    position: absolute;
                    top: max(1.5rem, env(safe-area-inset-top));
                    right: 1.5rem;
                    z-index: 10;
                }
                .skip-button-desktop {
                    display: none;
                }
                
                @media (min-width: 768px) {
                    .onboarding-overlay {
                        align-items: center;
                        justify-content: center;
                        padding: 2rem;
                        background-color: rgba(0,0,0,0.7);
                        backdrop-filter: blur(12px);
                    }
                    .onboarding-container {
                        flex-direction: row;
                        max-width: 1000px;
                        height: 600px;
                        max-height: 90vh;
                        border-radius: 24px;
                        overflow: hidden;
                        box-shadow: 0 24px 80px rgba(0,0,0,0.6);
                        border: 1px solid rgba(255,255,255,0.1);
                    }
                    .onboarding-content {
                        width: 500px;
                        border-radius: 0;
                        border-top: none;
                        border-left: 1px solid rgba(255,255,255,0.05);
                        padding: 0;
                        box-shadow: none;
                        display: block;
                    }
                    .onboarding-content-mobile {
                        display: none !important;
                    }
                    .onboarding-content-desktop {
                        display: block;
                        height: 100%;
                        padding-left: 3.5rem;
                        padding-top: 4rem;
                        padding-bottom: 4rem;
                    }
                    .skip-button-mobile {
                        display: none;
                    }
                    .skip-button-desktop {
                        display: block;
                        position: absolute;
                        top: 2rem;
                        right: 2rem;
                    }
                }

                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
