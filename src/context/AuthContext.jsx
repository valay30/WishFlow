import { createContext, useContext, useState, useEffect } from 'react';
import { auth, supabase } from '../db';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isNewSignup, setIsNewSignup] = useState(() => {
        return sessionStorage.getItem('showOnboarding') === 'true';
    });
    const [recoveryMode, setRecoveryMode] = useState(() => {
        return window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery');
    });

    useEffect(() => {
        const initSession = async () => {
            try {
                const currentUser = await auth.getCurrentUser();
                setUser(currentUser);
            } catch (error) {
                console.error("Error initializing session:", error);
            } finally {
                setLoading(false);
            }
        };

        initSession();

        // Listen for Supabase session changes (e.g., login in another tab or token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                // User clicked the reset link from their email — show reset screen
                setRecoveryMode(true);
                setLoading(false);
                return;
            }
            if (session) {
                const baseUser = {
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.name,
                    isPremium: session.user.user_metadata?.is_premium || false,
                    isAdmin: session.user.user_metadata?.is_admin || false,
                };
                setUser(baseUser);

                supabase.from('profiles').select('username').eq('id', session.user.id).single().then(({ data }) => {
                    if (data?.username) {
                        setUser(prev => prev ? { ...prev, username: data.username } : null);
                    }
                });
                if (sessionStorage.getItem('isGoogleLoginRedirect') === 'true') {
                    sessionStorage.removeItem('isGoogleLoginRedirect');
                    if (session.user.created_at && (Date.now() - new Date(session.user.created_at).getTime() < 60000)) {
                        sessionStorage.setItem('showOnboarding', 'true');
                    }
                    window.location.reload();
                    return;
                }

                if (sessionStorage.getItem('showOnboarding') === 'true') {
                    setIsNewSignup(true);
                }

                if (window.location.hash && (window.location.hash.includes('access_token=') || window.location.hash.includes('error='))) {
                    window.history.replaceState(null, '', window.location.pathname + window.location.search);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        sessionStorage.setItem('isGoogleLoginRedirect', 'true');
        return await auth.signInWithGoogle();
    };

    const login = async (credentials) => {
        const result = await auth.login(credentials);
        if (result.success) setUser(result.user);
        return result;
    };

    const signup = async (data) => {
        const result = await auth.signup(data);
        if (result.success) {
            setUser(result.user);
            sessionStorage.setItem('showOnboarding', 'true');
            setIsNewSignup(true);
        }
        return result;
    };

    const clearNewSignup = () => {
        sessionStorage.removeItem('showOnboarding');
        setIsNewSignup(false);
    };

    const logout = async () => {
        await auth.logout();
        setUser(null);
    };

    const resetPassword = async (email) => {
        return await auth.resetPassword(email);
    };

    const updatePassword = async (newPassword) => {
        const result = await auth.updatePassword(newPassword);
        if (result.success) setRecoveryMode(false);
        return result;
    };

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#fff' }}>
                Loading...
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, signInWithGoogle, resetPassword, updatePassword, recoveryMode, setRecoveryMode, isNewSignup, clearNewSignup }}>
            {children}
        </AuthContext.Provider>
    );
}
