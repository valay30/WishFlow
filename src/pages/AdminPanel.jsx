import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import {
    Crown, Users, ArrowLeft, RefreshCw, Search, Trash2, Package,
    Filter, Calendar, ChevronLeft, ChevronRight, ChevronDown, XCircle, Menu, X, Plus, Link as LinkIcon
} from 'lucide-react';
import { API_URL as API, ADMIN_SECRET } from '../config';
import AlertModal from '../components/AlertModal';
import CustomSelect from '../components/CustomSelect';

const headers = {
    'Content-Type': 'application/json',
    'x-admin-secret': ADMIN_SECRET,
};

export default function AdminPanel() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const [toast, setToast] = useState(null);
    const [deleteTargetUserId, setDeleteTargetUserId] = useState(null);
    const [grantTargetUserId, setGrantTargetUserId] = useState(null);
    const [revokeTargetUserId, setRevokeTargetUserId] = useState(null);

    // Pagination & Tabs state
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage, setUsersPerPage] = useState(10);
    const [currentItemsPage, setCurrentItemsPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [activeTab, setActiveTab] = useState('users');
    const [selectedUserFilter, setSelectedUserFilter] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Redirect non-admins immediately
    useEffect(() => {
        if (user && !user.isAdmin) navigate('/', { replace: true });
    }, [user, navigate]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [usersRes, itemsRes] = await Promise.all([
                fetch(`${API}/api/admin/users`, { headers }),
                fetch(`${API}/api/admin/items`, { headers })
            ]);

            if (!usersRes.ok) throw new Error('Failed to fetch users');
            if (!itemsRes.ok) throw new Error('Failed to fetch items');

            const usersData = await usersRes.json();
            const itemsData = await itemsRes.json();

            setUsers(Array.isArray(usersData) ? usersData : []);
            setItems(Array.isArray(itemsData) ? itemsData : []);
        } catch (err) {
            console.error('fetchData error:', err);
            showToast('Failed to load data: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const grantPremium = (userId) => {
        setGrantTargetUserId(userId);
    };

    const confirmGrantPremium = async () => {
        if (!grantTargetUserId) return;
        const userId = grantTargetUserId;
        setGrantTargetUserId(null);
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

    const revokePremium = (userId) => {
        setRevokeTargetUserId(userId);
    };

    const confirmRevokePremium = async () => {
        if (!revokeTargetUserId) return;
        const userId = revokeTargetUserId;
        setRevokeTargetUserId(null);
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
                setItems(prev => prev.filter(i => i.user_id !== userId)); // Optimistic UI update
                if (selectedUserFilter === userId) setSelectedUserFilter(null);
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

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.email?.toLowerCase().includes(search.toLowerCase()) || u.name?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' ? true : (statusFilter === 'premium' ? u.isPremium : !u.isPremium);
        return matchesSearch && matchesStatus;
    });

    let filteredItems = items;
    if (selectedUserFilter) {
        filteredItems = filteredItems.filter(item => item.user_id === selectedUserFilter);
    }
    if (search) {
        filteredItems = filteredItems.filter(item =>
            item.name?.toLowerCase().includes(search.toLowerCase())
        );
    }

    // Pagination logic
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;
    const currentUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

    const totalItemsPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
    const currentItems = filteredItems.slice((currentItemsPage - 1) * itemsPerPage, currentItemsPage * itemsPerPage);

    const premiumCount = users.filter(u => u.isPremium).length;
    const freeCount = users.length - premiumCount;
    const totalItemsCount = users.reduce((sum, u) => sum + (u.itemCount || 0), 0);
    const filterUserObj = selectedUserFilter ? users.find(u => u.id === selectedUserFilter) : null;

    if (!user?.isAdmin) return null;

    const getInitials = (name, email) => {
        if (name) return name.substring(0, 2).toUpperCase();
        if (email) return email.substring(0, 2).toUpperCase();
        return 'U';
    };

    const getAvatarColor = (name) => {
        const colors = [
            { bg: '#eef2ff', text: '#4f46e5' }, // indigo
            { bg: '#fff7ed', text: '#ea580c' }, // orange
            { bg: '#f0fdf4', text: '#16a34a' }, // green
            { bg: '#fdf2f8', text: '#db2777' }, // pink
            { bg: '#f5f3ff', text: '#7c3aed' }, // purple
        ];
        let hash = 0;
        for (let i = 0; i < (name || '').length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className="admin-container" style={{ display: 'flex', minHeight: '100vh', background: '#fafbfc', fontFamily: "'Outfit', sans-serif", color: '#111' }}>
            {/* Mobile Header Bar */}
            <div className="admin-mobile-header" style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: '#fafbfc', position: 'sticky', top: 0, zIndex: 100 }}>
                <button
                    onClick={() => navigate('/')}
                    style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f5f3ff', border: 'none', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                    <ChevronLeft size={22} strokeWidth={2.5} />
                </button>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111' }}>WishFlow Admin</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6d28d9', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                    {getInitials(user?.name, user?.email)}
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="admin-sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
                />
            )}

            {/* Sidebar */}
            <div className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`} style={{ width: '280px', background: '#fcfcfd', borderRight: '1px solid #eef0f2', display: 'flex', flexDirection: 'column', padding: '2rem 1.5rem', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
                {/* Logo and Mobile Close */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem', paddingLeft: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ color: '#4f46e5', display: 'flex', alignItems: 'center' }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                                <line x1="4" y1="22" x2="4" y2="15"></line>
                            </svg>
                        </div>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111' }}>WishFlow</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4f46e5', background: '#eef2ff', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>Admin</span>
                    </div>
                    <button
                        className="admin-sidebar-close"
                        onClick={() => setIsSidebarOpen(false)}
                        style={{ display: 'none', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.5rem' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Nav */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button
                        onClick={() => { setActiveTab('users'); setSearch(''); setIsSidebarOpen(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', background: activeTab === 'users' ? '#f5f3ff' : 'transparent', color: activeTab === 'users' ? '#6d28d9' : '#64748b', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'users' ? 700 : 600, fontSize: '0.95rem', transition: 'all 0.2s' }}
                    >
                        <Users size={20} /> Users
                    </button>
                    <button
                        onClick={() => { setActiveTab('items'); setSearch(''); setIsSidebarOpen(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', background: activeTab === 'items' ? '#f5f3ff' : 'transparent', color: activeTab === 'items' ? '#6d28d9' : '#64748b', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'items' ? 700 : 600, fontSize: '0.95rem', transition: 'all 0.2s' }}
                    >
                        <Package size={20} /> Items
                    </button>
                </div>

                {/* Back Button + User Profile */}
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', gap: '0.75rem' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#4f46e5', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s', width: '100%' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.borderColor = '#c7d2fe'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                        <ChevronLeft size={18} /> Back to App
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#6d28d9', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                                {getInitials(user?.name, user?.email)}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Admin User'}</p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
                            </div>
                        </div>
                        <ChevronDown size={16} color="#94a3b8" />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="admin-main-content" style={{ flex: 1, padding: '3rem 4rem', display: 'flex', flexDirection: 'column', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

                {/* Toast */}
                {toast && (
                    <div style={{
                        position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999,
                        background: toast.type === 'error' ? '#ef4444' : '#10b981',
                        color: '#fff', padding: '0.75rem 1.25rem', borderRadius: '12px',
                        fontWeight: 600, fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                        {toast.msg}
                    </div>
                )}

                {/* Header for both tabs */}
                <div className="admin-desktop-header" style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h1 style={{ margin: 0, fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                            {activeTab === 'users' ? 'Users' : 'Items'}
                        </h1>
                        <button
                            onClick={fetchData}
                            disabled={loading}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', background: '#fff', color: '#4f46e5', border: '1px solid #e0e7ff', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', opacity: loading ? 0.7 : 1 }}
                        >
                            <RefreshCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                            <span className="action-text">Refresh</span>
                        </button>
                    </div>
                    <p className="admin-page-desc" style={{ margin: 0, fontSize: '1.05rem', color: '#64748b' }}>
                        {activeTab === 'users' ? 'Manage and monitor your platform users' : 'Monitor all items created by users'}
                    </p>
                </div>

                {/* Search & Filter for both tabs */}
                <div className="admin-filter-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="admin-search-container" style={{ position: 'relative', flex: 1 }}>
                        <Search className="admin-search-icon" size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            className="admin-search-input"
                            value={search}
                            onChange={e => {
                                setSearch(e.target.value);
                                if (activeTab === 'users') setCurrentPage(1);
                                else setCurrentItemsPage(1);
                            }}
                            placeholder={activeTab === 'users' ? "Search users..." : "Search products..."}
                            style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 3rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '99px', fontSize: '0.95rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(0,0,0,0.01)' }}
                        />
                    </div>
                    <div className="admin-filter-dropdown" style={{ width: '220px' }}>
                        {activeTab === 'items' ? (
                            <CustomSelect
                                value={selectedUserFilter || ''}
                                onChange={val => { setSelectedUserFilter(val || null); setCurrentItemsPage(1); }}
                                options={[
                                    { value: '', label: 'All Users', icon: (props) => <Filter {...props} color="#f97316" /> },
                                    ...users.map(u => ({ 
                                        value: u.id, 
                                        label: u.name || u.email, 
                                        badge: u.itemCount || 0,
                                        icon: (props) => <Filter {...props} color="#f97316" /> 
                                    }))
                                ]}
                                style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a', borderRadius: '99px', height: '100%', padding: '0.875rem 1.25rem', boxShadow: '0 1px 2px rgba(0,0,0,0.01)', fontWeight: 600 }}
                            />
                        ) : (
                            <CustomSelect
                                value={statusFilter}
                                onChange={val => { setStatusFilter(val); setCurrentPage(1); }}
                                options={[
                                    { value: 'all', label: 'All', icon: (props) => <Filter {...props} color="#f97316" /> },
                                    { value: 'premium', label: 'Premium', icon: (props) => <Filter {...props} color="#f97316" /> },
                                    { value: 'free', label: 'Free', icon: (props) => <Filter {...props} color="#f97316" /> }
                                ]}
                                style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a', borderRadius: '99px', height: '100%', padding: '0.875rem 1.25rem', boxShadow: '0 1px 2px rgba(0,0,0,0.01)', fontWeight: 600 }}
                            />
                        )}
                    </div>
                </div>

                {activeTab === 'users' ? (
                    <>
                        {/* Stats Cards */}
                        <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                            {[
                                { val: users.length, label: 'Total Users', icon: Users, bg: '#f5f3ff', color: '#7c3aed' },
                                { val: totalItemsCount, label: 'Total Items', icon: Package, bg: '#ecfdf5', color: '#10b981' },
                                { val: premiumCount, label: 'Premium Users', icon: Crown, bg: '#fff7ed', color: '#f59e0b' },
                                { val: freeCount, label: 'Free Users', icon: Users, bg: '#eff6ff', color: '#3b82f6' },
                            ].map((s, i) => (
                                <div key={i} className="admin-stat-card" style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '16px', padding: '1.5rem', display: 'flex', gap: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -2px rgba(0, 0, 0, 0.02)' }}>
                                    <div className="admin-stat-icon-wrapper" style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <s.icon size={24} />
                                    </div>
                                    <div className="admin-stat-text-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
                                        <p className="admin-stat-val" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{s.val}</p>
                                        <p className="admin-stat-label" style={{ margin: '0.4rem 0 0', fontSize: '0.9rem', fontWeight: 700, color: '#334155', lineHeight: 1.2 }}>{s.label}</p>
                                        {s.sub && <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>{s.sub}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Table */}
                        <div className="admin-table-wrapper" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
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
                                {loading ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading users...</div>
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
                        {!loading && filteredUsers.length > 0 && (
                            <div className="admin-pagination-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '0 0.5rem', paddingBottom: '2rem', flexWrap: 'nowrap', gap: '1rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: '#64748b', opacity: currentPage === 1 ? 0.5 : 1 }}
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
                                        style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: '#64748b', opacity: currentPage === totalPages ? 0.5 : 1 }}
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
                                                options={[1, 5, 10, 20, 50]}
                                                style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', fontSize: '0.85rem' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {/* Items Table */}
                        <div className="admin-table-wrapper" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                            <div className="admin-table-header" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', padding: '1rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <span>Item Details</span>
                                <span>Created By</span>
                                <span>Price</span>
                                <span>Date Added</span>
                                <span>Link</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {loading ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading items...</div>
                                ) : currentItems.length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                        {selectedUserFilter ? 'This user has no items' : 'No items found'}
                                    </div>
                                ) : (
                                    currentItems.map((item, i) => {
                                        const creator = users.find(u => u.id === item.user_id) || { name: 'Unknown', email: 'unknown' };
                                        return (
                                            <div key={item.id}>
                                                {/* ===== DESKTOP TABLE ROW ===== */}
                                                <div className="admin-table-row admin-desktop-row" style={{
                                                    display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', padding: '1.25rem 1.5rem',
                                                    alignItems: 'center', borderBottom: i !== currentItems.length - 1 ? '1px solid #f1f5f9' : 'none',
                                                    transition: 'background 0.2s', position: 'relative', overflow: 'hidden'
                                                }}>
                                                    {item.is_purchased && (
                                                        <div style={{
                                                            position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                                                            background: 'linear-gradient(to bottom, #10b981, #059669)'
                                                        }} />
                                                    )}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0, paddingLeft: item.is_purchased ? '0.5rem' : '0' }}>
                                                        {item.image ? (
                                                            <img src={item.image} alt="" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '1px solid #e2e8f0' }} />
                                                        ) : (
                                                            <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#94a3b8' }}>
                                                                <Package size={24} />
                                                            </div>
                                                        )}
                                                        <div style={{ minWidth: 0, paddingRight: '1rem' }}>
                                                            <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {item.name || 'Unnamed Item'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div style={{ minWidth: 0, paddingRight: '1rem' }}>
                                                        <p style={{ margin: 0, fontWeight: 600, color: '#334155', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{creator.name || 'Unknown'}</p>
                                                        <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{creator.email}</p>
                                                    </div>
                                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                                                        {item.price ? `₹${item.price}` : 'Free'}
                                                    </div>
                                                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                                                        {new Date(item.created_at).toLocaleDateString()}
                                                    </div>
                                                    <div>
                                                        {item.link ? (
                                                            <a
                                                                href={item.link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{
                                                                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                                                    padding: '0.4rem 0.75rem', borderRadius: '8px',
                                                                    background: '#eef2ff', color: '#4f46e5',
                                                                    fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none'
                                                                }}
                                                            >
                                                                <LinkIcon size={14} /> Link
                                                            </a>
                                                        ) : (
                                                            <span style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                <LinkIcon size={14} /> No Link
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* ===== MOBILE CARD ===== */}
                                                <div className="admin-mobile-card" style={{
                                                    background: '#fff',
                                                    position: 'relative',
                                                    overflow: 'hidden'
                                                }}>
                                                    {item.is_purchased && (
                                                        <div style={{
                                                            position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px',
                                                            background: 'linear-gradient(to bottom, #10b981, #059669)'
                                                        }} />
                                                    )}
                                                    <div className="admin-mobile-card-body" style={{ marginTop: 0, borderRadius: '12px', paddingLeft: item.is_purchased ? '1.5rem' : '1.25rem' }}>
                                                        {/* Item Image + Name */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                                            {item.image ? (
                                                                <img src={item.image} alt="" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '1px solid #e2e8f0' }} />
                                                            ) : (
                                                                <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#94a3b8' }}>
                                                                    <Package size={24} />
                                                                </div>
                                                            )}
                                                            <div style={{ minWidth: 0 }}>
                                                                <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {item.name || 'Unnamed Item'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                                                            <div>
                                                                <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '0.2rem' }}>Creator</p>
                                                                <p style={{ margin: 0, fontWeight: 600, color: '#334155', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{creator.name || 'Unknown'}</p>
                                                            </div>
                                                            <div>
                                                                <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '0.2rem' }}>Price</p>
                                                                <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{item.price ? `₹${item.price}` : 'Free'}</p>
                                                            </div>
                                                        </div>

                                                        <a
                                                            href={item.link || '#'}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                                width: '100%', padding: '0.75rem', borderRadius: '15px',
                                                                background: item.link ? '#eef2ff' : '#f1f5f9',
                                                                color: item.link ? '#4f46e5' : '#94a3b8',
                                                                fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
                                                                pointerEvents: item.link ? 'auto' : 'none'
                                                            }}
                                                        >
                                                            <LinkIcon size={16} /> {item.link ? 'Link' : 'No Link'}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Pagination Footer Items */}
                        {!loading && filteredItems.length > 0 && (
                            <div className="admin-pagination-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '0 0.5rem', paddingBottom: '2rem', flexWrap: 'nowrap', gap: '1rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => setCurrentItemsPage(p => Math.max(1, p - 1))}
                                        disabled={currentItemsPage === 1}
                                        style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: currentItemsPage === 1 ? 'not-allowed' : 'pointer', color: '#64748b', opacity: currentItemsPage === 1 ? 0.5 : 1 }}
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    {Array.from({ length: totalItemsPages })
                                        .map((_, i) => i + 1)
                                        .filter(page => Math.abs(currentItemsPage - page) <= 1)
                                        .map(page => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentItemsPage(page)}
                                                style={{
                                                    width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: currentItemsPage === page ? '#eef2ff' : '#fff',
                                                    border: `1px solid ${currentItemsPage === page ? '#c7d2fe' : '#e2e8f0'}`,
                                                    color: currentItemsPage === page ? '#4f46e5' : '#64748b',
                                                    borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
                                                }}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    <button
                                        onClick={() => setCurrentItemsPage(p => Math.min(totalItemsPages, p + 1))}
                                        disabled={currentItemsPage === totalItemsPages}
                                        style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: currentItemsPage === totalItemsPages ? 'not-allowed' : 'pointer', color: '#64748b', opacity: currentItemsPage === totalItemsPages ? 0.5 : 1 }}
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span className="admin-rows-text">Rows per page:</span>
                                        <div style={{ width: '80px' }}>
                                            <CustomSelect
                                                value={itemsPerPage}
                                                onChange={(val) => { setItemsPerPage(Number(val)); setCurrentItemsPage(1); }}
                                                options={[5, 10, 20, 50]}
                                                style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', fontSize: '0.85rem' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                
                .admin-mobile-badge {
                    display: none;
                }
                
                /* Responsive adjustments */
                @media (max-width: 1200px) and (min-width: 769px) {
                    .action-text {
                        display: none;
                    }
                }
                @media (max-width: 1024px) {
                    .admin-main-content {
                        padding: 2rem !important;
                    }
                }
                @media (max-width: 768px) {
                    .admin-container {
                        flex-direction: column !important;
                    }
                    .admin-sidebar {
                        display: none !important;
                    }
                    .admin-mobile-header {
                        display: flex !important;
                    }
                    .admin-desktop-header {
                        display: none !important;
                    }
                    .admin-mobile-bottom-nav {
                        display: block !important;
                    }
                    .admin-main-content {
                        padding: 1rem 1rem 6rem 1rem !important;
                        background: #fafbfc;
                    }
                    
                    /* Stats Grid Mobile Layout */
                    .admin-stats-grid {
                        display: flex !important;
                        overflow-x: hidden !important;
                        gap: 0.5rem !important;
                        background: transparent !important;
                        padding: 0.5rem 0 !important;
                        border-radius: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        justify-content: space-between !important;
                    }
                    .admin-stats-grid::-webkit-scrollbar {
                        display: none;
                    }
                    .admin-stats-grid > div:first-child {
                        grid-column: auto !important;
                    }
                    .admin-stats-grid > div:nth-child(4) {
                        display: flex !important;
                    }
                    .admin-stat-card {
                        flex: 1 1 0 !important;
                        aspect-ratio: 1 / 1 !important; /* Perfect square */
                        height: auto !important;
                        flex-direction: column !important;
                        justify-content: center !important;
                        align-items: center !important;
                        padding: 0.5rem !important;
                        background: #6366f1 !important;
                        border: none !important;
                        box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2) !important;
                        border-radius: 12px !important;
                        position: relative !important;
                        overflow: hidden !important;
                        text-align: center !important;
                        min-width: 0 !important;
                    }
                    .admin-stat-icon-wrapper {
                        display: none !important;
                    }
                    .admin-stat-text-wrapper {
                        align-items: center !important;
                        position: relative !important;
                        z-index: 1 !important;
                        width: 100% !important;
                    }
                    .admin-stat-val {
                        font-size: 1.4rem !important;
                        margin-top: 0 !important;
                        color: #ffffff !important;
                        font-weight: 800 !important;
                        line-height: 1 !important;
                    }
                    .admin-stat-label {
                        font-size: 0.65rem !important;
                        margin-top: 0.25rem !important;
                        color: rgba(255, 255, 255, 0.9) !important;
                        font-weight: 600 !important;
                        line-height: 1.1 !important;
                        word-break: break-word !important;
                    }
                    
                    /* Table Mobile Layout */
                    .admin-filter-bar {
                        display: flex !important;
                        flex-direction: row !important;
                        flex-wrap: nowrap !important;
                        align-items: center !important;
                        gap: 0.5rem !important;
                    }
                    .admin-search-container {
                        flex: 1 1 auto !important;
                        min-width: 0 !important;
                    }
                    .admin-search-input {
                        padding: 0.75rem 0.5rem 0.75rem 2.25rem !important;
                        font-size: 0.85rem !important;
                        width: 100% !important;
                    }
                    .admin-search-icon {
                        left: 0.75rem !important;
                        width: 16px !important;
                        height: 16px !important;
                    }
                    .admin-filter-dropdown {
                        flex: 0 0 140px !important;
                        width: 140px !important;
                        min-width: 140px !important;
                    }
                    .admin-filter-dropdown > button {
                        width: 100% !important;
                        padding: 0.75rem 0.5rem !important;
                        font-size: 0.85rem !important;
                    }
                    .admin-pagination-container {
                        gap: 0.25rem !important;
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                        padding-bottom: 2.5rem !important; /* give room for scrollbar */
                    }
                    .admin-pagination-container::-webkit-scrollbar {
                        height: 0px;
                    }
                    .admin-rows-text {
                        display: none !important;
                    }
                    .admin-pagination-container > div:first-child button {
                        width: 32px !important;
                        height: 32px !important;
                        font-size: 0.85rem !important;
                        padding: 0 !important;
                    }
                    .admin-table-wrapper {
                        overflow-x: hidden !important;
                        border: none !important;
                        background: #fff !important;
                        border-radius: 20px !important;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.03) !important;
                    }
                } /* End of @media (max-width: 768px) */
                
                /* Desktop base styles for mobile wrappers */
                .admin-mobile-card-inner {
                    display: contents !important;
                }

                /* Desktop row: show on desktop, hide on mobile */
                .admin-desktop-row { display: grid !important; }
                .admin-mobile-card { display: none !important; }

                /* Mobile overrides */
                @media (max-width: 768px) {
                    .admin-table-header { display: none !important; }
                    .admin-desktop-row { display: none !important; }
                    .admin-mobile-card {
                        display: block !important;
                        position: relative;
                        border-radius: 12px;
                        margin-bottom: 1rem;
                        overflow: hidden;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                        border: 1px solid #e2e8f0;
                    }
                    .admin-mobile-card.premium-card {
                        background: linear-gradient(to bottom, #f97316 0%, #ffedd5 1.5rem, #fff 1.5rem, #fff 100%);
                    }
                    .admin-mobile-card.free-card {
                        background: linear-gradient(to bottom, #3b82f6 0%, #dbeafe 1.5rem, #fff 1.5rem, #fff 100%);
                    }
                    .admin-mobile-card .admin-mobile-badge {
                        display: flex !important;
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        height: 1.5rem;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.65rem;
                        font-weight: 800;
                        color: #fff;
                        letter-spacing: 0.5px;
                        z-index: 10;
                    }
                    .admin-mobile-card-body {
                        background: #fff;
                        margin-top: 1.5rem;
                        padding: 1rem;
                        border-radius: 0 0 12px 12px;
                    }
                        /* Hide desktop row on mobile */
                        div.admin-desktop-row {
                            display: none !important;
                        }
                        .admin-table-row.premium-card, .admin-table-row.free-card {
                            border-radius: 12px !important;
                            position: relative !important;
                            padding-top: 1.5rem !important; /* The colored top bar */
                            box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
                            border: 1px solid #e2e8f0 !important;
                        }
                        .admin-table-row.premium-card {
                            background: linear-gradient(to bottom, #f97316 0%, #ffedd5 1.5rem, #fff 1.5rem, #fff 100%) !important;
                        }
                        .admin-table-row.free-card {
                            background: linear-gradient(to bottom, #3b82f6 0%, #dbeafe 1.5rem, #fff 1.5rem, #fff 100%) !important;
                        }
                        
                        /* The text at the top right using actual DOM element */
                        .admin-mobile-badge {
                            display: flex !important;
                            position: absolute !important;
                            top: 0 !important; /* Positioned at the very top of .admin-table-row */
                            right: 0.75rem !important;
                            height: 1.5rem !important;
                            align-items: center !important;
                            font-size: 0.65rem !important;
                            font-weight: 800 !important;
                            color: #fff !important;
                            letter-spacing: 0.5px !important;
                            z-index: 10 !important;
                        }

                        .admin-mobile-card-inner {
                            background: #fff !important;
                            border-radius: 0 0 12px 12px !important;
                            padding: 1.25rem 1rem !important;
                            display: flex !important;
                            flex-direction: column !important;
                            z-index: 1 !important;
                            width: 100% !important;
                            box-sizing: border-box !important;
                            align-items: stretch !important;
                        }

                        /* Inner Cols adjustments */
                        .admin-col-user {
                            flex: 1 1 100% !important;
                            padding: 0 !important;
                            margin-bottom: 0.25rem !important;
                            align-items: center !important;
                        }
                        .admin-col-status {
                            display: none !important; /* Hide old status badge */
                        }
                        .admin-col-email {
                            flex: 1 1 100% !important;
                            padding: 0 0 0 3.5rem !important;
                            margin: 0 0 0.5rem 0 !important;
                            font-size: 0.85rem !important;
                            font-weight: 500 !important;
                        }
                        .admin-col-items {
                            flex: 1 1 100% !important;
                            padding: 0 0 0 3.5rem !important;
                            font-size: 0.85rem !important;
                            font-weight: 700 !important;
                            color: #334155 !important;
                            margin-bottom: 0 !important;
                        }
                        .admin-col-items::before {
                            content: 'Total Items: ' !important;
                            font-weight: 500;
                            color: #64748b;
                        }
                        .admin-col-actions {
                            display: flex !important;
                            justify-content: space-between !important;
                            align-items: center !important;
                            gap: 0.75rem !important;
                            margin-top: 1rem !important;
                            padding-top: 1rem !important;
                            border-top: 1px solid #f1f5f9 !important;
                            width: 100% !important;
                            box-sizing: border-box !important;
                        }
                        .admin-col-actions button {
                            flex: 1 !important;
                            justify-content: center !important;
                            padding: 0.75rem !important;
                            font-size: 0.9rem !important;
                        }
                        .admin-col-actions .action-text {
                            display: inline !important;
                        }
                        
                        /* Items Table fallback */
                        .admin-table-row:not(.premium-card):not(.free-card) {
                            padding: 1.25rem !important;
                            margin-bottom: 1rem !important;
                            border-radius: 16px !important;
                            border: 1px solid #e2e8f0 !important;
                            background: #fff !important;
                            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02) !important;
                        }
                        .admin-col-item {
                            flex: 1 1 100% !important;
                            padding: 0 !important;
                            margin-bottom: 0.5rem !important;
                            align-items: flex-start !important;
                        }
                        .admin-col-item > div:nth-child(2) {
                            padding-right: 5rem !important;
                        }
                        .admin-col-price {
                            position: absolute !important;
                            top: 1.25rem;
                            right: 1.25rem;
                            font-size: 1.2rem !important;
                            color: #10b981 !important;
                            font-weight: 800 !important;
                            padding: 0 !important;
                            background: #fff !important;
                            border-radius: 4px;
                        }
                        .admin-col-creator {
                            flex: 1 1 100% !important;
                            padding: 0 0 0 4rem !important;
                            margin: 0.5rem 0 !important;
                            display: flex !important;
                            flex-direction: column !important;
                            align-items: flex-start !important;
                            gap: 0.25rem !important;
                            font-size: 0.85rem !important;
                        }
                        .admin-col-creator::before {
                            content: 'Added by:' !important;
                            font-size: 0.7rem;
                            color: #94a3b8;
                            text-transform: uppercase;
                            font-weight: 700;
                            letter-spacing: 0.5px;
                        }
                        .admin-col-date {
                            flex: 1 1 100% !important;
                            padding: 0 0 0 4rem !important;
                            font-size: 0.85rem !important;
                        }
                    }
                `}</style>

            <AlertModal
                isOpen={grantTargetUserId !== null}
                title="Grant Premium"
                message="Are you sure you want to grant Premium to this user?"
                cancelText="Cancel"
                confirmText="Grant Premium"
                isDestructive={false}
                onCancel={() => setGrantTargetUserId(null)}
                onConfirm={confirmGrantPremium}
            />

            <AlertModal
                isOpen={revokeTargetUserId !== null}
                title="Revoke Premium"
                message="Are you sure you want to revoke Premium from this user?"
                cancelText="Cancel"
                confirmText="Revoke"
                isDestructive={true}
                onCancel={() => setRevokeTargetUserId(null)}
                onConfirm={confirmRevokePremium}
            />

            <AlertModal
                isOpen={deleteTargetUserId !== null}
                title="Delete User"
                message="Are you sure you want to permanently delete this user?"
                cancelText="Cancel"
                confirmText="Delete"
                isDestructive={true}
                onCancel={() => setDeleteTargetUserId(null)}
                onConfirm={confirmDeleteUser}
            />

            {/* Mobile Bottom Navigation */}
            <div className="admin-mobile-bottom-nav" style={{ display: 'none', position: 'fixed', bottom: '1.5rem', left: '1.5rem', right: '1.5rem', zIndex: 1000 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#1d4ed8', padding: '0.75rem 1.5rem', borderRadius: '99px', boxShadow: '0 10px 25px -5px rgba(29, 78, 216, 0.5)' }}>
                        <button onClick={() => setActiveTab('users')} style={{ background: 'transparent', border: 'none', color: activeTab === 'users' ? '#fff' : 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', padding: '0.5rem' }}>
                            <Users size={22} strokeWidth={activeTab === 'users' ? 2.5 : 2} />
                        </button>
                        <button onClick={() => setActiveTab('items')} style={{ background: 'transparent', border: 'none', color: activeTab === 'items' ? '#fff' : 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', padding: '0.5rem' }}>
                            <Package size={22} strokeWidth={activeTab === 'items' ? 2.5 : 2} />
                        </button>
                    </div>
                    <button onClick={fetchData} disabled={loading} style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#1d4ed8', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(29, 78, 216, 0.5)' }}>
                        <RefreshCw size={24} strokeWidth={2.5} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    </button>
                </div>
            </div>
        </div>
    );
}
