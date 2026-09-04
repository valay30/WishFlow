import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { LogOut, User, ArrowLeft, Settings, Shield, ShieldCheck, Bell, LayoutGrid, List as ListIcon, FolderHeart, ChevronDown, ChevronUp, Crown, Lock, Check, X, Columns } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { db, supabase } from '../db';
import TierBadgeCard from '../components/TierBadgeCard';
import AlertModal from '../components/AlertModal';
import CustomSelect from '../components/CustomSelect';
import { API_URL, APP_VERSION } from '../config';
import { subscribeToPushNotifications } from '../utils/pushNotifications';
import { loadRazorpay } from '../utils/loadRazorpay';

const ORANGE = 'var(--primary)';
const SURFACE = 'var(--surface)';
const SURFACE2 = 'var(--surface-2)';
const BORDER = 'var(--border)';
const BG = 'var(--bg)';

import { useIsland } from '../context/IslandContext';

const THEMES = [
    { id: 'blue', label: 'Ocean Blue', color: '#10367D' },
    { id: 'purple', label: 'Royal Purple', color: '#7C3AED' },
    { id: 'emerald', label: 'Emerald', color: '#059669' },
    { id: 'rose', label: 'Rose', color: '#E11D48' },
    { id: 'orange', label: 'Sunset', color: '#EA580C' },
    { id: 'slate', label: 'Slate', color: '#475569' },
];

