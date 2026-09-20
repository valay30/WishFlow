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
        let mounted = true;

        // Check for session errors on mount (specifically invalid refresh tokens)
        const checkActiveSession = async () => {
            try {
                const { error } = await supabase.auth.getSession();
                if (error && (error.message.includes('Refresh Token') || error.message.includes('refresh_token'))) {
                    console.warn("Invalid refresh token detected, clearing session...");
                    await supabase.auth.signOut();
                    if (mounted) {
                        setUser(null);
                        setLoading(false);
                    }
                }
            } catch (err) {
                console.error("Session check failed:", err);
            }
        };
        checkActiveSession();

        // Listen for Supabase session changes (e.g., login in another tab or token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                // User clicked the reset link from their email — show reset screen
                if (mounted) {
                    setRecoveryMode(true);
                    setLoading(false);
                }
                return;
            }
            
            // Explicitly handle SIGNED_OUT event
            if (event === 'SIGNED_OUT') {
                if (mounted) {
                    setUser(null);
                    setLoading(false);
                }
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
                
                if (mounted) setUser(baseUser);

                supabase.from('profiles').select('username').eq('id', session.user.id).maybeSingle().then(({ data }) => {
                    if (data?.username && mounted) {
                        setUser(prev => prev ? { ...prev, username: data.username } : null);
                    }
                });
                
                if (sessionStorage.getItem('isGoogleLoginRedirect') === 'true') {
                    sessionStorage.removeItem('isGoogleLoginRedirect');
                    // Check if this Google user already has categories.
                    // If not (new signup OR categories were never seeded), initialize them now.
                    import('../db').then(async ({ db, supabase: sb }) => {
                        const { data: existingCats } = await sb
                            .from('categories')
                            .select('id')
                            .eq('user_id', session.user.id)
                            .limit(1);

                        const isNewUser = !existingCats || existingCats.length === 0;

                        if (isNewUser) {
                            sessionStorage.setItem('showOnboarding', 'true');
                            await db.categories.initializeDefaults(session.user.id);
                        }

                        window.location.reload();
                    });
                    return;
                }

                if (sessionStorage.getItem('showOnboarding') === 'true' && mounted) {
                    setIsNewSignup(true);
                }

                if (window.location.hash && (window.location.hash.includes('access_token=') || window.location.hash.includes('error='))) {
                    window.history.replaceState(null, '', window.location.pathname + window.location.search);
                }
            } else if (event === 'INITIAL_SESSION') {
                // Initial load with no session
                if (mounted) setUser(null);
            }
            
            if (mounted) setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
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
