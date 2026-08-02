import React from 'react';
import { createPortal } from 'react-dom';

export default function AlertModal({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    cancelText = 'Cancel',
    confirmText = 'OK',
    isDestructive = false
}) {
    if (!isOpen) return null;

    const hasCancel = typeof onCancel === 'function';

    const handleConfirm = (e) => {
        if (e) {
            e.stopPropagation();
            if (e.type === 'touchend') e.preventDefault();
        }
        if (onConfirm) onConfirm();
    };

    const handleCancel = (e) => {
        if (e) {
            e.stopPropagation();
            if (e.type === 'touchend') e.preventDefault();
        }
        if (onCancel) onCancel();
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
            onClick={hasCancel ? handleCancel : undefined}
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
                            color: '#000',
                            letterSpacing: '-0.01em',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                        }}>
                            {title}
                        </h3>
                    )}
                    <p style={{
                        margin: 0,
                        fontSize: '0.95rem',
                        color: '#1c1c1e',
                        lineHeight: 1.5,
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                    }}>
                        {message}
                    </p>
                </div>

                <div style={{ height: '1px', background: 'rgba(60, 60, 67, 0.18)' }}></div>

                {hasCancel ? (
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
                            className="ios-modal-btn"
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                padding: '0 0.75rem',
                                color: isDestructive ? '#FF3B30' : '#007AFF',
                                fontSize: '1.05rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                                outline: 'none',
                                touchAction: 'manipulation'
                            }}
                        >
                            {confirmText}
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="ios-modal-btn"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            padding: '1rem 1.25rem',
                            color: isDestructive ? '#FF3B30' : '#007AFF',
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            width: '100%',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                            outline: 'none',
                            touchAction: 'manipulation'
                        }}
                    >
                        {confirmText}
                    </button>
                )}
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