export default function Profile() {
    const { user, logout } = useAuth();
    const { viewMode, setViewMode, colorTheme, setColorTheme, darkMode, setDarkMode, currency, setCurrency } = useSettings();
    const navigate = useNavigate();
    const location = useLocation();
    const [showGeneral, setShowGeneral] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : false);
    const [showAccount, setShowAccount] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState({ isOpen: false, success: false, title: '', message: '' });
    const [generalAlert, setGeneralAlert] = useState({ isOpen: false, title: '', message: '' });
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [username, setUsername] = useState('');
    const [isSavingUsername, setIsSavingUsername] = useState(false);
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [initialUsername, setInitialUsername] = useState('');
    const { showIsland } = useIsland();

    const showToast = (message, type = 'success') => {
        showIsland({ title: type === 'success' ? 'Success' : 'Error', subtitle: message, type });
    };

    const [isProfileLoading, setIsProfileLoading] = useState(true);

    useEffect(() => {
        if (user?.username) {
            setUsername(user.username);
            setInitialUsername(user.username);
        }
        setIsProfileLoading(false);
    }, [user?.username]);

    // Auto-trigger upgrade flow when redirected from landing page pricing CTA
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('upgrade') === 'true' && !isProfileLoading && user && !user.is_premium) {
            // Clean the URL without causing a reload
            navigate('/profile', { replace: true });
            // Small delay to let the page mount fully before opening Razorpay
            const timer = setTimeout(() => {
                handleUpgradeToPremium();
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [location.search, isProfileLoading, user]);

    const handleSaveUsername = async () => {
        if (!username.trim()) return;
        setIsSavingUsername(true);
        const res = await db.profiles.updateUsername(username.trim());
        setIsSavingUsername(false);
        if (!res.success) {
            showToast(res.error, 'error');
        } else {
            setInitialUsername(username.trim());
            setShowUsernameModal(false);
            showIsland({ title: 'Settings Saved', type: 'success' });
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };


    const handleUpgradeToPremium = async () => {
        if (isUpgrading) return;
        setIsUpgrading(true);
        try {
            const loaded = await loadRazorpay();
            if (!loaded) throw new Error('Failed to load Razorpay SDK');

            const orderRes = await fetch(`${API_URL}/api/payment/create-order`, { method: 'POST' });
            const orderData = await orderRes.json();

            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "WishFlow",
                description: "Lifetime Premium Subscription",
                order_id: orderData.id,
                config: { display: { hide: [{ method: 'paylater' }] } },
                handler: async function (response) {
                    const verificationRes = await fetch(`${API_URL}/api/payment/verify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            userId: user?.id
                        })
                    });
                    const verificationData = await verificationRes.json();
                    if (verificationData.success) {
                        // Force session refresh so the new JWT with is_premium=true is downloaded
                        try {
                            await supabase.auth.refreshSession();
                        } catch (err) {
                            console.error('Failed to refresh session:', err);
                        }

                        setPaymentStatus({
                            isOpen: true,
                            success: true,
                            title: 'Payment Successful, Thank you for subscribing to Premium!',
                            message: 'Welcome to Premium! Your features are now active.'
                        });
                    } else {
                        setPaymentStatus({
                            isOpen: true,
                            success: false,
                            title: 'Payment Verification Failed',
                            message: 'We could not verify your payment. Please contact support.'
                        });
                    }
                },
                theme: { color: "#10367D" },
                modal: {
                    ondismiss: function () {
                        document.body.style.overflow = '';
                        const rzpContainers = document.querySelectorAll('.razorpay-container');
                        rzpContainers.forEach(container => container.remove());
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                setPaymentStatus({
                    isOpen: true,
                    success: false,
                    title: 'Payment Failed',
                    message: 'Payment Failed. Please try again.'
                });
            });
            rzp.open();
        } catch (error) {
            console.error(error);
            setPaymentStatus({
                isOpen: true,
                success: false,
                title: 'Error',
                message: 'Payment initiation failed. Please check your backend.'
            });
        } finally {
            setIsUpgrading(false);
        }
    };

    const initials = user?.name
        ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <div style={{ minHeight: '100%', background: BG }}>
            {/* ── Hero Section ── */}
            <div style={{
                background: `linear-gradient(160deg, var(--primary-dk) 0%, var(--primary-dk) 45%, var(--primary) 100%)`,
                padding: '2.5rem 1.5rem 3.5rem',
                position: 'relative',
                color: '#fff',
                textAlign: 'center'
            }}>
                <div style={{ position: 'absolute', top: '2.5rem', left: '1.5rem' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                            color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: '0.85rem',
                            cursor: 'pointer', fontFamily: 'inherit',
                            padding: '0.5rem 1rem', borderRadius: '99px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', marginTop: '1rem' }}>
                    <div style={{
                        width: '100px', height: '100px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.15)',
                        border: '3px solid rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 900, fontSize: '2.8rem',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                        animation: 'fadeInUp 0.6s ease-out'
                    }}>
                        {initials}
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: '#fff' }}>
                            {user?.name || 'User Name'}
                        </h1>
                        <p style={{ margin: '0.35rem 0 0', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '1rem' }}>
                            {user?.email || 'user@example.com'}
                        </p>
                        <div
                            onClick={() => setShowUsernameModal(true)}
                            style={{
                                display: 'inline-block',
                                marginTop: '0.15rem',
                                cursor: 'pointer',
                                transition: 'opacity 0.2s',
                                opacity: 0.85
                            }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = 1; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = 0.85; }}
                        >
                            <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'center', minHeight: '1.2rem' }}>
                                {!isProfileLoading && (
                                    <>
                                        {initialUsername ? `@${initialUsername}` : '@username'}
                                        {!initialUsername && <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>✎</span>}
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Content Sheet ── */}
            <div style={{
                background: BG,
                borderRadius: '32px 32px 0 0',
                marginTop: '-2.5rem',
                padding: '2.5rem 1.5rem',
                position: 'relative',
                zIndex: 2,
                minHeight: '60vh'
            }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>

                    {/* ── Tier Badge Card ── */}
                    <TierBadgeCard user={user} onUpgrade={handleUpgradeToPremium} isUpgrading={isUpgrading} />

                    {/* Options List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem' }}>
                        {[
                            ...(user?.isAdmin ? [{ icon: ShieldCheck, label: 'Admin Panel', id: 'admin' }] : []),
                            { icon: ListIcon, label: 'Categories Lists', id: 'lists', hideOnDesktop: true },
                            { icon: FolderHeart, label: 'My Collections', id: 'collections', hideOnDesktop: true },
                            { icon: Bell, label: 'Enable Notifications', id: 'notifications' },
                            { icon: Settings, label: 'General Settings', id: 'general' },
                        ].map((item, i) => (
                            <div key={item.id} className={item.hideOnDesktop ? 'hide-on-desktop' : ''} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', animation: `fadeInUp 0.4s ease-out ${i * 0.05}s backwards` }}>
                                <button
                                    onClick={async () => {
                                        if (item.id === 'admin') navigate('/admin');
                                        if (item.id === 'lists') navigate('/categories');
                                        if (item.id === 'collections') navigate('/collections');
                                        if (item.id === 'general') setShowGeneral(!showGeneral);
                                        if (item.id === 'notifications') {
                                            const success = await subscribeToPushNotifications(user?.id);
                                            showToast(
                                                success ? 'Notifications enabled successfully!' : 'Could not enable notifications. Check permissions.',
                                                success ? 'success' : 'error'
                                            );
                                        }
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '1.25rem',
                                        padding: '1.15rem 1.5rem', background: SURFACE,
                                        border: item.id === 'admin' ? '1.5px solid #d97706' : `1px solid ${BORDER}`, borderRadius: '24px',
                                        color: item.id === 'admin' ? '#d97706' : 'var(--text)', fontSize: '1.05rem', fontWeight: 700,
                                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.25s',
                                        textAlign: 'left', width: '100%',
                                        boxShadow: item.id === 'admin' ? '0 4px 14px rgba(217,119,6,0.15)' : '0 2px 8px rgba(0,0,0,0.03)'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = item.id === 'admin' ? '#f59e0b' : ORANGE;
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = item.id === 'admin' ? '#d97706' : BORDER;
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = item.id === 'admin' ? '0 4px 14px rgba(217,119,6,0.15)' : '0 2px 8px rgba(0,0,0,0.03)';
                                    }}
                                >
                                    <div style={{
                                        width: '42px', height: '42px', borderRadius: '14px',
                                        background: item.id === 'admin' ? 'rgba(217,119,6,0.12)' : 'rgba(var(--primary-rgb),0.05)', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', color: item.id === 'admin' ? '#d97706' : ORANGE
                                    }}>
                                        <item.icon size={22} />
                                    </div>
                                    <span style={{ flex: 1 }}>
                                        {item.label}
                                    </span>
                                    {item.id === 'general' ? (
                                        showGeneral ? <ChevronUp size={20} color="#9CA3AF" /> : <ChevronDown size={20} color="#9CA3AF" />
                                    ) : (
                                        <ChevronDown size={20} color={item.id === 'admin' ? '#d97706' : '#9CA3AF'} style={{ transform: 'rotate(-90deg)' }} />
                                    )}
                                </button>

                                {/* General Settings Expanded */}
                                {item.id === 'general' && showGeneral && (
                                    <div style={{
                                        background: 'var(--surface)',
                                        borderRadius: '24px',
                                        padding: '1.5rem',
                                        border: `1px solid ${ORANGE}`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1rem',
                                        animation: 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                        boxShadow: '0 8px 24px rgba(var(--primary-rgb),0.08)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)' }}>Home View Mode</p>
                                                <p style={{ margin: '0.1rem 0 0', fontSize: '0.82rem', color: 'var(--text-dim)' }}>Choose list or card layout</p>
                                            </div>
                                            <div style={{ minWidth: '120px' }}>
                                                <CustomSelect
                                                    value={viewMode}
                                                    onChange={(val) => setViewMode(val)}
                                                    options={[
                                                        { value: 'card', label: 'Card', icon: LayoutGrid },
                                                        { value: 'masonry', label: 'Masonry', icon: Columns },
                                                        { value: 'list', label: 'List', icon: ListIcon },
                                                    ]}
                                                />
                                            </div>
                                        </div>

                                        {/* Currency Selection */}
                                        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div>
                                                    <p style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)' }}>Currency</p>
                                                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.82rem', color: 'var(--text-dim)' }}>Default currency for your items</p>
                                                </div>
                                                <div style={{ minWidth: '120px' }}>
                                                    <CustomSelect
                                                        value={currency}
                                                        onChange={(val) => {
                                                            setCurrency(val);
                                                            showIsland({ title: 'Settings Saved', type: 'success' });
                                                        }}
                                                        options={[
                                                            { value: 'INR', label: '₹ INR' },
                                                            { value: 'USD', label: '$ USD' },
                                                            { value: 'EUR', label: '€ EUR' },
                                                            { value: 'GBP', label: '£ GBP' },
                                                            { value: 'AUD', label: 'A$ AUD' },
                                                            { value: 'CAD', label: 'C$ CAD' },
                                                        ]}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dark Mode — Premium Only */}
                                        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)' }}>Dark Mode</p>
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', fontSize: '0.58rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                            <Crown size={8} /> Pro
                                                        </span>
                                                    </div>
                                                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.82rem', color: 'var(--text-dim)' }}>Switch to Midnight Obsidian</p>
                                                </div>

                                                {user?.isPremium ? (
                                                    <div style={{
                                                        width: '44px', height: '24px', borderRadius: '12px',
                                                        background: darkMode ? ORANGE : 'var(--surface-3)',
                                                        position: 'relative', cursor: 'pointer',
                                                        transition: 'background 0.3s'
                                                    }} onClick={() => {
                                                        setDarkMode(!darkMode);
                                                        showIsland({ title: 'Settings Saved', type: 'success' });
                                                    }}>
                                                        <div style={{
                                                            width: '20px', height: '20px', borderRadius: '50%',
                                                            background: 'var(--surface)', position: 'absolute', top: '2px',
                                                            left: darkMode ? '22px' : '2px', transition: 'left 0.3s',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                        }} />
                                                    </div>
                                                ) : (
                                                    <div style={{ padding: '0.25rem 0.75rem', background: 'rgba(245,158,11,0.1)', color: '#d97706', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                        Locked
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* App Theme — Premium Only */}
                                        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)' }}>App Theme</p>
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', fontSize: '0.58rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                            <Crown size={8} /> Pro
                                                        </span>
                                                    </div>
                                                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.82rem', color: 'var(--text-dim)' }}>Choose your accent color</p>
                                                </div>
                                            </div>

                                            {user?.isPremium ? (
                                                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                                    {THEMES.map(theme => (
                                                        <button
                                                            key={theme.id}
                                                            onClick={() => {
                                                                setColorTheme(theme.id);
                                                                showIsland({ title: 'Settings Saved', type: 'success' });
                                                            }}
                                                            title={theme.label}
                                                            style={{
                                                                width: '36px', height: '36px',
                                                                borderRadius: '50%',
                                                                background: theme.color,
                                                                border: colorTheme === theme.id ? '3px solid var(--text)' : '3px solid transparent',
                                                                outline: colorTheme === theme.id ? `2px solid ${theme.color}` : 'none',
                                                                outlineOffset: '2px',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s',
                                                                transform: colorTheme === theme.id ? 'scale(1.15)' : 'scale(1)',
                                                                boxShadow: colorTheme === theme.id ? `0 4px 12px ${theme.color}55` : '0 2px 6px rgba(0,0,0,0.12)',
                                                                flexShrink: 0,
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div style={{
                                                    display: 'flex', alignItems: 'flex-start', gap: '1rem',
                                                    padding: '1rem 1.25rem',
                                                    background: 'rgba(245,158,11,0.06)',
                                                    border: '1px dashed rgba(245,158,11,0.4)',
                                                    borderRadius: '16px',
                                                }}>
                                                    <div style={{
                                                        width: '40px', height: '40px', borderRadius: '12px',
                                                        background: 'rgba(245,158,11,0.12)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}>
                                                        <Lock size={18} color="#d97706" />
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>Premium Feature</p>
                                                        <p style={{ margin: '0.1rem 0 0.85rem', fontSize: '0.78rem', color: 'var(--text-dim)' }}>Upgrade to Pro to unlock custom themes and dark mode</p>
                                                        <button
                                                            onClick={handleUpgradeToPremium}
                                                            style={{
                                                                padding: '0.5rem 1rem', borderRadius: '10px',
                                                                background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                                                                color: '#fff', fontWeight: 800, fontSize: '0.8rem',
                                                                border: 'none', cursor: 'pointer',
                                                                fontFamily: 'inherit', flexShrink: 0,
                                                                boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
                                                                transition: 'all 0.2s',
                                                            }}
                                                        >
                                                            Upgrade
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Sign Out Button */}
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%', padding: '1.25rem',
                            background: 'rgba(var(--primary-rgb),0.06)', color: 'var(--primary)',
                            border: '1px solid rgba(var(--primary-rgb),0.1)', borderRadius: '24px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                            fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer',
                            fontFamily: 'inherit', transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'var(--primary)';
                            e.currentTarget.style.color = '#fff';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(var(--primary-rgb),0.2)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(var(--primary-rgb),0.06)';
                            e.currentTarget.style.color = 'var(--primary)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                        }}
                    >
                        <LogOut size={22} /> Sign Out
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: '2rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                            Version {APP_VERSION}
                        </span>
                    </div>
                </div>
            </div>

            {showUsernameModal && createPortal(
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 999999,
                    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }} onClick={() => setShowUsernameModal(false)}>
                    <div style={{
                        background: 'var(--surface)', borderRadius: '24px', padding: '2rem',
                        width: '100%', maxWidth: '400px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
                        position: 'relative'
                    }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowUsernameModal(false)} style={{
                            position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent',
                            border: 'none', color: 'var(--text-dim)', cursor: 'pointer'
                        }}>
                            <div style={{ padding: '0.2rem' }}>✕</div>
                        </button>
                        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', color: 'var(--text)' }}>Username</h2>
                        <p style={{ margin: '0 0 1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Set a unique username.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <input
                                autoFocus
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                                placeholder="yourusername"
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    padding: '0.9rem 1rem', borderRadius: '12px',
                                    border: `1px solid var(--border)`, background: 'var(--surface-2)',
                                    color: 'var(--text)', fontSize: '1rem', fontFamily: 'inherit',
                                    outline: 'none'
                                }}
                            />
                            <button
                                onClick={handleSaveUsername}
                                disabled={isSavingUsername || !username.trim()}
                                style={{
                                    width: '100%', padding: '0.9rem 1.25rem', borderRadius: '12px', border: 'none',
                                    background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '1rem',
                                    cursor: isSavingUsername || !username.trim() ? 'not-allowed' : 'pointer',
                                    opacity: isSavingUsername || !username.trim() ? 0.6 : 1,
                                    transition: 'all 0.2s', fontFamily: 'inherit'
                                }}
                            >
                                {isSavingUsername ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <style>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes toastSlideUp {
                    from { opacity: 0; transform: translate(-50%, 24px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                @media (min-width: 1024px) {
                    .hide-on-desktop { display: none !important; }
                }
            `}</style>

            <AlertModal
                isOpen={paymentStatus.isOpen}
                title={paymentStatus.title}
                message={paymentStatus.message}
                onConfirm={() => {
                    setPaymentStatus({ ...paymentStatus, isOpen: false });
                    if (paymentStatus.success) {
                        window.location.reload();
                    }
                }}
            />
            <AlertModal
                isOpen={generalAlert.isOpen}
                title={generalAlert.title}
                message={generalAlert.message}
                onConfirm={() => setGeneralAlert({ ...generalAlert, isOpen: false })}
            />
        </div>
    );
}
