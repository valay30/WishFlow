import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
    const [viewMode, setViewMode] = useState(() => {
        return localStorage.getItem('wishflow_view_mode') || 'card';
    });

    useEffect(() => {
        localStorage.setItem('wishflow_view_mode', viewMode);
    }, [viewMode]);

    return (
        <SettingsContext.Provider value={{ viewMode, setViewMode }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
