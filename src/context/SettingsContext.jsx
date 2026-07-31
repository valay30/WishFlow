import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
    const [viewMode, setViewMode] = useState(() => {
        return localStorage.getItem('wishflow_view_mode') || 'card';
    });

    const [colorTheme, setColorThemeState] = useState(() => {
        return localStorage.getItem('wishflow_color_theme') || 'blue';
    });

    const setColorTheme = (theme) => {
        setColorThemeState(theme);
        localStorage.setItem('wishflow_color_theme', theme);
    };

    useEffect(() => {
        localStorage.setItem('wishflow_view_mode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', colorTheme);
    }, [colorTheme]);

    // Apply theme on first mount (from localStorage)
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', colorTheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <SettingsContext.Provider value={{ viewMode, setViewMode, colorTheme, setColorTheme }}>
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
