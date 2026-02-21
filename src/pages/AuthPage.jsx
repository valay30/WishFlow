import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ChevronLeft, ShoppingBag } from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';

/* ─────────────────────────────────────────
   Design tokens (module-level constants)
───────────────────────────────────────── */
const BLUE = '#10367D';
const BLUE_DARK = '#0A2665';
const BG_GRAD = 'linear-gradient(160deg, #051A44 0%, #0A2665 55%, #10367D 100%)';

const INPUT_ST = {
    width: '100%', padding: '0.875rem 1rem',
    border: '1.5px solid #E8ECF4', borderRadius: '10px',
    fontSize: '0.95rem', fontFamily: 'inherit',
    color: '#111', background: '#fff', outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
};
const LABEL_ST = {
    fontSize: '0.78rem', fontWeight: 600,
    color: '#888', display: 'block', marginBottom: '0.35rem',
};

/* ─────────────────────────────────────────
   Floating Bubbles
───────────────────────────────────────── */
function Bubbles() {
    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: '-60px', left: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #2d3cad, #0f1560)', opacity: 0.92 }} />
            <div style={{ position: 'absolute', top: '-20px', right: '20px', width: '140px', height: '140px', borderRadius: '50%', background: 'radial-gradient(circle at 40% 30%, rgba(255,255,255,0.98), rgba(180,195,255,0.65))', boxShadow: 'inset -6px -6px 20px rgba(100,130,255,0.3)' }} />
            <div style={{ position: 'absolute', top: '100px', left: '30px', width: '95px', height: '95px', borderRadius: '50%', background: 'radial-gradient(circle at 40% 35%, #7b94f7, #3652e8)', opacity: 0.85 }} />
            <div style={{ position: 'absolute', bottom: '-50px', left: '-30px', width: '210px', height: '210px', borderRadius: '50%', background: 'radial-gradient(circle at 40% 35%, #2540d0, #0b1150)', opacity: 0.95 }} />
            <div style={{ position: 'absolute', top: '55px', right: '-15px', width: '75px', height: '75px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.98), rgba(160,185,255,0.72))', boxShadow: 'inset -4px -4px 12px rgba(80,120,255,0.3)' }} />
            <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%' }} viewBox="0 0 400 140" preserveAspectRatio="none">
                <path d="M0,70 C100,20 300,120 400,60 L400,140 L0,140 Z" fill="rgba(255,255,255,0.07)" />
                <path d="M0,90 C80,50 250,130 400,80 L400,140 L0,140 Z" fill="rgba(255,255,255,0.05)" />
            </svg>
        </div>
    );
}

