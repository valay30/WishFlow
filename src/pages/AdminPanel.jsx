import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Crown, Users, ShieldCheck, ArrowLeft, RefreshCw, CheckCircle, XCircle, Search, Trash2, Package } from 'lucide-react';
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
            } else {
                setUsers(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('fetchUsers error:', err);
            showToast('Failed to load data: ' + err.message, 'error');
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
    const totalItems = users.reduce((sum, u) => sum + (u.itemCount || 0), 0);

    if (!user?.isAdmin) return null;

    return (        <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: "'Outfit', sans-serif", color: '#111', paddingBottom: '15px' }} className="admin-page-wrapper">
            <div className="admin-app-card">

                {/* Toast */}
                {toast && (
                    <div style={{
                        position: 'fixed', top: '1rem', right: '1rem', left: '1rem', zIndex: 9999,
                        maxWidth: '400px', margin: '0 auto',
                        background: toast.type === 'error' ? '#ef4444' : '#22c55e',
                        color: '#fff', padding: '0.75rem 1.25rem', borderRadius: '16px',
                        fontWeight: 700, fontSize: '0.95rem', textAlign: 'center',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                        animation: 'fadeInUp 0.3s ease-out',
                    }}>
                        {toast.msg}
                    </div>
                )}

                {/* Header */}
                <div className="admin-header-bar">
                    <button
                        onClick={() => navigate('/')}
                        className="admin-header-btn"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '12px',
                            background: '#f5f5f7',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            border: '1px solid rgba(0,0,0,0.04)'
                        }}>
                            <ShieldCheck size={20} color="#111" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#111', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>WishFlow Admin</h1>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
                        </div>
                    </div>

                    <button
                        onClick={fetchUsers}
                        disabled={loading}
                        className="admin-header-btn"
                        style={{ opacity: loading ? 0.5 : 1 }}
                    >
                        <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                        <span className="refresh-text">Refresh</span>
                    </button>
                </div>

                <div className="admin-body-container">
                    {/* Stats */}
                    <div className="admin-stats-grid">
                        {[
                            { label: 'Total Users', val: users.length, icon: Users, color: '#58a6ff' },
                            { label: 'Total Items', val: totalItems, icon: Package, color: '#10b981' },
                            { label: 'Premium Users', val: premiumCount, icon: Crown, color: '#f59e0b' },
                            { label: 'Free Users', val: freeCount, icon: Users, color: '#8b949e' },
                        ].map(s => (
                            <div key={s.label} className="admin-stat-card">
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '12px',
                                    background: `${s.color}15`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <s.icon size={22} color={s.color} />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#111', lineHeight: 1, letterSpacing: '-0.02em' }}>{s.val}</p>
                                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>{s.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Search */}
                    <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: '#888', zIndex: 2 }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name or email..."
                            className="admin-search-input"
                        />
                    </div>

                    {/* Users List Container */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {/* Table header (Desktop only) */}
                        <div className="admin-table-header">
                            <span>User</span>
                            <span>Email</span>
                            <span>Items</span>
                            <span>Status</span>
                            <span>Actions</span>
                        </div>

                        {loading ? (
                            <div style={{ padding: '4rem', textAlign: 'center', color: '#888', fontWeight: 500 }}>Loading users…</div>
                        ) : filtered.length === 0 ? (
                            <div style={{ padding: '4rem', textAlign: 'center', color: '#888', fontWeight: 500 }}>No users found</div>
                        ) : (
                            filtered.map((u, i) => (
                                <div key={u.id} className="admin-user-row">
                                    {/* Mobile Header Info Row */}
                                    <div className="admin-user-info-group">
                                        <div style={{
                                            width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                                            background: u.isPremium ? 'linear-gradient(135deg,#f59e0b,#d97706)' : '#f0f0f0',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 700, fontSize: '0.9rem', color: u.isPremium ? '#fff' : '#555',
                                        }}>
                                            {(u.name || u.email)?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {u.name || '—'}
                                                </p>
                                                {u.isAdmin && <span style={{ fontSize: '0.65rem', background: '#eef2ff', color: '#4f46e5', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: 800 }}>Admin</span>}
                                            </div>
                                            <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#888' }}>{new Date(u.createdAt).toLocaleDateString()}</p>
                                        </div>

                                        {/* Mobile Status Badge */}
                                        <div className="admin-status-badge-mobile">
                                            {u.isPremium ? (
                                                <span className="admin-badge admin-badge-premium"><Crown size={12} /> Premium</span>
                                            ) : (
                                                <span className="admin-badge admin-badge-free">Free</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Email Row */}
                                    <div className="admin-user-email-col">
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#555', wordBreak: 'break-all' }}>{u.email}</p>
                                    </div>

                                    {/* Items Row */}
                                    <div className="admin-items-col">
                                        <span>{u.itemCount || 0}</span>
                                    </div>

                                    {/* Desktop Status Column */}
                                    <div className="admin-status-col-desktop">
                                        {u.isPremium ? (
                                            <span className="admin-badge admin-badge-premium"><Crown size={12} /> Premium</span>
                                        ) : (
                                            <span className="admin-badge admin-badge-free">Free</span>
                                        )}
                                    </div>

                                    {/* Actions Group */}
                                    <div className="admin-actions-group">
                                        {u.isPremium ? (
                                            <button
                                                onClick={() => revokePremium(u.id)}
                                                disabled={actionLoading === u.id + '_revoke' || u.id === user?.id}
                                                className="admin-btn admin-btn-revoke"
                                            >
                                                <XCircle size={15} />
                                                {actionLoading === u.id + '_revoke' ? 'Revoking…' : 'Revoke'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => grantPremium(u.id)}
                                                disabled={actionLoading === u.id + '_grant'}
                                                className="admin-btn admin-btn-grant"
                                            >
                                                <CheckCircle size={15} />
                                                {actionLoading === u.id + '_grant' ? 'Granting…' : 'Grant Premium'}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteUser(u.id)}
                                            disabled={actionLoading === u.id + '_delete' || u.id === user?.id}
                                            className="admin-btn admin-btn-delete"
                                        >
                                            <Trash2 size={15} />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @media (min-width: 640px) {
                    .admin-page-wrapper {
                        padding: 2rem;
                        display: flex; justify-content: center; align-items: flex-start;
                    }
                    .admin-app-card {
                        max-width: 1040px;
                        width: 100%;
                        background: #fff;
                        border-radius: 32px;
                        box-shadow: 0 12px 48px rgba(0,0,0,0.04);
                        border: 1px solid rgba(0,0,0,0.03);
                        overflow: hidden;
                        min-height: calc(100vh - 4rem);
                    }
                }
                @media (max-width: 639px) {
                    .admin-page-wrapper { background: #fff; padding-bottom: 0; }
                    .admin-app-card { min-height: 100vh; }
                }

                .admin-header-bar {
                    background: #fff;
                    padding: 1.25rem 2rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    border-bottom: 1px solid rgba(0,0,0,0.04);
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                .admin-header-btn {
                    display: flex; align-items: center; gap: 0.4rem;
                    background: #f5f5f7; border: 1px solid rgba(0,0,0,0.04);
                    color: #444; padding: 0.6rem 1rem; border-radius: 12px;
                    cursor: pointer; font-family: inherit; font-size: 0.9rem; font-weight: 700;
                    transition: all 0.2s; flex-shrink: 0;
                }
                .admin-header-btn:hover { background: #eee; }

                .admin-body-container {
                    padding: 2rem 2.5rem;
                }

                .admin-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1rem;
                    margin-bottom: 2.5rem;
                }
                .admin-stat-card {
                    background: #fafafa; border: 1px solid #f0f0f0; border-radius: 20px;
                    padding: 1.25rem; display: flex; align-items: center; gap: 1.25rem;
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .admin-stat-card:hover { 
                    background: #fff; transform: translateY(-3px); 
                    box-shadow: 0 12px 32px rgba(0,0,0,0.05); border-color: rgba(0,0,0,0.08); 
                }

                .admin-search-input {
                    width: 100%; box-sizing: border-box;
                    background: #f5f5f7; border: 1px solid rgba(0,0,0,0.04);
                    border-radius: 16px; color: #111; font-family: inherit;
                    font-size: 1.05rem; padding: 0.9rem 1rem 0.9rem 2.75rem;
                    outline: none; transition: all 0.2s;
                }
                .admin-search-input:focus {
                    background: #fff; border-color: #E85C2C; box-shadow: 0 0 0 4px rgba(232,92,44,0.1);
                }

                .admin-table-header {
                    display: grid;
                    grid-template-columns: 1.2fr 1.2fr 80px 130px 240px;
                    padding: 0 1.5rem 0.5rem;
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #888;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .admin-user-row {
                    display: grid;
                    grid-template-columns: 1.2fr 1.2fr 80px 130px 240px;
                    padding: 1.1rem 1.5rem;
                    align-items: center;
                    gap: 0.75rem;
                    background: #fff;
                    border: 1px solid #f0f0f0;
                    border-radius: 18px;
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .admin-user-row:hover {
                    background: #fafafa; border-color: #e8e8e8; box-shadow: 0 6px 16px rgba(0,0,0,0.03); transform: scale(1.002);
                }

                .admin-user-info-group { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
                .admin-status-badge-mobile { display: none; }
                .admin-status-col-desktop { display: block; }
                
                .admin-badge {
                    display: inline-flex; align-items: center; gap: 0.3rem;
                    padding: 0.35rem 0.75rem; border-radius: 99px;
                    font-size: 0.85rem; font-weight: 800;
                }
                .admin-badge-premium { background: #fffbeb; color: #d97706; border: 1px solid #fef3c7; }
                .admin-badge-free { background: #f5f5f5; color: #666; border: 1px solid #e5e5e5; }

                .admin-btn {
                    display: flex; align-items: center; justify-content: center; gap: 0.4rem;
                    padding: 0.5rem 1rem; border-radius: 99px;
                    cursor: pointer; font-family: inherit; font-size: 0.85rem; font-weight: 800;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); flex: 1; border: none;
                }
                .admin-btn-grant { background: #111; color: #fff; }
                .admin-btn-grant:hover:not(:disabled) {
                    background: #E85C2C; transform: scale(1.03); box-shadow: 0 6px 16px rgba(232,92,44,0.25);
                }
                .admin-btn-revoke { background: #fff5f5; color: #ef4444; border: 1px solid #fee2e2; }
                .admin-btn-revoke:hover:not(:disabled) {
                    background: #fee2e2; transform: scale(1.03);
                }
                .admin-btn-delete { background: #fafafa; color: #ef4444; border: 1px solid #f0f0f0; }
                .admin-btn-delete:hover:not(:disabled) {
                    background: #fff5f5; border-color: #fee2e2; transform: scale(1.03); color: #dc2626;
                }
                .admin-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; box-shadow: none !important; }

                @media (max-width: 1024px) {
                    .admin-stats-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (max-width: 768px) {
                    .admin-header-bar { padding: 1rem; gap: 0.75rem; }
                    .admin-body-container { padding: 1rem 1.25rem; }
                    .admin-stats-grid { grid-template-columns: 1fr; gap: 0.75rem; margin-bottom: 1.5rem; }
                    .admin-table-header { display: none; }
                    .admin-user-row {
                        display: flex; flex-direction: column; align-items: flex-start;
                        gap: 0.85rem; padding: 1.25rem; background: #fafafa;
                    }
                    .admin-user-info-group { justify-content: flex-start; width: 100%; }
                    .admin-status-badge-mobile { display: block; margin-left: auto; }
                    .admin-status-col-desktop { display: none; }
                    .admin-user-email-col { padding-left: 0; margin-top: -0.25rem; }
                    .admin-items-col {
                        display: flex; align-items: center; gap: 0.5rem;
                        padding: 0; background: transparent; border: none;
                    }
                    .admin-items-col::before {
                        content: 'Total Items:'; color: #888; font-size: 0.9rem; font-weight: 600;
                    }
                    .admin-items-col span {
                        font-size: 1.05rem; color: #111; font-weight: 900;
                    }
                    .admin-actions-group {
                        display: flex; gap: 0.75rem; width: 100%; margin-top: 0.25rem;
                        padding-top: 1rem; border-top: 1px solid #e8e8e8;
                    }
                    .refresh-text { display: none; }
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
