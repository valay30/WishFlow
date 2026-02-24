import { useState, useEffect } from 'react';
import { db, supabase } from '../db';
import { Upload, X, ArrowLeft, Sparkles, Crown } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';

export default function AddProduct() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [link, setLink] = useState('');
    const [image, setImage] = useState('');
    const { user } = useAuth();
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState([]);
    const [itemCount, setItemCount] = useState(0);
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            setCategories(await db.categories.getAll());
            const items = await db.items.getAll();
            setItemCount(items.length);
        };
        loadInitialData();
    }, []);

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
                        setShowPremiumModal(false);
                        navigate('/profile');
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
        fontSize: '0.78rem', fontWeight: 700,
        color: BLUE, letterSpacing: '0.04em', textTransform: 'uppercase',
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
                background: '#fff', borderRadius: '20px',
                border: '1px solid #E8ECF4',
                boxShadow: '0 4px 24px rgba(73,99,232,0.09)',
                padding: 'clamp(1.25rem, 3vw, 2rem)',
            }}>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>

                    {/* Name */}
                    <div>
                        <label style={labelSt}>Product Name</label>
                        <input className="input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Wireless Headphones" />
                    </div>

                    {/* Price */}
                    <div>
                        <label style={labelSt}>Price ($)</label>
                        <input className="input" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required placeholder="0.00" />
                    </div>

                    {/* Link */}
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelSt}>Product Link</label>
                        <input className="input" type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://example.com/product" />
                    </div>

                    {/* Category */}
                    <div>
                        <label style={labelSt}>Category</label>
                        <select className="select" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                            <option value="">Select Category</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* Image */}
                    <div>
                        <label style={labelSt}>Image</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                className="input"
                                placeholder="Paste Image URL..."
                                value={image.startsWith('data:') ? '' : image}
                                onChange={e => setImage(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <label style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                minWidth: '3rem', background: '#EEF1FD', color: BLUE,
                                borderRadius: '14px', cursor: 'pointer',
                                border: '1.5px dashed #a5b4fc', transition: 'background 0.2s',
                            }}>
                                <Upload size={18} />
                                <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                            </label>
                        </div>
                    </div>

                    {/* Image preview */}
                    {image && (
                        <div style={{ gridColumn: '1 / -1', position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #a5b4fc', maxHeight: '220px' }}>
                            <img src={image} alt="Preview" style={{ width: '100%', objectFit: 'cover', maxHeight: '220px', display: 'block' }} />
                            <button
                                type="button" onClick={() => setImage('')}
                                style={{
                                    position: 'absolute', top: '0.5rem', right: '0.5rem',
                                    background: 'rgba(255,255,255,0.9)', color: '#ef4444',
                                    borderRadius: '50%', border: 'none',
                                    width: '28px', height: '28px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ gridColumn: '1 / -1', padding: '1rem', fontSize: '1rem' }}
                    >
                        <Sparkles size={18} /> Save Product
                    </button>
                </form>
            </div>

            {/* Premium Upgrade Modal */}
            {showPremiumModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '24px', padding: '2.5rem',
                        maxWidth: '400px', width: '90%', textAlign: 'center',
                        boxShadow: '0 24px 48px rgba(0,0,0,0.2)', position: 'relative'
                    }}>
                        <button
                            onClick={() => setShowPremiumModal(false)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <X size={24} color="#666" />
                        </button>

                        <div style={{
                            width: '64px', height: '64px', background: 'linear-gradient(135deg, #10367D, #4963E8)',
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.5rem', color: '#fff'
                        }}>
                            <Crown size={32} />
                        </div>

                        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem', color: '#111' }}>Unlock Limitless</h2>
                        <p style={{ color: '#666', marginBottom: '2rem', lineHeight: '1.5' }}>
                            You have reached the free tier limit of 5 items. Upgrade to WishFlow Premium for ₹100 and add unlimited wishes forever!
                        </p>

                        <button
                            onClick={handleUpgradeToPremium}
                            style={{
                                width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #10367D, #4963E8)',
                                color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 800, fontSize: '1.1rem',
                                cursor: 'pointer', boxShadow: '0 8px 24px rgba(73,99,232,0.3)', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            Upgrade for ₹100
                        </button>

                        <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#999' }}>One-time payment. Lifetime access.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
