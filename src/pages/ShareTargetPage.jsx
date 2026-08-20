import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

/**
 * ShareTargetPage — PWA Web Share Target handler.
 * Immediately redirects to the home add-modal with the shared URL as a param.
 * No separate UI page — the existing Add form handles everything.
 */
export default function ShareTargetPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const urlParam = searchParams.get('url');
        const textParam = searchParams.get('text');

        // Extract URL from either the `url` param (direct) or embedded in `text`
        const extracted =
            urlParam?.trim() ||
            textParam?.trim()?.match(/https?:\/\/[^\s]+/)?.[0] ||
            null;

        if (extracted) {
            // Open home → add modal with the shared URL pre-loaded
            navigate(
                `/home?add=true&share=${encodeURIComponent(extracted)}`,
                { replace: true }
            );
        } else {
            // No URL found — just open the empty add modal
            navigate('/home?add=true', { replace: true });
        }
    }, []);

    // Render nothing — redirect happens in useEffect
    return null;
}
