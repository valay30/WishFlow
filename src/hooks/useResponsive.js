import { useState, useEffect } from 'react';

export function useResponsive() {
    const [width, setWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1024
    );

    useEffect(() => {
        const handle = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handle);
        
        // Polling to fix Android OAuth redirect viewport race condition
        // The browser sometimes processes the viewport meta tag AFTER React evaluates window.innerWidth
        const t1 = setTimeout(handle, 50);
        const t2 = setTimeout(handle, 250);
        const t3 = setTimeout(handle, 750);

        return () => {
            window.removeEventListener('resize', handle);
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, []);

    return {
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        width,
    };
}
