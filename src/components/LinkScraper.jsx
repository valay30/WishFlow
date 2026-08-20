import { useState, useEffect, useRef } from 'react';
import { Sparkles, Link, X, CheckCircle, AlertCircle } from 'lucide-react';
import { API_URL } from '../config';

const PRIMARY = 'var(--primary)';

/**
 * LinkScraper — Reusable "Paste URL → Auto-Fill" component.
 *
 * Props:
 *   categories  - Array of { id, name } for AI category matching
 *   onResult    - Called with { title, price, currency, image, categoryId, categoryName, url }
 *   autoFetchUrl - If set, auto-triggers fetch immediately on mount (for Share Target)
 */
export default function LinkScraper({ categories = [], onResult, autoFetchUrl = null }) {
    const [url, setUrl] = useState(autoFetchUrl || '');
    const [status, setStatus] = useState('idle'); // idle | loading | success | error
    const [errorMsg, setErrorMsg] = useState('');
    const inputRef = useRef(null);
    const hasFetchedRef = useRef(false);

    // Auto-fetch on mount when opened from share target
    useEffect(() => {
        if (autoFetchUrl && !hasFetchedRef.current) {
            hasFetchedRef.current = true;
            fetchData(autoFetchUrl);
        }
    }, [autoFetchUrl]);

    // Check if the input value looks like a URL
    const isUrl = (val) => {
        try {
            new URL(val.trim());
            return true;
        } catch {
            return false;
        }
    };

    const fetchData = async (targetUrl) => {
        const trimmed = (targetUrl || url).trim();
        if (!trimmed || !isUrl(trimmed)) {
            setErrorMsg('Please enter a valid URL (starting with http:// or https://)');
            setStatus('error');
            return;
        }

        setStatus('loading');
        setErrorMsg('');

        try {
            const res = await fetch(`${API_URL}/api/scraper/extract`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: trimmed, categories }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data.error || 'Failed to fetch product data');
                setStatus('error');
                return;
            }

            setStatus('success');
            onResult?.({ ...data, url: trimmed });
        } catch (err) {
            setErrorMsg('Network error. Make sure the backend is running.');
            setStatus('error');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            fetchData();
        }
    };

    const handleClear = () => {
        setUrl('');
        setStatus('idle');
        setErrorMsg('');
        inputRef.current?.focus();
    };

    const isLoading = status === 'loading';
    const isSuccess = status === 'success';
    const isError = status === 'error';

    return (
        <div style={{
            borderRadius: '18px',
            padding: '1rem 1.1rem',
            background: 'linear-gradient(135deg, rgba(var(--primary-rgb),0.08), rgba(var(--primary-rgb),0.04))',
            border: `1.5px solid ${isError ? '#ef4444' : isSuccess ? '#22c55e' : 'rgba(var(--primary-rgb),0.25)'}`,
            transition: 'border-color 0.3s, box-shadow 0.3s',
            boxShadow: isLoading ? `0 0 0 3px rgba(var(--primary-rgb),0.15)` : 'none',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
                <Sparkles size={14} color={PRIMARY} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: PRIMARY, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Paste Link
                </span>
            </div>

            {/* Input Row */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Link size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', flexShrink: 0 }} />
                    <input
                        ref={inputRef}
                        type="url"
                        value={url}
                        onChange={e => { setUrl(e.target.value); setStatus('idle'); setErrorMsg(''); }}
                        onKeyDown={handleKeyDown}
                        placeholder="https://amazon.in/dp/... or any shop URL"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '0.65rem 2.2rem 0.65rem 2.2rem',
                            background: 'var(--surface-2)',
                            border: '1.5px solid var(--border)',
                            borderRadius: '11px',
                            color: 'var(--text)',
                            fontFamily: 'inherit',
                            fontSize: '0.85rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                            opacity: isLoading ? 0.7 : 1,
                            transition: 'border-color 0.2s',
                        }}
                        onFocus={e => e.target.style.borderColor = PRIMARY}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                    {url && !isLoading && (
                        <button
                            type="button"
                            onClick={handleClear}
                            style={{ position: 'absolute', right: '0.6rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '2px' }}
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>

                {/* Fetch Button */}
                <button
                    type="button"
                    onClick={() => fetchData()}
                    disabled={isLoading || !url.trim()}
                    style={{
                        padding: '0.65rem 1rem',
                        borderRadius: '11px',
                        border: 'none',
                        background: isSuccess
                            ? 'rgba(34,197,94,0.15)'
                            : isLoading
                                ? 'rgba(var(--primary-rgb),0.5)'
                                : PRIMARY,
                        color: isSuccess ? '#22c55e' : '#fff',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: isLoading || !url.trim() ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        transition: 'all 0.2s',
                        opacity: !url.trim() && !isLoading ? 0.5 : 1,
                    }}
                >
                    {isLoading ? (
                        <>
                            <span style={{ width: '13px', height: '13px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'scraper-spin 0.7s linear infinite', display: 'inline-block', flexShrink: 0 }} />
                            Fetching...
                        </>
                    ) : isSuccess ? (
                        <>
                            <CheckCircle size={14} />
                            Done
                        </>
                    ) : (
                        <>
                            Fetch
                        </>
                    )}
                </button>
            </div>

            <style>{`
                @keyframes scraper-spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
