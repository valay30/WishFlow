import { useState, useEffect, useRef } from 'react';
import { Sparkles, Link as LinkIcon, X, CheckCircle, AlertCircle } from 'lucide-react';
import { API_URL } from '../config';
import FetchOverlay from './FetchOverlay';
import { useIsland } from '../context/IslandContext';

const PRIMARY = 'var(--primary)';
const BORDER = 'var(--border)';

/**
 * LinkScraper — Single "Product Link" input.
 *
 * Behaviour:
 *  - value/onChange: controlled by parent → link is ALWAYS saved even without clicking Fetch
 *  - Click "Fetch" → calls backend scraper → auto-fills parent form via onResult
 *  - Field is entirely optional — form submits fine with no link
 *  - autoFetchUrl: auto-triggers Fetch on mount (for PWA Share Target)
 */
export default function LinkScraper({
    value = '',
    onChange,
    categories = [],
    onResult,
    autoFetchUrl = null,
}) {
    const { showIsland } = useIsland();
    const [status, setStatus] = useState('idle'); // idle | loading | success | error
    const [errorMsg, setErrorMsg] = useState('');
    // showOverlay: true only when auto-fetching from a shared URL
    const [showOverlay, setShowOverlay] = useState(false);
    const inputRef = useRef(null);
    const hasFetchedRef = useRef(false);

    // Auto-fetch on mount when opened from share target
    useEffect(() => {
        if (autoFetchUrl && !hasFetchedRef.current) {
            hasFetchedRef.current = true;
            onChange?.(autoFetchUrl);
            setShowOverlay(true);
            runFetch(autoFetchUrl);
        }
    }, [autoFetchUrl]);

    const isValidUrl = (val) => {
        try { new URL(val.trim()); return true; } catch { return false; }
    };

    const runFetch = async (target) => {
        const trimmed = (target ?? value).trim();
        if (!trimmed || !isValidUrl(trimmed)) {
            setErrorMsg('Enter a valid URL (https://...)');
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
                setErrorMsg(data.error || 'Could not fetch details');
                setStatus('error');
                showIsland({ title: 'Scraping Failed', subtitle: data.error || 'Could not fetch details', type: 'error' });
                return;
            }

            setStatus('success');
            setShowOverlay(false);
            showIsland({ title: 'Success', subtitle: 'Product details fetched!', type: 'success' });
            onResult?.({ ...data, url: trimmed });
            setTimeout(() => setStatus('idle'), 3000);
        } catch {
            setShowOverlay(false);
            setErrorMsg('Network error — backend not reachable.');
            setStatus('error');
            showIsland({ title: 'Network Error', subtitle: 'Backend not reachable.', type: 'error' });
        }
    };

    const handleChange = (e) => {
        onChange?.(e.target.value);
        if (status !== 'idle') setStatus('idle');
        if (errorMsg) setErrorMsg('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); runFetch(); }
    };

    const handleClear = () => {
        onChange?.('');
        setStatus('idle');
        setErrorMsg('');
        inputRef.current?.focus();
    };

    const isLoading = status === 'loading';
    const isSuccess = status === 'success';
    const isError = status === 'error';
    const [pressed, setPressed] = useState(false);

    return (
        <>
            {/* Overlay: shown only when auto-fetching from a shared link */}
            <FetchOverlay visible={showOverlay} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {/* Label */}
                <label style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: PRIMARY,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                }}>
                    Product Link
                </label>

                {/* Input Row: Input Box + Outside Fetch Button */}
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    {/* Input Box */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        background: 'var(--surface-2)',
                        border: `1.5px solid ${isError ? '#ef4444' : isSuccess ? '#22c55e' : isLoading ? 'var(--primary)' : BORDER}`,
                        borderRadius: '14px',
                        padding: '0.75rem 0.85rem',
                        transition: 'border-color 0.2s, box-shadow 0.3s',
                        boxSizing: 'border-box',
                        minWidth: 0,
                        animation: isLoading ? 'ls-pulse-border 1.4s ease-in-out infinite' : 'none',
                    }}>
                        <LinkIcon size={16} color="var(--text-dim)" style={{ flexShrink: 0, marginRight: '0.5rem' }} />

                        <input
                            ref={inputRef}
                            type="url"
                            value={value}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            placeholder="https://..."
                            disabled={isLoading}
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                color: 'var(--text)',
                                fontFamily: 'inherit',
                                fontSize: '0.92rem',
                                padding: 0,
                                minWidth: 0,
                            }}
                        />

                        {/* Clear button */}
                        {value && !isLoading && (
                            <button
                                type="button"
                                onClick={handleClear}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-dim)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '2px',
                                    marginLeft: '0.35rem',
                                    flexShrink: 0,
                                }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Fetch Button (Outside) */}
                    <button
                        type="button"
                        onClick={() => runFetch()}
                        disabled={isLoading || !value.trim()}
                        onMouseDown={() => setPressed(true)}
                        onMouseUp={() => setPressed(false)}
                        onMouseLeave={() => setPressed(false)}
                        onTouchStart={() => setPressed(true)}
                        onTouchEnd={() => setPressed(false)}
                        style={{
                            flexShrink: 0,
                            width: '96px',
                            padding: '0.75rem 0.5rem',
                            borderRadius: '14px',
                            border: 'none',
                            background: isSuccess
                                ? '#22c55e'
                                : PRIMARY,
                            opacity: (!value.trim() && !isLoading) ? 0.4 : 1,
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            fontFamily: 'inherit',
                            cursor: isLoading || !value.trim() ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            position: 'relative',
                            overflow: 'hidden',
                            // background switches instantly (no transition) so Done feels immediate
                            transition: 'opacity 0.2s ease, transform 0.12s ease, box-shadow 0.15s ease',
                            whiteSpace: 'nowrap',
                            boxSizing: 'border-box',
                            transform: pressed && !isLoading && value.trim() ? 'scale(0.93)' : 'scale(1)',
                            boxShadow: isSuccess
                                ? '0 4px 18px rgba(34, 197, 94, 0.55)'
                                : isLoading
                                    ? '0 4px 16px rgba(var(--primary-rgb), 0.5)'
                                    : pressed && value.trim() ? 'none'
                                    : value.trim() ? '0 4px 12px rgba(var(--primary-rgb), 0.3)' : 'none',
                        }}
                    >
                        {isLoading && (
                            <span style={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
                                animation: 'ls-shimmer 1.2s ease-in-out infinite',
                                pointerEvents: 'none',
                            }} />
                        )}
                        {isLoading ? (
                            <>
                                <span style={{
                                    width: '12px', height: '12px',
                                    border: '2px solid rgba(255,255,255,0.35)',
                                    borderTopColor: '#fff',
                                    borderRadius: '50%',
                                    animation: 'ls-spin 0.7s linear infinite',
                                    display: 'inline-block',
                                    flexShrink: 0,
                                }} />
                                Fetching
                            </>
                        ) : isSuccess ? (
                            <>
                                <span style={{ display: 'contents', animation: 'ls-success-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
                                    <CheckCircle size={14} />
                                    Done
                                </span>
                            </>
                        ) : (
                            'Fetch'
                        )}
                    </button>
                </div>

                {/* Error message */}
                {isError && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        fontSize: '0.73rem', color: '#ef4444',
                    }}>
                        <AlertCircle size={11} />
                        <span>{errorMsg}</span>
                    </div>
                )}

                <style>{`
                    @keyframes ls-spin { to { transform: rotate(360deg); } }
                    @keyframes ls-shimmer {
                        0%   { transform: translateX(-100%); }
                        100% { transform: translateX(200%); }
                    }
                    @keyframes ls-pulse-border {
                        0%, 100% { box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.12); }
                        50%       { box-shadow: 0 0 0 5px rgba(var(--primary-rgb), 0.28); }
                    }
                    @keyframes ls-success-pop {
                        0%   { transform: scale(0.6); opacity: 0; }
                        70%  { transform: scale(1.15); opacity: 1; }
                        100% { transform: scale(1);    opacity: 1; }
                    }
                `}</style>
            </div>
        </>
    );
}
