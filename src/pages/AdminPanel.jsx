import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Crown, Users, ShieldCheck, ArrowLeft, RefreshCw, CheckCircle, XCircle, Search, Trash2 } from 'lucide-react';
import { API_URL as API, ADMIN_SECRET } from '../config';
import AlertModal from '../components/AlertModal';

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
    const [deleteTargetUserId, setDeleteTargetUserId] = useState(null);

    // Redirect non-admins immediately
    useEffect(() => {
        if (user && !user.isAdmin) navigate('/', { replace: true });
    }, [user, navigate]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/admin/users`, { headers });
            const data = await res.json();
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

    const deleteUser = (userId) => {
        setDeleteTargetUserId(userId);
    };

    const confirmDeleteUser = async () => {
        if (!deleteTargetUserId) return;
        const userId = deleteTargetUserId;
        setDeleteTargetUserId(null);
        setActionLoading(userId + '_delete');
        try {
            const res = await fetch(`${API}/api/admin/users/${userId}`, {
                method: 'DELETE', headers,
            });
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== userId));
                showToast('User deleted');
            } else {
                const data = await res.json();
                throw new Error(data.details || data.error || 'Failed');
            }
        } catch (err) {
            showToast('Failed to delete user: ' + err.message, 'error');
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
                    position: 'fixed', top: '1rem', right: '1rem', left: '1rem', zIndex: 9999,
                    maxWidth: '400px', margin: '0 auto',
                    background: toast.type === 'error' ? '#ef4444' : '#22c55e',
                    color: '#fff', padding: '0.75rem 1.25rem', borderRadius: '12px',
                    fontWeight: 700, fontSize: '0.9rem', textAlign: 'center',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    animation: 'fadeInUp 0.3s ease-out',
                }}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="admin-header-bar">
                <button
                    onClick={() => navigate('/')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        background: 'rgba(255,255,255,0.08)', border: '1px solid #30363d',
                        color: '#8b949e', padding: '0.5rem 0.9rem', borderRadius: '8px',
                        cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600,
                        transition: 'all 0.2s', flexShrink: 0
                    }}
                >
                    <ArrowLeft size={15} /> Back
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                        <ShieldCheck size={18} color="#fff" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#e6edf3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>WishFlow Admin</h1>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#8b949e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Logged in as {user?.email}</p>
                    </div>
                </div>

                <button
                    onClick={fetchUsers}
                    disabled={loading}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        background: 'rgba(255,255,255,0.07)', border: '1px solid #30363d',
                        color: '#8b949e', padding: '0.5rem 0.9rem', borderRadius: '8px',
                        cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600,
                        transition: 'all 0.2s', opacity: loading ? 0.5 : 1, flexShrink: 0
                    }}
                >
                    <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    <span className="refresh-text">Refresh</span>
                </button>
            </div>

            <div className="admin-body-container">

                {/* Stats */}
                <div className="admin-stats-grid">
                    {[
                        { label: 'Total Users', val: users.length, icon: Users, color: '#58a6ff' },
                        { label: 'Premium Users', val: premiumCount, icon: Crown, color: '#f59e0b' },
                        { label: 'Free Users', val: freeCount, icon: Users, color: '#8b949e' },
                    ].map(s => (
                        <div key={s.label} style={{
                            background: '#161b22', border: '1px solid #30363d', borderRadius: '16px',
                            padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
                        }}>
                            <div style={{
                                width: '42px', height: '42px', borderRadius: '12px',
                                background: `${s.color}22`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                <s.icon size={20} color={s.color} />
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#e6edf3', lineHeight: 1 }}>{s.val}</p>
                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#8b949e', fontWeight: 600 }}>{s.label}</p>
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
                            borderRadius: '12px', color: '#e6edf3', fontFamily: 'inherit',
                            fontSize: '0.9rem', padding: '0.75rem 1rem 0.75rem 2.75rem',
                            outline: 'none', transition: 'border-color 0.2s',
                        }}
                        onFocus={e => e.target.style.borderColor = '#58a6ff'}
                        onBlur={e => e.target.style.borderColor = '#30363d'}
                    />
                </div>

                {/* Table / Cards Container */}
                <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '16px', overflow: 'hidden' }}>
                    {/* Table header (Desktop only) */}
                    <div className="admin-table-header">
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
                            <div key={u.id} className="admin-user-row" style={{
                                borderBottom: i < filtered.length - 1 ? '1px solid #21262d' : 'none',
                            }}>
                                {/* Mobile Header Info Row */}
                                <div className="admin-user-info-group">
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                                        background: u.isPremium ? 'linear-gradient(135deg,#d97706,#f59e0b)' : '#30363d',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 800, fontSize: '0.85rem', color: '#fff',
                                    }}>
                                        {(u.name || u.email)?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#e6edf3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {u.name || '—'}
                                            </p>
                                            {u.isAdmin && <span style={{ fontSize: '0.65rem', background: '#1f6feb', color: '#58a6ff', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>Admin</span>}
                                        </div>
                                        <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: '#8b949e' }}>{new Date(u.createdAt).toLocaleDateString()}</p>
                                    </div>

                                    {/* Mobile Status Badge */}
                                    <div className="admin-status-badge-mobile">
                                        {u.isPremium ? (
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
                                                border: '1px solid rgba(245,158,11,0.3)',
                                                padding: '0.25rem 0.65rem', borderRadius: '99px',
                                                fontSize: '0.72rem', fontWeight: 800,
                                            }}>
                                                <Crown size={11} /> Premium
                                            </span>
                                        ) : (
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                background: 'rgba(139,148,158,0.15)', color: '#8b949e',
                                                border: '1px solid #30363d',
                                                padding: '0.25rem 0.65rem', borderRadius: '99px',
                                                fontSize: '0.72rem', fontWeight: 700,
                                            }}>
                                                Free
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Email Row */}
                                <div className="admin-user-email-col">
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#8b949e', wordBreak: 'break-all' }}>{u.email}</p>
                                </div>

                                {/* Desktop Status Column */}
                                <div className="admin-status-col-desktop">
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

                                {/* Actions Group */}
                                <div className="admin-actions-group">
                                    {u.isPremium ? (
                                        <button
                                            onClick={() => revokePremium(u.id)}
                                            disabled={actionLoading === u.id + '_revoke' || u.id === user?.id}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                                                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                                                color: '#f87171', padding: '0.5rem 0.9rem', borderRadius: '8px',
                                                cursor: u.id === user?.id ? 'not-allowed' : 'pointer',
                                                fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 700,
                                                opacity: actionLoading === u.id + '_revoke' ? 0.6 : 1,
                                                transition: 'all 0.2s', flex: 1
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
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                                                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
                                                color: '#f59e0b', padding: '0.5rem 0.9rem', borderRadius: '8px',
                                                cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 700,
                                                opacity: actionLoading === u.id + '_grant' ? 0.6 : 1,
                                                transition: 'all 0.2s', flex: 1
                                            }}
                                        >
                                            <CheckCircle size={13} />
                                            {actionLoading === u.id + '_grant' ? 'Granting…' : 'Grant Premium'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteUser(u.id)}
                                        disabled={actionLoading === u.id + '_delete' || u.id === user?.id}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                                            background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)',
                                            color: '#ef4444', padding: '0.5rem 0.9rem', borderRadius: '8px',
                                            cursor: u.id === user?.id ? 'not-allowed' : 'pointer',
                                            fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 700,
                                            opacity: actionLoading === u.id + '_delete' || u.id === user?.id ? 0.4 : 1,
                                            transition: 'all 0.2s', flex: 1
                                        }}
                                    >
                                        <Trash2 size={13} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>


            </div>

            <style>{`
                .admin-header-bar {
                    background: linear-gradient(135deg, #161b22 0%, #0d1117 100%);
                    border-bottom: 1px solid #30363d;
                    padding: 1.25rem 2rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .admin-body-container {
                    max-width: 1100px;
                    margin: 0 auto;
                    padding: 2rem 1.5rem;
                }
                .admin-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                    margin-bottom: 2rem;
                }
                .admin-table-header {
                    display: grid;
                    grid-template-columns: 1.2fr 1.2fr 130px 240px;
                    padding: 0.85rem 1.5rem;
                    background: #0d1117;
                    border-bottom: 1px solid #30363d;
                    font-size: 0.72rem;
                    font-weight: 700;
                    color: #8b949e;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }
                .admin-user-row {
                    display: grid;
                    grid-template-columns: 1.2fr 1.2fr 130px 240px;
                    padding: 1rem 1.5rem;
                    align-items: center;
                    gap: 0.5rem;
                    transition: background 0.15s;
                }
                .admin-user-row:hover {
                    background: #1c2128;
                }
                .admin-user-info-group {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    min-width: 0;
                }
                .admin-status-badge-mobile {
                    display: none;
                }
                .admin-status-col-desktop {
                    display: block;
                }
                .admin-actions-group {
                    display: flex;
                    gap: 0.5rem;
                }

                @media (max-width: 768px) {
                    .admin-header-bar {
                        padding: 1rem;
                        gap: 0.75rem;
                    }
                    .admin-body-container {
                        padding: 1rem 0.85rem;
                    }
                    .admin-stats-grid {
                        grid-template-columns: 1fr;
                        gap: 0.75rem;
                        margin-bottom: 1.25rem;
                    }
                    .admin-table-header {
                        display: none;
                    }
                    .admin-user-row {
                        display: flex;
                        flex-direction: column;
                        align-items: stretch;
                        gap: 0.75rem;
                        padding: 1rem;
                    }
                    .admin-user-info-group {
                        justify-content: space-between;
                        width: 100%;
                    }
                    .admin-status-badge-mobile {
                        display: block;
                    }
                    .admin-status-col-desktop {
                        display: none;
                    }
                    .admin-user-email-col {
                        padding-left: 0.25rem;
                    }
                    .admin-actions-group {
                        width: 100%;
                        margin-top: 0.25rem;
                    }
                    .refresh-text {
                        display: none;
                    }
                }

                @keyframes fadeInUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
            <AlertModal
                isOpen={deleteTargetUserId !== null}
                title="WishFlow"
                message="Are you sure you want to permanently delete this user?"
                cancelText="Cancel"
                confirmText="OK"
                isDestructive={true}
                onCancel={() => setDeleteTargetUserId(null)}
                onConfirm={confirmDeleteUser}
            />
        </div>
    );
}
