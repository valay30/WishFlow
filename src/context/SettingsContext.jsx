import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
    const [viewMode, setViewMode] = useState(() => {
        return localStorage.getItem('wishflow_view_mode') || 'card';
    });

    const [colorTheme, setColorThemeState] = useState(() => {
        return localStorage.getItem('wishflow_color_theme') || 'blue';
    });

    const [darkMode, setDarkModeState] = useState(() => {
        return localStorage.getItem('wishflow_dark_mode') === 'true';
    });

    const setColorTheme = (theme) => {
        setColorThemeState(theme);
        localStorage.setItem('wishflow_color_theme', theme);
    };

    const setDarkMode = (isDark) => {
        setDarkModeState(isDark);
        localStorage.setItem('wishflow_dark_mode', isDark);
    };

    useEffect(() => {
        localStorage.setItem('wishflow_view_mode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', colorTheme);
    }, [colorTheme]);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    // Apply theme on first mount (from localStorage)
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', colorTheme);
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <SettingsContext.Provider value={{ viewMode, setViewMode, colorTheme, setColorTheme, darkMode, setDarkMode }}>
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
