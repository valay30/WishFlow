import React from 'react';
import { Crown, Users, Package, Trash2, Edit2, Check, X, XCircle, ChevronLeft, ChevronRight, Search, Calendar } from 'lucide-react';
import CustomSelect from '../CustomSelect';
import { useAdminContext } from '../../context/AdminContext';

export default function UsersTab({
    search, statusFilter, currentPage, setCurrentPage, usersPerPage, setUsersPerPage,
    handleEditUserClick, handleDeleteUserClick, handleTogglePremiumClick,
    grantPremium, revokePremium, deleteUser, actionLoading,
    editingUser, setEditingUser, handleSaveUser, showToast, totalItemsCount, premiumCount, freeCount
}) {
    const { users, loadingUsers } = useAdminContext();
    
    const getInitials = (name, email) => {
        if (name) return name.substring(0, 2).toUpperCase();
        if (email) return email.substring(0, 2).toUpperCase();
        return 'U';
    };

    const getAvatarColor = (name) => {
        const colors = [
            { bg: '#eef2ff', text: '#4f46e5' },
            { bg: '#fff7ed', text: '#ea580c' },
            { bg: '#f0fdf4', text: '#16a34a' },
            { bg: '#fdf2f8', text: '#db2777' },
            { bg: '#fef2f2', text: '#dc2626' },
            { bg: '#fefce8', text: '#ca8a04' }
        ];
        let hash = 0;
        for (let i = 0; i < (name || '').length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const filteredUsers = users.filter(u => {
        if (statusFilter === 'premium' && !u.isPremium) return false;
        if (statusFilter === 'free' && u.isPremium) return false;
        if (search) {
            const s = search.toLowerCase();
            return (u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s));
        }
        return true;
    });
    
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;
    const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
    const currentUsers = filteredUsers.slice((validCurrentPage - 1) * usersPerPage, validCurrentPage * usersPerPage);

    return (
        <React.Fragment>
                            <>
                                {/* Stats Cards */}
                                <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                                    {loadingUsers ? (
                                        Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="admin-stat-card" style={{ background: 'var(--surface)', border: '1px solid #f1f5f9', borderRadius: '16px', padding: '1.5rem', display: 'flex', gap: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                                                <div className="skeleton-shimmer" style={{ width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0 }} />
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <div className="skeleton-shimmer" style={{ height: '28px', width: '50%' }} />
                                                    <div className="skeleton-shimmer" style={{ height: '14px', width: '80%' }} />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        [
                                            { val: users.length, label: 'Total Users', icon: Users, bg: '#f5f3ff', color: '#7c3aed' },
                                            { val: totalItemsCount, label: 'Total Items', icon: Package, bg: '#ecfdf5', color: '#10b981' },
                                            { val: premiumCount, label: 'Premium Users', icon: Crown, bg: '#fff7ed', color: '#f59e0b' },
                                            { val: freeCount, label: 'Free Users', icon: Users, bg: '#eff6ff', color: '#3b82f6' },
                                        ].map((s, i) => (
                                            <div key={i} className="admin-stat-card" style={{ background: 'var(--surface)', border: '1px solid #f1f5f9', borderRadius: '16px', padding: '1.5rem', display: 'flex', gap: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -2px rgba(0, 0, 0, 0.02)' }}>
                                                <div className="admin-stat-icon-wrapper" style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <s.icon size={24} />
                                                </div>
                                                <div className="admin-stat-text-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <p className="admin-stat-val" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{s.val}</p>
                                                    <p className="admin-stat-label" style={{ margin: '0.4rem 0 0', fontSize: '0.9rem', fontWeight: 700, color: '#334155', lineHeight: 1.2 }}>{s.label}</p>
                                                    {s.sub && <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>{s.sub}</p>}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Table */}
                                <div className="admin-table-wrapper" style={{ background: 'var(--surface)', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                                    {/* Table Header */}
                                    <div className="admin-table-header" style={{ display: 'grid', gridTemplateColumns: '2.5fr 2fr 1fr 1fr 2.5fr', padding: '1rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <span>User</span>
                                        <span>Email</span>
                                        <span>Items</span>
                                        <span>Status</span>
                                        <span style={{ textAlign: 'center' }}>Actions</span>
                                    </div>

                                    {/* Table Body */}
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        {loadingUsers ? (
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                {Array.from({ length: 6 }).map((_, i) => (
                                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '2.5fr 2fr 1fr 1fr 2.5fr', padding: '1.25rem 1.5rem', alignItems: 'center', borderBottom: i < 5 ? '1px solid #f1f5f9' : 'none', gap: '1rem' }}>
                                                        {/* User col */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                            <div className="skeleton-shimmer" style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }} />
                                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                                <div className="skeleton-shimmer" style={{ height: '13px', width: '65%' }} />
                                                                <div className="skeleton-shimmer" style={{ height: '11px', width: '40%' }} />
                                                            </div>
                                                        </div>
                                                        {/* Email col */}
                                                        <div className="skeleton-shimmer" style={{ height: '13px', width: '80%' }} />
                                                        {/* Items col */}
                                                        <div className="skeleton-shimmer" style={{ height: '13px', width: '30px' }} />
                                                        {/* Status col */}
                                                        <div className="skeleton-shimmer" style={{ height: '24px', width: '60px', borderRadius: '99px' }} />
                                                        {/* Actions col */}
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                            <div className="skeleton-shimmer" style={{ height: '34px', width: '100px', borderRadius: '8px' }} />
                                                            <div className="skeleton-shimmer" style={{ height: '34px', width: '80px', borderRadius: '8px' }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : currentUsers.length === 0 ? (
                                            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No users found</div>
                                        ) : (
                                            currentUsers.map((u, i) => {
                                                const avatarColor = getAvatarColor(u.name || u.email);
                                                return (
                                                    <div key={u.id}>
                                                        {/* ===== DESKTOP TABLE ROW ===== */}
                                                        <div className={`admin-table-row admin-desktop-row ${u.isPremium ? 'premium-card' : 'free-card'}`} style={{ display: 'grid', gridTemplateColumns: '2.5fr 2fr 1fr 1fr 2.5fr', padding: '1.25rem 1.5rem', alignItems: 'center', borderBottom: i !== currentUsers.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.2s' }}>
                                                            {/* User Col */}
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: avatarColor.bg, color: avatarColor.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
                                                                    {getInitials(u.name, u.email)}
                                                                </div>
                                                                <div style={{ minWidth: 0, paddingRight: '1rem' }}>
                                                                    <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name || 'Unknown'}</p>
                                                                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                        <Calendar size={12} /> {new Date(u.createdAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {/* Email Col */}
                                                            <div style={{ color: '#475569', fontSize: '0.9rem', paddingRight: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
                                                            {/* Items Col */}
                                                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>{u.itemCount || 0}</div>
                                                            {/* Status Col */}
                                                            <div>
                                                                {u.isPremium ? (
                                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', background: '#fff7ed', color: '#ea580c', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700 }}>
                                                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ea580c' }}></span>Premium
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', background: '#eff6ff', color: '#2563eb', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700 }}>
                                                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb' }}></span>Free
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {/* Actions Col */}
                                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                                {u.isPremium ? (
                                                                    <button onClick={() => revokePremium(u.id)} disabled={actionLoading === u.id + '_revoke'} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem', background: '#fff1f2', color: '#e11d48', border: '1px solid #ffe4e6', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }} title="Revoke Premium">
                                                                        <XCircle size={16} /> <span>Revoke</span>
                                                                    </button>
                                                                ) : (
                                                                    <button onClick={() => grantPremium(u.id)} disabled={actionLoading === u.id + '_grant'} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(99,102,241,0.2)' }} title="Grant Premium">
                                                                        <Crown size={16} /> <span>Grant Premium</span>
                                                                    </button>
                                                                )}
                                                                <button onClick={() => deleteUser(u.id)} disabled={actionLoading === u.id + '_delete'} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem', background: '#fff1f2', color: '#e11d48', border: '1px solid #ffe4e6', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }} title="Delete user">
                                                                    <Trash2 size={16} /> <span>Delete</span>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* ===== MOBILE CARD ===== */}
                                                        <div className={`admin-mobile-card ${u.isPremium ? 'premium-card' : 'free-card'}`}>
                                                            <div className="admin-mobile-badge">{u.isPremium ? 'PREMIUM' : 'FREE'}</div>
                                                            <div className="admin-mobile-card-body">
                                                                {/* Avatar + Name */}
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: avatarColor.bg, color: avatarColor.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
                                                                        {getInitials(u.name, u.email)}
                                                                    </div>
                                                                    <div>
                                                                        <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{u.name || 'Unknown'}</p>
                                                                        <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                            <Calendar size={11} /> {new Date(u.createdAt).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {/* Email */}
                                                                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.82rem', color: '#475569', paddingLeft: '0' }}>{u.email}</p>
                                                                {/* Items */}
                                                                <p style={{ margin: '0 0 1rem 0', fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>Total Items: {u.itemCount || 0}</p>
                                                                {/* Buttons — ALWAYS TWO SIDE BY SIDE */}
                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                                                                    {u.isPremium ? (
                                                                        <button onClick={() => revokePremium(u.id)} disabled={actionLoading === u.id + '_revoke'} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', padding: '0.7rem', background: '#fff1f2', color: '#e11d48', border: '1px solid #ffe4e6', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', width: '100%' }}>
                                                                            <XCircle size={15} /> Revoke
                                                                        </button>
                                                                    ) : (
                                                                        <button onClick={() => grantPremium(u.id)} disabled={actionLoading === u.id + '_grant'} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', padding: '0.7rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', width: '100%', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
                                                                            <Crown size={15} /> Grant
                                                                        </button>
                                                                    )}
                                                                    <button onClick={() => deleteUser(u.id)} disabled={actionLoading === u.id + '_delete'} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', padding: '0.7rem', background: '#fff1f2', color: '#e11d48', border: '1px solid #ffe4e6', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', width: '100%' }}>
                                                                        <Trash2 size={15} /> Delete
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                {/* Pagination Footer Users */}
                                {!loadingUsers && filteredUsers.length > 0 && (
                                    <div className="admin-pagination-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '0 0.5rem', paddingBottom: '2rem', flexWrap: 'nowrap', gap: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: '#64748b', opacity: currentPage === 1 ? 0.5 : 1 }}
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                            {Array.from({ length: totalPages })
                                                .map((_, i) => i + 1)
                                                .filter(page => Math.abs(currentPage - page) <= 1)
                                                .map(page => (
                                                    <button
                                                        key={page}
                                                        onClick={() => setCurrentPage(page)}
                                                        style={{
                                                            width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            background: currentPage === page ? '#eef2ff' : '#fff',
                                                            border: `1px solid ${currentPage === page ? '#c7d2fe' : '#e2e8f0'}`,
                                                            color: currentPage === page ? '#4f46e5' : '#64748b',
                                                            borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
                                                        }}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: '#64748b', opacity: currentPage === totalPages ? 0.5 : 1 }}
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span className="admin-rows-text">Rows per page:</span>
                                                <div style={{ width: '80px' }}>
                                                    <CustomSelect
                                                        value={usersPerPage}
                                                        onChange={(val) => { setUsersPerPage(Number(val)); setCurrentPage(1); }}
                                                        options={[5, 10, 20, 50]}
                                                        style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'var(--surface)', color: '#0f172a', fontSize: '0.85rem' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                )}
                            </>
        </React.Fragment>
    );
}
