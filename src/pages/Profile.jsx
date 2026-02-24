import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { LogOut, User, ArrowLeft, Settings, Shield, Bell, LayoutGrid, List as ListIcon, ChevronDown, ChevronUp, Share2, FileDown, Copy, Check, Crown } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { db } from '../db';
import TierBadgeCard from '../components/TierBadgeCard';

const ORANGE = '#10367D';
const SURFACE = '#FFFFFF';
const SURFACE2 = '#F5F5F5';
const BORDER = '#D1D5DB';
const BG = '#EBEBEB';

export default function Profile() {
    const { user, logout } = useAuth();
    const { viewMode, setViewMode } = useSettings();
    const navigate = useNavigate();
    const [showGeneral, setShowGeneral] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [shareKey, setShareKey] = useState('');
    const [copied, setCopied] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    const handleGenerateShare = async () => {
        if (!user?.id) return;
        setSharing(true);
        try {
            const response = await fetch('http://localhost:5000/api/share/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });
            const data = await response.json();
            if (data.shareKey) {
                setShareKey(data.shareKey);
            }
        } catch (error) {
            console.error('Share error:', error);
            alert('Make sure your backend is running at http://localhost:5000');
        } finally {
            setSharing(false);
        }
    };

    const handleExportPDF = async () => {
        setExporting(true);
        try {
            const items = await db.items.getAll();
            const categories = await db.categories.getAll();

            // The backend expects item.categories.name for the PDF rendering
            const itemsWithCategories = items.map(item => {
                const matchingCategory = categories.find(c => c.id === item.category_id);
                return {
                    ...item,
                    categories: { name: matchingCategory?.name }
                };
            });

            const response = await fetch('http://localhost:5000/api/export/pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: itemsWithCategories, userName: user?.name })
            });

            if (!response.ok) throw new Error('PDF generation failed');

            const arrayBuffer = await response.arrayBuffer();
            const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${user?.name || 'My'}_Wishlist.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('PDF error:', error);
            alert('Failed to generate PDF. Is the backend running?');
        } finally {
            setExporting(false);
        }
    };

    const copyToClipboard = () => {
        const link = `${window.location.origin}/share/${shareKey}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleUpgradeToPremium = async () => {
        try {
            const orderRes = await fetch('http://localhost:5000/api/payment/create-order', { method: 'POST' });
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
                    const verificationRes = await fetch('http://localhost:5000/api/payment/verify', {
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
                        alert('Payment Successful! Please re-login to activate your Premium features.');
                        window.location.reload();
                    } else {
                        alert('Payment verification failed.');
                    }
                },
                theme: { color: "#10367D" }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                alert('Payment Failed. Please try again.');
            });
            rzp.open();
        } catch (error) {
            console.error(error);
            alert("Payment initiation failed. Please check your backend.");
        }
    };

    const initials = user?.name
        ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <div style={{ minHeight: '100%', background: BG }}>
            {/* ── Hero Section ── */}
            <div style={{
                background: `linear-gradient(160deg, #051A44 0%, #0A2665 55%, #10367D 100%)`,
                padding: '2.5rem 1.5rem 4.5rem',
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
                    <TierBadgeCard user={user} onUpgrade={handleUpgradeToPremium} />

                    {/* Options List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem' }}>
                        {[
                            { icon: User, label: 'Account Details', id: 'account' },
                            { icon: Share2, label: 'Share Wishlist', id: 'share' },
                            { icon: FileDown, label: 'Export as PDF', id: 'pdf' },
                            { icon: Bell, label: 'Notifications', id: 'notif' },
                            { icon: Shield, label: 'Privacy & Security', id: 'privacy' },
                            { icon: Settings, label: 'General Settings', id: 'general' },
                        ].map((item, i) => (
                            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', animation: `fadeInUp 0.4s ease-out ${i * 0.05}s backwards` }}>
                                <button
                                    onClick={() => {
                                        if (item.id === 'general') setShowGeneral(!showGeneral);
                                        if (item.id === 'pdf') handleExportPDF();
                                        if (item.id === 'share') handleGenerateShare();
                                    }}
                                    disabled={(item.id === 'pdf' && exporting) || (item.id === 'share' && sharing)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '1.25rem',
                                        padding: '1.15rem 1.5rem', background: SURFACE,
                                        border: `1px solid ${item.id === 'share' && shareKey ? ORANGE : BORDER}`, borderRadius: '24px',
                                        color: '#111', fontSize: '1.05rem', fontWeight: 700,
                                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.25s',
                                        textAlign: 'left', width: '100%',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                        opacity: (item.id === 'pdf' && exporting) || (item.id === 'share' && sharing) ? 0.7 : 1
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = ORANGE;
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = BORDER;
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
                                    }}
                                >
                                    <div style={{
                                        width: '42px', height: '42px', borderRadius: '14px',
                                        background: 'rgba(16,54,125,0.05)', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', color: ORANGE
                                    }}>
                                        <item.icon size={22} />
                                    </div>
                                    <span style={{ flex: 1 }}>
                                        {item.id === 'pdf' && exporting ? 'Generating PDF...' :
                                            item.id === 'share' && sharing ? 'Generating Link...' : item.label}
                                    </span>
                                    {item.id === 'general' ? (
                                        showGeneral ? <ChevronUp size={20} color="#9CA3AF" /> : <ChevronDown size={20} color="#9CA3AF" />
                                    ) : item.id === 'share' && shareKey ? (
                                        <div onClick={(e) => { e.stopPropagation(); copyToClipboard(); }} style={{ color: ORANGE, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {copied ? <Check size={18} /> : <Copy size={18} />}
                                        </div>
                                    ) : (
                                        <ChevronDown size={20} color="#9CA3AF" style={{ transform: 'rotate(-90deg)' }} />
                                    )}
                                </button>

                                {/* General Settings Expanded */}
                                {item.id === 'general' && showGeneral && (
                                    <div style={{
                                        background: '#fff',
                                        borderRadius: '24px',
                                        padding: '1.5rem',
                                        border: `1px solid ${ORANGE}`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1rem',
                                        animation: 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                        boxShadow: '0 8px 24px rgba(16,54,125,0.08)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: '#111' }}>Home View Mode</p>
                                                <p style={{ margin: '0.1rem 0 0', fontSize: '0.82rem', color: '#6B7280' }}>Choose list or card layout</p>
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                padding: '5px',
                                                background: '#F3F4F6',
                                                borderRadius: '14px',
                                                gap: '4px',
                                                border: '1px solid #E5E7EB'
                                            }}>
                                                <button
                                                    onClick={() => setViewMode('card')}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                        padding: '0.55rem 1rem', borderRadius: '10px',
                                                        border: 'none', cursor: 'pointer',
                                                        background: viewMode === 'card' ? '#fff' : 'transparent',
                                                        color: viewMode === 'card' ? ORANGE : '#6B7280',
                                                        fontWeight: 800, fontSize: '0.85rem',
                                                        boxShadow: viewMode === 'card' ? '0 3px 8px rgba(0,0,0,0.08)' : 'none',
                                                        transition: 'all 0.2s',
                                                        fontFamily: 'inherit'
                                                    }}
                                                >
                                                    <LayoutGrid size={16} /> Card
                                                </button>
                                                <button
                                                    onClick={() => setViewMode('list')}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                        padding: '0.55rem 1rem', borderRadius: '10px',
                                                        border: 'none', cursor: 'pointer',
                                                        background: viewMode === 'list' ? '#fff' : 'transparent',
                                                        color: viewMode === 'list' ? ORANGE : '#6B7280',
                                                        fontWeight: 800, fontSize: '0.85rem',
                                                        boxShadow: viewMode === 'list' ? '0 3px 8px rgba(0,0,0,0.08)' : 'none',
                                                        transition: 'all 0.2s',
                                                        fontFamily: 'inherit'
                                                    }}
                                                >
                                                    <ListIcon size={16} /> List
                                                </button>
                                            </div>
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
                            background: 'rgba(239,68,68,0.06)', color: '#ef4444',
                            border: '1px solid rgba(239,68,68,0.1)', borderRadius: '24px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                            fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer',
                            fontFamily: 'inherit', transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = '#ef4444';
                            e.currentTarget.style.color = '#fff';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(239,68,68,0.2)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(239,68,68,0.06)';
                            e.currentTarget.style.color = '#ef4444';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                        }}
                    >
                        <LogOut size={22} /> Sign Out
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
