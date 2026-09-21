import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function PromptModal({
    isOpen,
    title,
    message,
    placeholder = '',
    onConfirm,
    onCancel,
    cancelText = 'Cancel',
    confirmText = 'OK',
    defaultValue = ''
}) {
    const [inputValue, setInputValue] = useState(defaultValue);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setInputValue(defaultValue);
            setTimeout(() => {
                if (inputRef.current) inputRef.current.focus();
            }, 50);
        }
    }, [isOpen, defaultValue]);

    if (!isOpen) return null;

    const handleConfirm = (e) => {
        if (e) {
            e.stopPropagation();
            if (e.type === 'touchend') e.preventDefault();
        }
        if (onConfirm) onConfirm(inputValue);
    };

    const handleCancel = (e) => {
        if (e) {
            e.stopPropagation();
            if (e.type === 'touchend') e.preventDefault();
        }
        if (onCancel) onCancel();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            handleConfirm(e);
        }
        if (e.key === 'Escape') {
            handleCancel(e);
        }
    };

    return createPortal(
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 999999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 0, 0, 0.45)',
                backdropFilter: 'blur(3px)',
                WebkitBackdropFilter: 'blur(3px)',
                animation: 'alertModalFadeIn 0.2s ease-out',
                padding: '1.25rem',
                touchAction: 'manipulation'
            }}
            onClick={handleCancel}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'rgba(255, 255, 255, 0.96)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    width: '90%',
                    maxWidth: '340px',
                    borderRadius: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.25)',
                    textAlign: 'center',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    animation: 'alertModalPopIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
            >
                <div style={{ padding: '1.5rem 1.25rem 1.25rem' }}>
                    {title && (
                        <h3 style={{
                            margin: '0 0 0.6rem',
                            fontSize: '1.15rem',
                            fontWeight: 600,
                            color: 'var(--text)',
                            letterSpacing: '-0.01em',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                        }}>
                            {title}
                        </h3>
                    )}
                    {message && (
                        <p style={{
                            margin: '0 0 1rem 0',
                            fontSize: '0.95rem',
                            color: '#1c1c1e',
                            lineHeight: 1.5,
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                        }}>
                            {message}
                        </p>
                    )}
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '0.6rem 0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                            outline: 'none',
                            marginTop: '0.5rem'
                        }}
                    />
                </div>

                <div style={{ height: '1px', background: 'rgba(60, 60, 67, 0.18)' }}></div>

                <div style={{ display: 'flex', width: '100%', height: '48px' }}>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="ios-modal-btn"
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            padding: '0 0.75rem',
                            color: '#007AFF',
                            fontSize: '1.05rem',
                            fontWeight: 400,
                            cursor: 'pointer',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                            outline: 'none',
                            touchAction: 'manipulation'
                        }}
                    >
                        {cancelText}
                    </button>
                    <div style={{ width: '1px', background: 'rgba(60, 60, 67, 0.18)' }}></div>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!inputValue.trim()}
                        className="ios-modal-btn"
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            padding: '0 0.75rem',
                            color: inputValue.trim() ? '#007AFF' : '#9ca3af',
                            fontSize: '1.05rem',
                            fontWeight: 600,
                            cursor: inputValue.trim() ? 'pointer' : 'default',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                            outline: 'none',
                            touchAction: 'manipulation'
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes alertModalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes alertModalPopIn {
                    from { opacity: 0; transform: scale(0.92); }
                    to { opacity: 1; transform: scale(1); }
                }
                .ios-modal-btn:active {
                    background: rgba(0, 0, 0, 0.08) !important;
                }
            `}</style>
        </div>,
        document.body
    );
}
