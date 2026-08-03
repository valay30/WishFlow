import { useState, useEffect } from 'react';
import { ShoppingBag, Star, Sparkles, ArrowRight } from 'lucide-react';

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
        body: 'Upgrade to Premium for just ₹100. Unlock unlimited items, dark mode, and priority support.',
        icon: Sparkles,
        color: '#10b981', // Green
        gradient: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.01) 100%)',
    },
];

export default function OnboardingFlow({ onComplete }) {
    const [step, setStep] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const slide = SLIDES[step];
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
                        style={{
                            background: slide.color,
                            color: '#ffffff',
                            border: 'none',
                            padding: '16px 32px',
                            borderRadius: '100px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: `0 8px 24px ${slide.color}40`,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = `0 12px 32px ${slide.color}60`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = `0 8px 24px ${slide.color}40`;
                        }}
                    >
                        {isLast ? 'Get Started' : 'Next'}
                        <ArrowRight size={20} />
                    </button>
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
                    gap: 2rem;
                    border-top: 1px solid rgba(255,255,255,0.05);
                    box-shadow: 0 -20px 40px rgba(0,0,0,0.5);
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
                        width: 450px;
                        border-radius: 0;
                        border-top: none;
                        border-left: 1px solid rgba(255,255,255,0.05);
                        padding: 4rem 3.5rem;
                        box-shadow: none;
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
