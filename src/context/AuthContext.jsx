import { createContext, useContext, useState, useEffect } from 'react';
import { auth, supabase } from '../db';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

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
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.name,
                    isPremium: session.user.user_metadata?.is_premium || false,
                    isAdmin: session.user.user_metadata?.is_admin || false,
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (credentials) => {
        const result = await auth.login(credentials);
        if (result.success) setUser(result.user);
        return result;
    };

    const signup = async (data) => {
        const result = await auth.signup(data);
        if (result.success) setUser(result.user);
        return result;
    };

    const logout = async () => {
        await auth.logout();
        setUser(null);
    };

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#fff' }}>
                Loading...
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
