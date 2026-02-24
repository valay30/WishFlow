import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, ExternalLink } from 'lucide-react';

const BG = '#EBEBEB';
const SURFACE = '#FFFFFF';
const ORANGE = '#10367D';

export default function SharedWishlist() {
    const { key } = useParams();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSharedItems = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/share/${key}`);
                if (!response.ok) throw new Error('Invalid or expired share link');
                const data = await response.json();
                setItems(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSharedItems();
    }, [key]);

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG }}>
            <p style={{ fontWeight: 700, color: ORANGE }}>Loading Shared Wishlist...</p>
        </div>
    );

    if (error) return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: BG, padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😕</div>
            <h2 style={{ fontWeight: 900, color: '#111' }}>Oops!</h2>
            <p style={{ color: '#666', marginBottom: '2rem' }}>{error}</p>
            <button
                onClick={() => navigate('/auth')}
                style={{ padding: '0.8rem 1.5rem', background: ORANGE, color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
                Login to WishFlow
            </button>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: BG, paddingBottom: '3rem' }}>
            <div style={{
                background: `linear-gradient(160deg, #051A44 0%, #0A2665 55%, #10367D 100%)`,
                padding: '3rem 1.5rem',
                color: '#fff',
                textAlign: 'center'
            }}>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Shared Wishlist</h1>
                <p style={{ opacity: 0.8, fontWeight: 600 }}>Curated via WishFlow</p>
            </div>

            <div style={{ maxWidth: '600px', margin: '-2rem auto 0', padding: '0 1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {items.length === 0 ? (
                        <div style={{ background: SURFACE, padding: '3rem', borderRadius: '24px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                            <ShoppingBag size={48} color="#D1D5DB" style={{ marginBottom: '1rem' }} />
                            <p style={{ color: '#666', fontWeight: 600 }}>This wishlist is empty</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} style={{
                                background: SURFACE,
                                borderRadius: '24px',
                                padding: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                                animation: 'fadeInUp 0.5s ease-out backwards'
                            }}>
                                {item.image ? (
                                    <img src={item.image} alt={item.name} style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: '#F3F4F6' }} />
                                )}
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {item.categories?.name}
                                    </span>
                                    <h3 style={{ margin: '0.2rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#111' }}>{item.name}</h3>
                                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#059669' }}>₹{item.price?.toLocaleString()}</p>
                                </div>
                                {item.link && (
                                    <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16,54,125,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ORANGE }}
                                    >
                                        <ExternalLink size={20} />
                                    </a>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
