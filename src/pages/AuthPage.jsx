import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Eye, EyeOff } from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';

/* ─────────────────────────────────────────
   Design tokens & Helpers
───────────────────────────────────────── */
function useDisableAutoAds() {
    useEffect(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).pauseAdRequests = 1;
        } catch (e) { /* AdSense not loaded yet */ }
        return () => {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).pauseAdRequests = 0;
            } catch (e) { /* ignore */ }
        };
    }, []);
}

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

/* ─────────────────────────────────────────
   UI Components
───────────────────────────────────────── */
const Input = ({ style, ...props }) => (
    <input
        style={{
            width: '100%',
            background: '#F3F4F6',
            border: 'none',
            borderRadius: '50px',
            padding: '1.1rem 1.5rem',
            fontSize: '0.95rem',
            color: '#333',
            outline: 'none',
            fontFamily: 'inherit',
            ...style
        }}
        {...props}
    />
);

const IconButton = ({ children, ...props }) => (
    <button
        type="button"
        style={{
            background: '#F3F4F6',
            border: 'none',
            borderRadius: '50px',
            width: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0
        }}
        {...props}
    >
        {children}
    </button>
);

const PrimaryButton = ({ children, loading, ...props }) => (
    <button
        style={{
            width: '100%',
            padding: '1.1rem',
            background: '#000000',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '50px',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            fontFamily: 'inherit',
            marginTop: '1.25rem',
            transition: 'transform 0.1s'
        }}
        {...props}
        onMouseEnter={e => !loading && (e.currentTarget.style.transform = 'translateY(-1px)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
    >
        {loading ? 'Processing...' : children}
    </button>
);

const GoogleButton = ({ onClick }) => (
    <button type="button" onClick={onClick} style={{
        width: '100%',
        padding: '1rem',
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        fontSize: '0.95rem',
        fontWeight: 500,
        color: '#333',
        cursor: 'pointer',
        fontFamily: 'inherit'
    }}>
        <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign in with Google
    </button>
);


/* ─────────────────────────────────────────
   Main AuthPage
───────────────────────────────────────── */
export default function AuthPage() {
    useDisableAutoAds();

    const { isDesktop, isTablet } = useResponsive();
    const isLargeScreen = isDesktop || isTablet;

    const [screen, setScreen] = useState('login'); // 'login', 'signup', 'forgot', 'reset'

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [forgotSent, setForgotSent] = useState(false);
    const [resetConfirm, setResetConfirm] = useState('');
    const [resetSuccess, setResetSuccess] = useState(false);

    const { login, signup, resetPassword, updatePassword, recoveryMode, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (recoveryMode) setScreen('reset');
    }, [recoveryMode]);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        const result = await signInWithGoogle();
        if (!result.success) {
            setLoading(false);
            setError(result.error);
        }
    };

    const go = (s) => {
        setError('');
        setForgotSent(false);
        setResetSuccess(false);
        setScreen(s);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (screen === 'forgot') {
            if (!email.trim()) return setError('Please enter your email.');
            setLoading(true);
            const res = await resetPassword(email.trim());
            setLoading(false);
            if (res.success) setForgotSent(true);
            else setError(res.error);
            return;
        }

        if (screen === 'reset') {
            if (password.length < 8) return setError('Password must be at least 8 characters.');
            if (password !== resetConfirm) return setError('Passwords do not match.');
            setLoading(true);
            const res = await updatePassword(password);
            setLoading(false);
            if (res.success) {
                setResetSuccess(true);
                setTimeout(() => navigate('/home'), 2500);
            } else {
                setError(res.error);
            }
            return;
        }

        if (!email || !password) return setError('Please fill in all fields.');
        if (screen === 'signup' && (!firstName.trim() || !lastName.trim())) return setError('Please enter your full name.');
        if (password.length < 6) return setError('Password must be at least 6 characters.');

        setLoading(true);
        await new Promise(r => setTimeout(r, 400));

        const result = screen === 'login'
            ? await login({ email, password })
            : await signup({ name: `${firstName.trim()} ${lastName.trim()}`, email, password });

        setLoading(false);

        if (result.success) navigate('/home');
        else setError(result.error);
    };

    const titleText = screen === 'signup' ? <>Create your<br />account</> :
        screen === 'forgot' ? <>Reset<br />Password</> :
            screen === 'reset' ? <>New<br />Password</> :
                'Login Here';

    const renderForm = () => (
        <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column' }}>

            {screen === 'login' || screen === 'signup' ? (
                <>
                    <GoogleButton onClick={handleGoogleSignIn} />
                    <div style={{ textAlign: 'center', color: '#6B7280', fontSize: '0.85rem', margin: '1rem 0' }}>or</div>
                </>
            ) : null}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                {screen === 'signup' && (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Input placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                        <Input placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
                    </div>
                )}

                {screen !== 'reset' && (
                    <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        autoFocus={screen === 'forgot'}
                    />
                )}

                {(screen === 'login' || screen === 'signup' || screen === 'reset') && (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Input
                            style={{ flex: 1 }}
                            type={showPass ? 'text' : 'password'}
                            placeholder={screen === 'reset' ? 'New Password' : 'Password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        <IconButton onClick={() => setShowPass(!showPass)}>
                            {showPass ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
                        </IconButton>
                    </div>
                )}

                {screen === 'reset' && (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Input
                            style={{ flex: 1 }}
                            type={showPass ? 'text' : 'password'}
                            placeholder="Confirm Password"
                            value={resetConfirm}
                            onChange={e => setResetConfirm(e.target.value)}
                        />
                        <div style={{ width: '56px', flexShrink: 0 }} />
                    </div>
                )}

                {error && (
                    <div style={{ color: '#E97451', fontSize: '0.85rem', textAlign: 'center', fontWeight: 500, marginTop: '0.25rem' }}>
                        {error}
                    </div>
                )}

                {forgotSent && screen === 'forgot' && (
                    <div style={{ color: '#6BC492', fontSize: '0.85rem', textAlign: 'center', fontWeight: 500, marginTop: '0.25rem' }}>
                        Reset link sent! Check your email.
                    </div>
                )}

                {resetSuccess && screen === 'reset' && (
                    <div style={{ color: '#6BC492', fontSize: '0.85rem', textAlign: 'center', fontWeight: 500, marginTop: '0.25rem' }}>
                        Password updated successfully! Redirecting...
                    </div>
                )}

                <PrimaryButton type="submit" loading={loading}>
                    {screen === 'signup' ? 'Create account' :
                        screen === 'forgot' ? 'Send Link' :
                            screen === 'reset' ? 'Update Password' :
                                'Log In'}
                </PrimaryButton>
            </form>

            {/* Footer Links */}
            {screen === 'login' && (
                <div style={{ marginTop: '1.25rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#88909D' }}>
                        <button onClick={() => go('forgot')} style={{ background: 'none', border: 'none', padding: 0, color: '#4B5563', fontWeight: 500, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}>Forgot password?</button>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#111', fontWeight: 600 }}>
                        New here? <button onClick={() => go('signup')} style={{ background: 'none', border: 'none', padding: 0, color: '#111', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}>Create an account</button>
                    </div>
                </div>
            )}

            {screen === 'signup' && (
                <div style={{ marginTop: '1.25rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#88909D', lineHeight: 1.5 }}>
                        Signing up for a WishFlow account means you<br />agree to the <Link to="/privacy" style={{ color: '#4B5563', fontWeight: 600, textDecoration: 'underline' }}>Privacy Policy</Link> and <Link to="/terms" style={{ color: '#4B5563', fontWeight: 600, textDecoration: 'underline' }}>Terms of Service</Link>.
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#111', fontWeight: 600 }}>
                        Have an account? <button onClick={() => go('login')} style={{ background: 'none', border: 'none', padding: 0, color: '#111', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}>Log in here</button>
                    </div>
                </div>
            )}

            {screen === 'forgot' && (
                <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: '#111', fontWeight: 600 }}>
                        Remembered it? <button onClick={() => go('login')} style={{ background: 'none', border: 'none', padding: 0, color: '#111', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}>Log in here</button>
                    </div>
                </div>
            )}
        </div>
    );

    /* ── Desktop Layout ── */
    if (isLargeScreen) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Outfit", sans-serif' }}>
                <div style={{
                    flex: '1.2', // Gives slightly more space to the hero side on desktop
                    background: '#E97451',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.2, backgroundImage: NOISE_SVG, mixBlendMode: 'overlay', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: '#D9B862' }} />
                    <div style={{ position: 'absolute', bottom: '-30%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: '#6BC492' }} />

                    <h1 style={{ position: 'relative', zIndex: 1, color: 'white', fontSize: '3.5rem', fontWeight: 800, textAlign: 'center', lineHeight: 1.15 }}>
                        {titleText}
                    </h1>
                </div>

                <div style={{
                    flex: '1',
                    background: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4rem 2rem'
                }}>
                    {renderForm()}
                </div>
            </div>
        );
    }

    /* ── Mobile Layout ── */
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            fontFamily: '"Outfit", sans-serif'
        }}>
            <div style={{
                position: 'relative',
                height: '220px',
                background: '#E97451',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingBottom: '20px'
            }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.2, backgroundImage: NOISE_SVG, mixBlendMode: 'overlay', pointerEvents: 'none' }} />

                <div style={{
                    position: 'absolute',
                    top: '-60px',
                    left: '-50px',
                    width: '180px',
                    height: '180px',
                    borderRadius: '50%',
                    background: '#D9B862'
                }} />

                <div style={{
                    position: 'absolute',
                    bottom: '-100px',
                    right: '-60px',
                    width: '240px',
                    height: '240px',
                    borderRadius: '50%',
                    background: '#6BC492'
                }} />

                <h1 style={{
                    position: 'relative',
                    zIndex: 1,
                    color: 'white',
                    fontSize: '2.1rem',
                    fontWeight: 800,
                    textAlign: 'center',
                    lineHeight: 1.15
                }}>
                    {titleText}
                </h1>
            </div>

            <div style={{
                flex: 1,
                background: '#FFFFFF',
                borderRadius: '32px 32px 0 0',
                marginTop: '-32px',
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '2rem 1.5rem 1.5rem',
            }}>
                {renderForm()}
            </div>
        </div>
    );
}
