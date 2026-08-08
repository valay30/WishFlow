import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db, supabase } from '../db';
import { Upload, X, ArrowLeft, Sparkles, Crown } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import AlertModal from '../components/AlertModal';
import { useSettings } from '../context/SettingsContext';
import CustomSelect from '../components/CustomSelect';

export default function AddProduct() {
    const navigate = useNavigate();
    const { currency } = useSettings();
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [link, setLink] = useState('');
    const [image, setImage] = useState('');
    const { user } = useAuth();
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState([]);
    const [itemCount, setItemCount] = useState(0);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState({ isOpen: false, success: false, title: '', message: '' });

    useEffect(() => {
        const loadInitialData = async () => {
            setCategories(await db.categories.getAll());
            const items = await db.items.getAll();
            setItemCount(items.length);
            if (items.length >= 5 && !user?.isPremium) {
                setShowPremiumModal(true);
            }
        };
        loadInitialData();
    }, [user]);

    const handleUpgradeToPremium = async () => {
        try {
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
                        setPaymentStatus({
                            isOpen: true,
                            success: true,
                            title: 'wishflowlist.vercel.app says',
                            message: 'Payment Successful! Please relogin to activate your Premium features.'
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
                theme: { color: 'var(--primary)' },
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
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Bypass cache — directly query Supabase for the real count
        const { count, error: countError } = await supabase
            .from('items')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user?.id);

        if (!countError && count >= 5 && user?.isPremium !== true) {
            setShowPremiumModal(true);
            return;
        }

        if (!name || !price || !categoryId) return;
        await db.items.add({ name, price: parseFloat(price), link, image, category_id: parseInt(categoryId) });
        navigate('/');
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0]; if (!file) return;
        if (file.size > 500000) { alert('Image too large. Please use < 500 KB or a URL.'); return; }
        const reader = new FileReader();
        reader.onloadend = () => setImage(reader.result);
        reader.readAsDataURL(file);
    };

    const BLUE = '#4963E8';
    const labelSt = {
        display: 'block', marginBottom: '0.4rem',
        fontSize: '0.9rem', fontWeight: 500,
        color: 'var(--text-muted)',
    };

    return (
        <div className="form-page-layout">
            <button
                onClick={() => navigate(-1)}
                className="btn btn-ghost"
                style={{ marginBottom: '1.25rem', paddingLeft: 0, color: BLUE }}
            >
                <ArrowLeft size={18} /> Back
            </button>

            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{
                    fontSize: 'clamp(1.3rem, 2.5vw, 1.75rem)', fontWeight: 800,
                    background: 'linear-gradient(135deg, #4963E8, #3652D9)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                    Add New Item
                </h2>
                <p style={{ fontSize: '0.85rem', marginTop: '0.15rem' }}>Fill in the details below to save a product.</p>
            </div>

            <div style={{
                padding: 'clamp(0.5rem, 3vw, 1rem)',
            }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <label style={{ flex: '0 0 90px', color: 'var(--text-muted)', fontSize: '0.95rem', textAlign: 'left' }}>Name</label>
                        <input className="input" style={{ flex: 1 }} value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Wireless Headphones" />
                    </div>

                    {/* Price */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <label style={{ flex: '0 0 90px', color: 'var(--text-muted)', fontSize: '0.95rem', textAlign: 'left' }}>Price</label>
                        <input className="input" style={{ flex: 1 }} type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required placeholder="0.00" />
                    </div>

                    {/* Link */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <label style={{ flex: '0 0 90px', color: 'var(--text-muted)', fontSize: '0.95rem', textAlign: 'left' }}>Link</label>
                        <input className="input" style={{ flex: 1 }} type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://example.com/product" />
                    </div>

                    {/* Category */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <label style={{ flex: '0 0 90px', color: 'var(--text-muted)', fontSize: '0.95rem', textAlign: 'left' }}>Folder</label>
                        <div style={{ flex: 1 }}>
                            <CustomSelect
                                value={categoryId}
                                onChange={val => setCategoryId(val)}
                                options={categories.map(c => ({ value: c.id, label: c.name }))}
                                placeholder="Select Folder"
                                required
                            />
                        </div>
                    </div>

                    {/* Image */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                        <label style={{ flex: '0 0 90px', color: 'var(--text-muted)', fontSize: '0.95rem', textAlign: 'left', marginTop: '0.8rem' }}>Image</label>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {!image ? (
                                <label style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                                    width: '100%', padding: '0.85rem 1rem',
                                    background: 'var(--surface-2)', color: 'var(--primary)',
                                    borderRadius: '14px', cursor: isUploading ? 'wait' : 'pointer',
                                    border: '1.5px dashed var(--primary)', opacity: isUploading ? 0.7 : 1,
                                    fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s'
                                }}>
                                    {isUploading ? (
                                        <>
                                            <span style={{ width: '16px', height: '16px', border: '2px solid rgba(var(--primary-rgb),0.4)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                                            Uploading Image...
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={18} /> Upload Image
                                        </>
                                    )}
                                    <input type="file" accept="image/*" hidden onChange={handleImageUpload} disabled={isUploading} />
                                </label>
                            ) : (
                                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', maxHeight: '220px' }}>
                                    <img src={image} alt="Preview" style={{ width: '100%', objectFit: 'cover', maxHeight: '220px', display: 'block' }} />
                                    <button
                                        type="button" onClick={() => setImage('')}
                                        style={{
                                            position: 'absolute', top: '0.5rem', right: '0.5rem',
                                            background: 'rgba(0,0,0,0.6)', color: '#fff', backdropFilter: 'blur(4px)',
                                            borderRadius: '50%', border: 'none',
                                            width: '28px', height: '28px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
                        <div style={{ flex: '0 0 90px' }}></div>
                        <button
                            type="submit"
                            style={{
                                flex: 1, padding: '1rem', fontSize: '1rem',
                                background: 'var(--text)', color: 'var(--bg)',
                                border: 'none', borderRadius: '12px', fontWeight: 600,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                cursor: 'pointer'
                            }}
                        >
                            Save Product
                        </button>
                    </div>
                </form>
            </div>

            {/* Premium Upgrade Modal */}
            {showPremiumModal && createPortal(
                <div className="premium-modal-overlay" onClick={() => setShowPremiumModal(false)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: 'var(--surface)', borderRadius: '24px', padding: '2.5rem',
                        maxWidth: '400px', width: '90%', textAlign: 'center',
                        boxShadow: '0 24px 48px rgba(0,0,0,0.2)', position: 'relative',
                        animation: 'slideUp 0.25s cubic-bezier(0.2,0.8,0.4,1)'
                    }}>
                        <button
                            onClick={() => setShowPremiumModal(false)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <X size={24} color="#666" />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(217,119,6,0.1)', color: '#d97706', marginBottom: '1rem', flexShrink: 0, margin: '0 auto 1.5rem' }}>
                            <Crown size={24} />
                        </div>

                        <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800, fontSize: '1.25rem', color: 'var(--text)' }}>Unlock Limitless Wishes</h3>
                        <p style={{ margin: '0 0 1.25rem', color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                            You have reached the free tier limit of 5 items. Upgrade to WishFlow Premium for {new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 0 }).format(100)} and add unlimited wishes forever!
                        </p>

                        <button
                            onClick={handleUpgradeToPremium}
                            style={{
                                width: '100%', padding: '0.85rem', borderRadius: '14px', border: 'none',
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                boxShadow: '0 4px 12px rgba(217,119,6,0.3)', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <Crown size={18} />
                            Upgrade for {new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 0 }).format(100)}
                        </button>

                        <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>One-time payment. Lifetime access.</p>
                    </div>
                </div>,
                document.body
            )}

            <AlertModal
                isOpen={paymentStatus.isOpen}
                title={paymentStatus.title}
                message={paymentStatus.message}
                onConfirm={() => {
                    setPaymentStatus({ ...paymentStatus, isOpen: false });
                    if (paymentStatus.success) {
                        setShowPremiumModal(false);
                        navigate('/profile');
                    }
                }}
            />
        </div>
    );
}
