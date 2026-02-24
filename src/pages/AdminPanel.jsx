import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Crown, Users, ShieldCheck, ArrowLeft, RefreshCw, CheckCircle, XCircle, Search } from 'lucide-react';

const API = 'http://localhost:5000';
const ADMIN_SECRET = 'wishflow-admin-2024';

const headers = {
    'Content-Type': 'application/json',
    'x-admin-secret': ADMIN_SECRET,
};

export default function AdminPanel() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState(null); // userId being acted on
    const [toast, setToast] = useState(null);

    // Redirect non-admins immediately
    useEffect(() => {
        if (user && !user.isAdmin) navigate('/', { replace: true });
    }, [user, navigate]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/admin/users`, { headers });
            const data = await res.json();
            console.log('Admin API response:', res.status, data);
            if (!res.ok) {
                showToast(`API error ${res.status}: ${data.error || 'Unknown'}`, 'error');
                setUsers([]);
                return;
            }
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('fetchUsers error:', err);
            showToast('Failed to load users: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const grantPremium = async (userId) => {
        setActionLoading(userId + '_grant');
        try {
            const res = await fetch(`${API}/api/admin/grant-premium`, {
                method: 'POST', headers,
                body: JSON.stringify({ userId }),
            });
            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, isPremium: true } : u));
                showToast('Premium granted ✓');
            } else throw new Error();
        } catch {
            showToast('Failed to grant premium', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const revokePremium = async (userId) => {
        setActionLoading(userId + '_revoke');
        try {
            const res = await fetch(`${API}/api/admin/revoke-premium`, {
                method: 'POST', headers,
                body: JSON.stringify({ userId }),
            });
            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, isPremium: false } : u));
                showToast('Premium revoked');
            } else throw new Error();
        } catch {
            showToast('Failed to revoke premium', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const filtered = users.filter(u =>
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.name?.toLowerCase().includes(search.toLowerCase())
    );

    const premiumCount = users.filter(u => u.isPremium).length;
    const freeCount = users.length - premiumCount;

    if (!user?.isAdmin) return null;

    return (
        <div style={{ minHeight: '100vh', background: '#0D1117', fontFamily: "'Inter', sans-serif", color: '#e6edf3' }}>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
                    background: toast.type === 'error' ? '#ef4444' : '#22c55e',
                    color: '#fff', padding: '0.75rem 1.25rem', borderRadius: '12px',
                    fontWeight: 700, fontSize: '0.9rem',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    animation: 'fadeInUp 0.3s ease-out',
                }}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #161b22 0%, #0d1117 100%)',
                borderBottom: '1px solid #30363d',
                padding: '1.25rem 2rem',
                display: 'flex', alignItems: 'center', gap: '1rem',
            }}>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        background: 'rgba(255,255,255,0.08)', border: '1px solid #30363d',
                        color: '#8b949e', padding: '0.5rem 0.9rem', borderRadius: '8px',
                        cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600,
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#e6edf3'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#8b949e'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                >
                    <ArrowLeft size={15} /> Back
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <ShieldCheck size={18} color="#fff" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#e6edf3' }}>WishFlow Admin</h1>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#8b949e' }}>Logged in as {user?.email}</p>
                    </div>
                </div>

                <button
                    onClick={fetchUsers}
                    disabled={loading}
                    style={{
                        marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem',
                        background: 'rgba(255,255,255,0.07)', border: '1px solid #30363d',
                        color: '#8b949e', padding: '0.5rem 0.9rem', borderRadius: '8px',
                        cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600,
                        transition: 'all 0.2s', opacity: loading ? 0.5 : 1,
                    }}
                >
                    <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    Refresh
                </button>
            </div>

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Users', val: users.length, icon: Users, color: '#58a6ff' },
                        { label: 'Premium Users', val: premiumCount, icon: Crown, color: '#f59e0b' },
                        { label: 'Free Users', val: freeCount, icon: Users, color: '#8b949e' },
                    ].map(s => (
                        <div key={s.label} style={{
                            background: '#161b22', border: '1px solid #30363d', borderRadius: '16px',
                            padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem',
                        }}>
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '12px',
                                background: `${s.color}22`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                <s.icon size={20} color={s.color} />
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#e6edf3', lineHeight: 1 }}>{s.val}</p>
                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#8b949e', fontWeight: 600 }}>{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                    <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#8b949e' }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        style={{
                            width: '100%', boxSizing: 'border-box',
                            background: '#161b22', border: '1px solid #30363d',
                            borderRadius: '10px', color: '#e6edf3', fontFamily: 'inherit',
                            fontSize: '0.9rem', padding: '0.75rem 1rem 0.75rem 2.75rem',
                            outline: 'none', transition: 'border-color 0.2s',
                        }}
                        onFocus={e => e.target.style.borderColor = '#58a6ff'}
                        onBlur={e => e.target.style.borderColor = '#30363d'}
                    />
                </div>

                {/* Table */}
                <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '16px', overflow: 'hidden' }}>
                    {/* Table header */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr 140px 200px',
                        padding: '0.85rem 1.5rem', background: '#0d1117',
                        borderBottom: '1px solid #30363d',
                        fontSize: '0.72rem', fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>
                        <span>User</span>
                        <span>Email</span>
                        <span>Status</span>
                        <span>Actions</span>
                    </div>

                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#8b949e' }}>Loading users…</div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#8b949e' }}>No users found</div>
                    ) : (
                        filtered.map((u, i) => (
                            <div key={u.id} style={{
                                display: 'grid', gridTemplateColumns: '1fr 1fr 140px 200px',
                                padding: '1rem 1.5rem', alignItems: 'center', gap: '0.5rem',
                                borderBottom: i < filtered.length - 1 ? '1px solid #21262d' : 'none',
                                transition: 'background 0.15s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = '#1c2128'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                {/* Name */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                                    <div style={{
                                        width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                                        background: u.isPremium ? 'linear-gradient(135deg,#d97706,#f59e0b)' : '#30363d',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 800, fontSize: '0.85rem', color: '#fff',
                                    }}>
                                        {(u.name || u.email)?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#e6edf3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {u.name || '—'}
                                            {u.isAdmin && <span style={{ marginLeft: '0.4rem', fontSize: '0.65rem', background: '#1f6feb', color: '#58a6ff', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>Admin</span>}
                                        </p>
                                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#8b949e' }}>{new Date(u.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {/* Email */}
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#8b949e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</p>

                                {/* Status */}
                                <div>
                                    {u.isPremium ? (
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                            background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
                                            border: '1px solid rgba(245,158,11,0.3)',
                                            padding: '0.3rem 0.7rem', borderRadius: '99px',
                                            fontSize: '0.75rem', fontWeight: 800,
                                        }}>
                                            <Crown size={11} /> Premium
                                        </span>
                                    ) : (
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                            background: 'rgba(139,148,158,0.15)', color: '#8b949e',
                                            border: '1px solid #30363d',
                                            padding: '0.3rem 0.7rem', borderRadius: '99px',
                                            fontSize: '0.75rem', fontWeight: 700,
                                        }}>
                                            Free
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {u.isPremium ? (
                                        <button
                                            onClick={() => revokePremium(u.id)}
                                            disabled={actionLoading === u.id + '_revoke' || u.id === user?.id}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.35rem',
                                                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                                                color: '#f87171', padding: '0.45rem 0.9rem', borderRadius: '8px',
                                                cursor: u.id === user?.id ? 'not-allowed' : 'pointer',
                                                fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 700,
                                                opacity: actionLoading === u.id + '_revoke' ? 0.6 : 1,
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <XCircle size={13} />
                                            {actionLoading === u.id + '_revoke' ? 'Revoking…' : 'Revoke'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => grantPremium(u.id)}
                                            disabled={actionLoading === u.id + '_grant'}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.35rem',
                                                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
                                                color: '#f59e0b', padding: '0.45rem 0.9rem', borderRadius: '8px',
                                                cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 700,
                                                opacity: actionLoading === u.id + '_grant' ? 0.6 : 1,
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <CheckCircle size={13} />
                                            {actionLoading === u.id + '_grant' ? 'Granting…' : 'Grant Premium'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <p style={{ textAlign: 'center', color: '#3d444d', fontSize: '0.75rem', marginTop: '2rem' }}>
                    WishFlow Admin Panel · Changes take effect after user re-login
                </p>
            </div>

            <style>{`
                @keyframes fadeInUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