/* ─────────────────────────────────────────
   Social Buttons Row
───────────────────────────────────────── */
function SocialRow() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.9rem', margin: '0.5rem 0' }}>
            {[
                { label: 'Facebook', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95C18.05 21.45 22 17.19 22 12z" /></svg> },
                { label: 'Twitter', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DA1F2"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" /></svg> },
                { label: 'Google', svg: <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg> },
                { label: 'Apple', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="#000"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.27.07 2.16.74 2.9.8 1.1-.19 2.16-.89 3.34-.84 1.42.06 2.49.6 3.18 1.53-2.93 1.67-2.4 5.6.48 6.84-.57 1.58-1.32 3.15-1.9 4.53zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg> },
            ].map(s => (
                <button key={s.label} title={s.label}
                    style={{ width: '46px', height: '46px', borderRadius: '50%', border: '1.5px solid #E8ECF4', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'box-shadow 0.2s, transform 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(16,54,125,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                    {s.svg}
                </button>
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────
   Hero Panel — defined OUTSIDE AuthPage
   so it never gets recreated on state change
───────────────────────────────────────── */
function HeroPanel({ compact }) {
    return (
        <div style={{
            background: BG_GRAD, position: 'relative', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            alignItems: 'center',
            padding: compact ? '2rem 2.5rem' : '3rem 2.5rem',
            minHeight: compact ? '100%' : 'auto',
            textAlign: 'center',
            height: '100%'
        }}>
            <Bubbles />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: compact ? '2.5rem' : '1.5rem' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                        <ShoppingBag size={28} color="#fff" />
                    </div>
                    {compact && <span style={{ color: '#fff', fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>WishFlow</span>}
                </div>

                <h1 style={{ fontSize: compact ? 'clamp(1.75rem, 2.5vw, 2.5rem)' : '2.4rem', fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: '1rem' }}>
                    Welcome Back!
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.97rem', lineHeight: 1.65, maxWidth: '320px' }}>
                    Your personal space to track and manage everything you love and want to buy.
                </p>

                {compact && (
                    <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem', alignItems: 'center' }}>
                        {['Save products from any store', 'Organize by category', 'Access from any device'].map(feat => (
                            <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', fontWeight: 500 }}>{feat}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   Form Content — defined OUTSIDE AuthPage
   receives all state/handlers as props
───────────────────────────────────────── */
function FormContent({
    screen, name, setName, email, setEmail, password, setPassword,
    showPass, setShowPass, remember, setRemember, agree, setAgree,
    error, loading, handleSubmit, go,
}) {
    const focusSt = (e) => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 4px rgba(16,54,125,0.1)'; };
    const blurSt = (e) => { e.target.style.borderColor = '#E8ECF4'; e.target.style.boxShadow = 'none'; };

    return (
        <div>
            <h2 style={{ fontSize: 'clamp(1.35rem, 2vw, 1.75rem)', fontWeight: 800, color: BLUE, marginBottom: '0.3rem' }}>
                {screen === 'signup' ? 'Get Started' : 'Welcome back'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#9EA6B7', marginBottom: '1.6rem' }}>
                {screen === 'signup' ? 'Create your account below.' : 'Login to access your WishFlow.'}
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {screen === 'signup' && (
                    <div>
                        <label style={LABEL_ST}>Full Name</label>
                        <input
                            style={INPUT_ST} placeholder="Enter Full Name"
                            value={name} onChange={e => setName(e.target.value)}
                            onFocus={focusSt} onBlur={blurSt}
                        />
                    </div>
                )}

                <div>
                    <label style={LABEL_ST}>Email</label>
                    <input
                        style={INPUT_ST} type="email"
                        placeholder={screen === 'login' ? 'your@email.com' : 'Enter Email'}
                        value={email} onChange={e => setEmail(e.target.value)}
                        onFocus={focusSt} onBlur={blurSt}
                    />
                </div>

                <div>
                    <label style={LABEL_ST}>Password</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            style={{ ...INPUT_ST, paddingRight: '3rem' }}
                            type={showPass ? 'text' : 'password'}
                            placeholder="Enter Password"
                            value={password} onChange={e => setPassword(e.target.value)}
                            onFocus={focusSt} onBlur={blurSt}
                        />
                        <button type="button" onClick={() => setShowPass(v => !v)}
                            style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {screen === 'login' ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.85rem', color: '#5A5F7A' }}>
                            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ accentColor: BLUE, width: '15px', height: '15px' }} />
                            Remember me
                        </label>
                        <button type="button" style={{ background: 'none', border: 'none', color: BLUE, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                            Forgot password?
                        </button>
                    </div>
                ) : (
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#5A5F7A' }}>
                        <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} style={{ accentColor: BLUE, width: '15px', height: '15px', marginTop: '2px', flexShrink: 0 }} />
                        <span>I agree to the processing of <span style={{ color: BLUE, fontWeight: 600 }}>Personal data</span></span>
                    </label>
                )}

                {error && (
                    <div style={{ background: '#fff0f3', color: '#c0143c', padding: '0.7rem 1rem', borderRadius: '10px', fontSize: '0.83rem', fontWeight: 600, border: '1px solid #ffc7d4' }}>
                        ⚠️ {error}
                    </div>
                )}

                <button type="submit" disabled={loading} style={{
                    width: '100%', padding: '1rem',
                    background: loading ? '#8fa0f5' : `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`,
                    color: '#fff', border: 'none', borderRadius: '12px',
                    fontWeight: 700, fontSize: '1rem', fontFamily: 'inherit',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : '0 6px 20px rgba(16,54,125,0.38)',
                    transition: 'opacity 0.2s, transform 0.1s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    {loading
                        ? <><span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> {screen === 'login' ? 'Signing in...' : 'Creating account...'}</>
                        : screen === 'login' ? 'Sign in' : 'Sign up'
                    }
                </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#9EA6B7', margin: '1.25rem 0 0.75rem' }}>Sign in with</p>
            <SocialRow />
            <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: '#9EA6B7' }}>
                {screen === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button onClick={() => go(screen === 'login' ? 'signup' : 'login')}
                    style={{ background: 'none', border: 'none', color: BLUE, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {screen === 'login' ? 'Sign up' : 'Sign in'}
                </button>
            </p>
        </div>
    );
}

/* ══════════════════════════════════════════
   MAIN AUTH PAGE  — only holds state
══════════════════════════════════════════ */
export default function AuthPage() {
    const [screen, setScreen] = useState('welcome');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [remember, setRemember] = useState(false);
    const [agree, setAgree] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, signup } = useAuth();
    const navigate = useNavigate();
    const { isMobile, isTablet, isDesktop } = useResponsive();

    const reset = () => { setName(''); setEmail(''); setPassword(''); setError(''); setAgree(false); setRemember(false); };
    const go = (s) => { reset(); setScreen(s); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!email || !password) { setError('Please fill in all fields.'); return; }
        if (screen === 'signup' && !name.trim()) { setError('Please enter your full name.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (screen === 'signup' && !agree) { setError('Please agree to the Personal data processing.'); return; }

        setLoading(true);
        await new Promise(r => setTimeout(r, 400));
        const result = screen === 'login'
            ? await login({ email, password })
            : await signup({ name: name.trim(), email, password });
        setLoading(false);
        if (result.success) navigate('/');
        else setError(result.error);
    };

    /* shared form props bundle */
    const formProps = { screen, name, setName, email, setEmail, password, setPassword, showPass, setShowPass, remember, setRemember, agree, setAgree, error, loading, handleSubmit, go };

    /* ── WELCOME ── */
    if (screen === 'welcome') {
        if (isDesktop || isTablet) return (
            <div style={{ minHeight: '100vh', display: 'flex', fontFamily: '"Outfit", sans-serif' }}>
                <div style={{ width: isDesktop ? '55%' : '48%', flexShrink: 0 }}>
                    <HeroPanel compact />
                </div>
                <div style={{ flex: 1, background: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2.5rem' }}>
                    <div style={{ maxWidth: '380px', width: '100%' }}>
                        <h2 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 900, color: BLUE, marginBottom: '0.5rem' }}>Your Personal WishFlow</h2>
                        <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '2.5rem', lineHeight: 1.65 }}>
                            Save products you love, track prices, and share with friends — all in one place.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                            <button onClick={() => go('signup')} style={{ width: '100%', padding: '1rem', background: BLUE, color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '1rem', fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 6px 20px rgba(16, 54, 125,0.35)' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >Create Account</button>
                            <button onClick={() => go('login')} style={{ width: '100%', padding: '1rem', background: 'transparent', color: BLUE, border: `2px solid ${BLUE}`, borderRadius: '12px', fontWeight: 700, fontSize: '1rem', fontFamily: 'inherit', cursor: 'pointer' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(16, 54, 125,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >Sign In</button>
                        </div>
                    </div>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );

        /* Mobile welcome */
        return (
            <div style={{ minHeight: '100vh', background: BG_GRAD, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', fontFamily: '"Outfit", sans-serif', padding: '2rem 1.5rem' }}>
                <Bubbles />
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                        <ShoppingBag size={30} color="#fff" />
                    </div>
                    <h1 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: '0.85rem' }}>Welcome Back!</h1>
                    <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                        Enter your personal details to<br />access your WishFlow account
                    </p>
                </div>
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '1rem', width: '100%', maxWidth: '380px' }}>
                    <button onClick={() => go('login')} style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: '2px solid rgba(255,255,255,0.6)', background: 'transparent', color: '#fff', fontWeight: 700, fontSize: '1rem', fontFamily: 'inherit', cursor: 'pointer' }}>Sign in</button>
                    <button onClick={() => go('signup')} style={{ flex: 1, padding: '1rem', borderRadius: '12px', background: '#fff', color: BLUE, fontWeight: 700, fontSize: '1rem', fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: 'none' }}>Sign up</button>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    /* ── FORM SCREENS (login / signup) ── */

    /* Desktop / Tablet: two-panel */
    if (isDesktop || isTablet) return (
        <div style={{ minHeight: '100vh', display: 'flex', fontFamily: '"Outfit", sans-serif' }}>
            <div style={{ width: isDesktop ? '44%' : '40%', flexShrink: 0 }}>
                <HeroPanel compact />
            </div>
            <div style={{ flex: 1, background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem', overflowY: 'auto' }}>
                <div style={{ width: '100%', maxWidth: '460px' }}>
                    <button onClick={() => go('welcome')} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', color: '#666', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', marginBottom: '2rem', fontFamily: 'inherit', padding: 0 }}>
                        <ChevronLeft size={18} /> Back
                    </button>
                    <FormContent {...formProps} />
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    /* Mobile: blue hero + slide-up white card */
    return (
        <div style={{ minHeight: '100vh', background: BG_GRAD, display: 'flex', flexDirection: 'column', fontFamily: '"Outfit", sans-serif', position: 'relative' }}>
            <div style={{ position: 'relative', height: '230px', flexShrink: 0 }}>
                <Bubbles />
                <button onClick={() => go('welcome')} style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', zIndex: 10, display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: '8px', padding: '0.4rem 0.9rem', color: '#fff', fontWeight: 600, fontSize: '0.9rem', fontFamily: 'inherit', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                    <ChevronLeft size={16} /> Back
                </button>
            </div>
            <div style={{ flex: 1, background: '#fff', borderRadius: '28px 28px 0 0', marginTop: '-28px', padding: '2rem 1.5rem 3rem', position: 'relative', zIndex: 5, boxShadow: '0 -4px 30px rgba(0,0,0,0.5)', overflowY: 'auto' }}>
                <FormContent {...formProps} />
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
