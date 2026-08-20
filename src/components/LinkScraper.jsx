import { useState, useEffect, useRef } from 'react';
import { Sparkles, Link as LinkIcon, X, CheckCircle, AlertCircle } from 'lucide-react';
import { API_URL } from '../config';
import FetchOverlay from './FetchOverlay';

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
                return;
            }

            setStatus('success');
            setShowOverlay(false); // dismiss overlay immediately when data arrives
            onResult?.({ ...data, url: trimmed });
            // Reset success indicator after 3s
            setTimeout(() => setStatus('idle'), 3000);
        } catch {
            setShowOverlay(false); // dismiss overlay on error too
            setErrorMsg('Network error — backend not reachable.');
            setStatus('error');
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
                        border: `1.5px solid ${isError ? '#ef4444' : isSuccess ? '#22c55e' : BORDER}`,
                        borderRadius: '14px',
                        padding: '0.75rem 0.85rem',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box',
                        minWidth: 0,
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
                        style={{
                            flexShrink: 0,
                            width: '96px',
                            padding: '0.75rem 0.5rem',
                            borderRadius: '14px',
                            border: 'none',
                            background: isSuccess
                                ? '#22c55e'
                                : (!value.trim() || isLoading)
                                    ? 'rgba(var(--primary-rgb),0.35)'
                                    : PRIMARY,
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            fontFamily: 'inherit',
                            cursor: isLoading || !value.trim() ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            transition: 'background-color 0.25s ease, opacity 0.2s ease',
                            whiteSpace: 'nowrap',
                            boxSizing: 'border-box',
                        }}
                    >
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
                                <CheckCircle size={14} />
                                Done
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

                <style>{`@keyframes ls-spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </>
    );
}
