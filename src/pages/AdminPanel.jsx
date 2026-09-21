import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import {
    Crown, Users, ArrowLeft, RefreshCw, Search, Trash2, Package,
    Filter, Calendar, ChevronLeft, ChevronRight, ChevronDown, XCircle, Menu, X, Plus, Link as LinkIcon, BookOpen, TrendingDown, Play, Clock, Settings, Eye, User, Palette, Rocket, Command, Info, LogOut, Megaphone, Type, AlignLeft, Image as ImageIcon, Send, Save, Check
} from 'lucide-react';
import { API_URL as API } from '../config';
import { supabase } from '../db';
import AlertModal from '../components/AlertModal';
import PromptModal from '../components/PromptModal';
import CustomSelect from '../components/CustomSelect';
import BlogAdminTab from '../components/BlogAdminTab';
import { useIsland } from '../context/IslandContext';
import { useAdminContext } from '../context/AdminContext';
import { useSettings } from '../context/SettingsContext';
import CardVisual, { ROAST_THEMES } from '../components/CardVisual';
import { uploadToImageKit } from '../utils/imagekit';

const getAuthHeaders = async () => {
    let { data: { session } } = await supabase.auth.getSession();

    // Proactively refresh the token if it's expired or about to expire (within 1 min)
    if (session?.expires_at && Date.now() > (session.expires_at * 1000) - 60000) {
        const { data } = await supabase.auth.refreshSession();
        session = data?.session || session;
    }

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? ''}`,
    };
};

export default function AdminPanel() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { users, setUsers, items, setItems, loadingUsers, loadingItems, refreshData } = useAdminContext();
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
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

    // Price Drop Alert state
    const [priceAlertStatus, setPriceAlertStatus] = useState(null);
    const [priceAlertLoading, setPriceAlertLoading] = useState(false);
    const [priceAlertRunning, setPriceAlertRunning] = useState(false);
    const [roastFeatureEnabled, setRoastFeatureEnabled] = useState(true);
    const [togglingRoast, setTogglingRoast] = useState(false);
    const [roastEnabledThemes, setRoastEnabledThemes] = useState([]);

    const { darkMode } = useSettings();

    // Force light mode on Admin Panel
    useEffect(() => {
        document.documentElement.classList.remove('dark');
        return () => {
            if (darkMode) {
                document.documentElement.classList.add('dark');
            }
        };
    }, [darkMode]);
    const [previewTheme, setPreviewTheme] = useState(null);
    const [refreshFeatureEnabled, setRefreshFeatureEnabled] = useState(true);
    const [togglingRefresh, setTogglingRefresh] = useState(false);
    const [customCursorEnabled, setCustomCursorEnabled] = useState(true);
    const [togglingCursor, setTogglingCursor] = useState(false);

    // Broadcast Notification state
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastBody, setBroadcastBody] = useState('');
    const [broadcastUrl, setBroadcastUrl] = useState('');
    const [broadcastImage, setBroadcastImage] = useState('');
    const [broadcastActionButtonEnabled, setBroadcastActionButtonEnabled] = useState(false);
    const [broadcastActionButtonTitle, setBroadcastActionButtonTitle] = useState('');
    const [broadcastActionButtonUrl, setBroadcastActionButtonUrl] = useState('');
    const [broadcastLoading, setBroadcastLoading] = useState(false);
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const [broadcastTargetUserIds, setBroadcastTargetUserIds] = useState([]);
    const [broadcastUserSearchTerm, setBroadcastUserSearchTerm] = useState('');
    const [isBroadcastFilterOpen, setIsBroadcastFilterOpen] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    // Analytics: view toggle + history data
    const [broadcastView, setBroadcastView] = useState('compose'); // 'compose' | 'history'
    const [broadcastHistory, setBroadcastHistory] = useState([]);
    const [broadcastHistoryLoading, setBroadcastHistoryLoading] = useState(false);
    const [isDeleteHistoryModalOpen, setIsDeleteHistoryModalOpen] = useState(false);
    const [deleteHistoryTimeframe, setDeleteHistoryTimeframe] = useState('1month');
    const [isTimeframeDropdownOpen, setIsTimeframeDropdownOpen] = useState(false);

    // Custom Templates & Draft State
    const [customTemplates, setCustomTemplates] = useState(() => JSON.parse(localStorage.getItem('wishflow_admin_templates')) || []);

    useEffect(() => {
        const draft = JSON.parse(localStorage.getItem('wishflow_broadcast_draft'));
        if (draft) {
            if (draft.title) setBroadcastTitle(draft.title);
            if (draft.body) setBroadcastBody(draft.body);
            if (draft.url) setBroadcastUrl(draft.url);
            if (draft.image) setBroadcastImage(draft.image);
        }
    }, []);

    useEffect(() => {
        const draft = { title: broadcastTitle, body: broadcastBody, url: broadcastUrl, image: broadcastImage };
        localStorage.setItem('wishflow_broadcast_draft', JSON.stringify(draft));
    }, [broadcastTitle, broadcastBody, broadcastUrl, broadcastImage]);

    useEffect(() => {
        localStorage.setItem('wishflow_admin_templates', JSON.stringify(customTemplates));
    }, [customTemplates]);
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5000000) { alert('Image too large (< 5 MB please).'); return; }
        setIsUploadingImage(true);
        try {
            const uploadedUrl = await uploadToImageKit(file);
            setBroadcastImage(uploadedUrl);
        } catch (err) {
            alert(err.message);
        } finally {
            setIsUploadingImage(false);
        }
    };

    // Profile Menu state
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    // Fetch global feature flags on mount
    useEffect(() => {
        const fetchGlobalSettings = async () => {
            try {
                const res = await fetch(`${API}/api/public/features`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.roast_feature_enabled !== undefined) {
                        setRoastFeatureEnabled(data.roast_feature_enabled);
                    }
                    if (data.custom_cursor_enabled !== undefined) {
                        setCustomCursorEnabled(data.custom_cursor_enabled);
                    }
                    if (data.roast_enabled_themes) {
                        setRoastEnabledThemes(data.roast_enabled_themes);
                    } else {
                        // Default to all if not set
                        setRoastEnabledThemes(ROAST_THEMES.map(t => t.id));
                    }
                    if (data.refresh_feature_enabled !== undefined) {
                        setRefreshFeatureEnabled(data.refresh_feature_enabled);
                    }
                }
            } catch (e) {
                console.error('fetch global settings error:', e);
            }
        };
        fetchGlobalSettings();
    }, []);

    // Redirect non-admins immediately
    useEffect(() => {
        if (user && !user.isAdmin) navigate('/', { replace: true });
    }, [user, navigate]);



    const { showIsland } = useIsland();

    const showToast = (msg, type = 'success') => {
        showIsland({ title: type === 'success' ? 'Success' : 'Error', subtitle: msg, type });
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
            const headers = await getAuthHeaders();
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
            const headers = await getAuthHeaders();
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
            const headers = await getAuthHeaders();
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

    const confirmBroadcast = async () => {
        setIsBroadcastModalOpen(false);
        setBroadcastLoading(true);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${API}/api/admin/broadcast-notification`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    title: broadcastTitle,
                    body: broadcastBody,
                    url: broadcastUrl,
                    image: broadcastImage,
                    targetUserIds: broadcastTargetUserIds.length > 0 ? broadcastTargetUserIds : undefined,
                    actionButtonTitle: broadcastActionButtonEnabled ? broadcastActionButtonTitle : undefined,
                    actionButtonUrl: broadcastActionButtonEnabled ? broadcastActionButtonUrl : undefined
                })
            });
            const data = await res.json();
            if (res.ok) {
                showToast(`Sent successfully to ${data.sentCount} users!`);
                setBroadcastTitle('');
                setBroadcastBody('');
                setBroadcastUrl('');
                setBroadcastImage('');
                setBroadcastActionButtonEnabled(false);
                setBroadcastActionButtonTitle('');
                setBroadcastActionButtonUrl('');
                setBroadcastTargetUserIds([]);
                setBroadcastUserSearchTerm('');
            } else {
                showToast(data.error || 'Failed to send broadcast', 'error');
            }
        } catch (e) {
            showToast('Network error', 'error');
        } finally {
            setBroadcastLoading(false);
        }
    };

    const fetchBroadcastHistory = async () => {
        setBroadcastHistoryLoading(true);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${API}/api/admin/broadcast-history`, { headers });
            if (res.ok) {
                const data = await res.json();
                setBroadcastHistory(data);
            }
        } catch (e) {
            console.error('Failed to fetch broadcast history', e);
        } finally {
            setBroadcastHistoryLoading(false);
        }
    };

    const confirmDeleteHistory = async () => {
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${API}/api/admin/broadcast-history?timeframe=${deleteHistoryTimeframe}`, {
                method: 'DELETE',
                headers
            });
            if (res.ok) {
                showToast('History deleted successfully!');
                fetchBroadcastHistory();
                setIsDeleteHistoryModalOpen(false);
            } else {
                showToast('Failed to delete history', 'error');
            }
        } catch (e) {
            showToast('Network error', 'error');
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
        <div className="admin-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface)', fontFamily: "'Outfit', sans-serif", color: 'var(--text)' }}>
            {/* Mobile Header Bar */}
            <div className="admin-mobile-header" style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 100 }}>
                <button
                    onClick={() => navigate('/')}
                    style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f5f3ff', border: 'none', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                    <ChevronLeft size={22} strokeWidth={2.5} />
                </button>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>WishFlow Admin</span>
                <div style={{ position: 'relative' }}>
                    <div
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6d28d9', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', border: isProfileMenuOpen ? '2px solid #c7d2fe' : '2px solid transparent', transition: 'border 0.2s' }}
                    >
                        {getInitials(user?.name, user?.email)}
                    </div>

                    {isProfileMenuOpen && (
                        <>
                            <div
                                style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                                onClick={() => setIsProfileMenuOpen(false)}
                            />
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '0.75rem',
                                width: '240px',
                                background: 'var(--surface)',
                                borderRadius: '16px',
                                padding: '0.5rem',
                                zIndex: 100,
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px'
                            }}>
                                <div
                                    onClick={() => { setActiveTab('global-settings'); setIsProfileMenuOpen(false); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', color: '#1e293b', cursor: 'pointer', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 500, transition: 'background 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <Settings size={18} color="#64748b" />
                                    Global Settings
                                </div>
                                <div
                                    onClick={() => { setActiveTab('broadcast'); setIsProfileMenuOpen(false); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', color: '#1e293b', cursor: 'pointer', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 500, transition: 'background 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <Megaphone size={18} color="#64748b" />
                                    Broadcast
                                </div>
                                <div
                                    onClick={() => { setActiveTab('themes'); setIsProfileMenuOpen(false); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', color: '#1e293b', cursor: 'pointer', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 500, transition: 'background 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <Palette size={18} color="#64748b" />
                                    Themes
                                </div>
                                <div
                                    onClick={() => {
                                        setActiveTab('price-alerts');
                                        setIsProfileMenuOpen(false);
                                        setPriceAlertLoading(true);
                                        getAuthHeaders().then(headers => fetch(`${API}/api/admin/price-drop/status`, { headers }))
                                            .then(r => r.json())
                                            .then(d => {
                                                setPriceAlertStatus(d);
                                                if (d.cronExpression) {
                                                    const parts = d.cronExpression.split(' ');
                                                    if (parts.length >= 2) {
                                                        const utcH = parseInt(parts[1]) || 19;
                                                        const utcM = parseInt(parts[0]) || 30;
                                                        const istM = (utcM + 30) % 60;
                                                        const istH = (utcH + 5 + (utcM + 30 >= 60 ? 1 : 0)) % 24;
                                                        setScheduleHour(istH);
                                                        setScheduleMinute(istM);
                                                    }
                                                }
                                            })
                                            .catch(() => { })
                                            .finally(() => setPriceAlertLoading(false));
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', color: '#1e293b', cursor: 'pointer', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 500, transition: 'background 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <TrendingDown size={18} color="#64748b" />
                                    Price Alerts
                                </div>
                            </div>
                        </>
                    )}
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
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>WishFlow</span>
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
                    <button
                        onClick={() => { setActiveTab('blog'); setSearch(''); setIsSidebarOpen(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', background: activeTab === 'blog' ? '#f5f3ff' : 'transparent', color: activeTab === 'blog' ? '#6d28d9' : '#64748b', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'blog' ? 700 : 600, fontSize: '0.95rem', transition: 'all 0.2s' }}
                    >
                        <BookOpen size={20} /> Blog
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('price-alerts');
                            setSearch('');
                            setIsSidebarOpen(false);
                            // Fetch status when tab opens
                            setPriceAlertLoading(true);
                            getAuthHeaders().then(headers => fetch(`${API}/api/admin/price-drop/status`, { headers }))
                                .then(r => r.json())
                                .then(d => {
                                    setPriceAlertStatus(d);
                                    // Parse cron to set time pickers
                                    if (d.cronExpression) {
                                        const parts = d.cronExpression.split(' ');
                                        if (parts.length >= 2) {
                                            const utcH = parseInt(parts[1]) || 19;
                                            const utcM = parseInt(parts[0]) || 30;
                                            // Convert UTC to IST (+5:30)
                                            const istM = (utcM + 30) % 60;
                                            const istH = (utcH + 5 + (utcM + 30 >= 60 ? 1 : 0)) % 24;
                                            setScheduleHour(istH);
                                            setScheduleMinute(istM);
                                        }
                                    }
                                    if (d.schedulerEnabled !== undefined) {
                                        setSchedulerEnabled(d.schedulerEnabled);
                                    }

                                })
                                .catch(() => { })
                                .finally(() => setPriceAlertLoading(false));
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', background: activeTab === 'price-alerts' ? '#fef3c7' : 'transparent', color: activeTab === 'price-alerts' ? '#d97706' : '#64748b', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'price-alerts' ? 700 : 600, fontSize: '0.95rem', transition: 'all 0.2s' }}
                    >
                        <TrendingDown size={20} /> Price Alerts
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('global-settings');
                            setSearch('');
                            setIsSidebarOpen(false);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', background: activeTab === 'global-settings' ? '#e0e7ff' : 'transparent', color: activeTab === 'global-settings' ? '#4f46e5' : '#64748b', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'global-settings' ? 700 : 600, fontSize: '0.95rem', transition: 'all 0.2s' }}
                    >
                        <Settings size={20} /> Global Settings
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('broadcast');
                            setSearch('');
                            setIsSidebarOpen(false);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', background: activeTab === 'broadcast' ? '#fce7f3' : 'transparent', color: activeTab === 'broadcast' ? '#db2777' : '#64748b', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'broadcast' ? 700 : 600, fontSize: '0.95rem', transition: 'all 0.2s' }}
                    >
                        <Megaphone size={20} /> Broadcast
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('themes');
                            setSearch('');
                            setIsSidebarOpen(false);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', background: activeTab === 'themes' ? '#f3e8ff' : 'transparent', color: activeTab === 'themes' ? '#9333ea' : '#64748b', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'themes' ? 700 : 600, fontSize: '0.95rem', transition: 'all 0.2s' }}
                    >
                        <Palette size={20} /> Themes
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: 'var(--surface)', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#6d28d9', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                                {getInitials(user?.name, user?.email)}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Admin User'}</p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
                            </div>
                        </div>
                        <ChevronDown size={16} color="#94a3b8" />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="admin-main-content" style={{ flex: 1, padding: '3rem 4rem', display: 'flex', flexDirection: 'column', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>


                {/* Header — only shown for users/items tabs */}
                {activeTab !== 'blog' && activeTab !== 'price-alerts' && activeTab !== 'global-settings' && activeTab !== 'broadcast' && activeTab !== 'themes' && (
                    <div className="admin-desktop-header" style={{ marginBottom: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h1 style={{ margin: 0, fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                                {activeTab === 'users' ? 'Users' : 'Items'}
                            </h1>
                            <button
                                onClick={refreshData}
                                disabled={loadingUsers || loadingItems}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', background: 'var(--surface)', color: '#4f46e5', border: '1px solid #e0e7ff', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', opacity: (loadingUsers || loadingItems) ? 0.7 : 1 }}
                            >
                                <RefreshCw size={18} style={{ animation: (loadingUsers || loadingItems) ? 'spin 1s linear infinite' : 'none' }} />
                                <span className="action-text">Refresh</span>
                            </button>
                        </div>
                        <p className="admin-page-desc" style={{ margin: 0, fontSize: '1.05rem', color: '#64748b' }}>
                            {activeTab === 'users' ? 'Manage and monitor your platform users' : 'Monitor all items created by users'}
                        </p>
                    </div>
                )}

                {/* Blog tab content */}
                {activeTab === 'blog' && (
                    <BlogAdminTab showToast={showToast} />
                )}

                {/* Price Alerts tab content */}
                {activeTab === 'price-alerts' && (
                    <div style={{ width: '100%' }}>
                        {/* ── Hero Banner ── */}
                        <div style={{
                            background: 'linear-gradient(135deg, #92400e 0%, #d97706 50%, #f59e0b 100%)',
                            borderRadius: '24px',
                            padding: '2rem 2.5rem',
                            marginBottom: '2rem',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: '0 20px 40px -12px rgba(217, 119, 6, 0.35)',
                        }}>
                            {/* Decorative blobs */}
                            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
                            <div style={{ position: 'absolute', bottom: '-30px', right: '120px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '0.5rem', display: 'flex' }}>
                                        <TrendingDown size={22} color="#fff" />
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Price Intelligence</span>
                                </div>
                                <h1 style={{ margin: '0 0 0.4rem', fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                                    Price Drop Alerts
                                </h1>
                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', maxWidth: '480px', lineHeight: 1.6 }}>
                                    Automatically re-scrapes saved items and sends push notifications the moment a price drops.
                                </p>
                            </div>
                        </div>

                        {priceAlertLoading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {[1, 2, 3].map(i => (
                                    <div key={i} style={{ height: '80px', borderRadius: '16px', background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
                                ))}
                            </div>
                        ) : (
                            <>
                                {/* ── Status Cards ── */}
                                {priceAlertStatus && (
                                    <div className="pa-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                                        {[
                                            {
                                                label: 'Last Run',
                                                value: priceAlertStatus.lastRun === 'Never' ? 'Never' : new Date(priceAlertStatus.lastRun).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
                                                icon: '🕐', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
                                            },
                                            {
                                                label: 'Items Checked',
                                                value: priceAlertStatus.lastSummary?.itemsChecked ?? '—',
                                                icon: '🔍', gradient: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
                                            },
                                            {
                                                label: 'Drops Found',
                                                value: priceAlertStatus.lastSummary?.dropsFound ?? '—',
                                                icon: '📉', gradient: 'linear-gradient(135deg, #16a34a, #4ade80)',
                                            },
                                            {
                                                label: 'Alerts Sent',
                                                value: priceAlertStatus.lastSummary?.notificationsSent ?? '—',
                                                icon: '🔔', gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
                                            },
                                        ].map(card => (
                                            <div key={card.label} style={{
                                                background: 'var(--surface)',
                                                border: '1px solid #f1f5f9',
                                                borderRadius: '18px',
                                                padding: '1.25rem',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.5rem',
                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                            }}>
                                                <div style={{
                                                    width: '36px', height: '36px',
                                                    background: card.gradient,
                                                    borderRadius: '10px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '1.1rem',
                                                }}>{card.icon}</div>
                                                <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</p>
                                                <p style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{card.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* ── Two Column Layout ── */}
                                <div className="pa-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>

                                    {/* Run Now Card */}
                                    <div style={{ background: 'var(--surface)', border: '1px solid #f1f5f9', borderRadius: '20px', padding: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                                            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #fef3c7, #fde68a)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>⚡</div>
                                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Run Job Now</h3>
                                        </div>
                                        <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6 }}>
                                            Manually trigger a full price check for all saved items with product links.
                                        </p>

                                        {/* Progress indicator when running */}
                                        {priceAlertRunning && (
                                            <div style={{ background: '#fef3c7', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid #fde68a' }}>
                                                <div style={{ width: '14px', height: '14px', border: '2px solid #d97706', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#92400e' }}>Scanning products... This may take a few minutes.</span>
                                            </div>
                                        )}

                                        <button
                                            id="price-drop-run-now"
                                            disabled={priceAlertRunning}
                                            onClick={async () => {
                                                setPriceAlertRunning(true);
                                                try {
                                                    const headers = await getAuthHeaders();
                                                    const res = await fetch(`${API}/api/admin/price-drop/run`, { method: 'POST', headers });
                                                    const data = await res.json();
                                                    if (data.success) {
                                                        setPriceAlertStatus(prev => ({ ...prev, lastRun: data.summary.startedAt, lastSummary: data.summary, isRunning: false }));
                                                        showToast(`Done! ${data.summary.dropsFound} drop(s) found, ${data.summary.notificationsSent} sent.`);
                                                        fetchItems();
                                                    } else {
                                                        showToast(data.error || 'Job failed', 'error');
                                                    }
                                                } catch (e) {
                                                    showToast('Network error', 'error');
                                                } finally {
                                                    setPriceAlertRunning(false);
                                                }
                                            }}
                                            style={{
                                                width: '100%',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                                                padding: '0.9rem 1.5rem',
                                                background: priceAlertRunning
                                                    ? '#f1f5f9'
                                                    : 'linear-gradient(135deg, #d97706, #f59e0b)',
                                                color: priceAlertRunning ? '#94a3b8' : '#fff',
                                                border: 'none', borderRadius: '14px',
                                                fontWeight: 700, fontSize: '0.95rem',
                                                cursor: priceAlertRunning ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.25s',
                                                boxShadow: priceAlertRunning ? 'none' : '0 4px 12px rgba(217,119,6,0.3)',
                                                fontFamily: 'inherit',
                                            }}
                                        >
                                            {priceAlertRunning
                                                ? <><RefreshCw size={17} style={{ animation: 'spin 1s linear infinite' }} /> Scanning…</>
                                                : <><Play size={17} fill="currentColor" /> Run Price Check</>}
                                        </button>

                                    </div>
                                </div>

                                {/* Responsive CSS for this tab */}
                                <style>{`
                            .pa-stats-grid { grid-template-columns: repeat(4, 1fr); }
                            .pa-two-col { grid-template-columns: 1fr 1fr; }
                            .pa-how-grid { grid-template-columns: repeat(4, 1fr); }
                            @media (max-width: 900px) {
                                .pa-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
                                .pa-how-grid { grid-template-columns: repeat(2, 1fr) !important; }
                            }
                            @media (max-width: 600px) {
                                .pa-stats-grid { 
                                    display: grid !important;
                                    grid-template-columns: repeat(4, 1fr) !important;
                                    gap: 0.35rem !important;
                                }
                                .pa-stats-grid > div {
                                    padding: 0.5rem !important;
                                    gap: 0.25rem !important;
                                    border-radius: 12px !important;
                                    align-items: center;
                                    text-align: center;
                                }
                                .pa-stats-grid > div > div {
                                    width: 28px !important;
                                    height: 28px !important;
                                    font-size: 0.9rem !important;
                                    border-radius: 8px !important;
                                }
                                .pa-stats-grid > div > p:nth-child(2) {
                                    font-size: 0.55rem !important;
                                    letter-spacing: 0 !important;
                                }
                                .pa-stats-grid > div > p:nth-child(3) {
                                    font-size: 0.9rem !important;
                                }
                                .pa-stats-grid > div:nth-child(1) > p:nth-child(3) {
                                    font-size: 0.7rem !important;
                                }
                                .pa-two-col { grid-template-columns: 1fr !important; }
                                .pa-how-grid { grid-template-columns: repeat(2, 1fr) !important; }
                            }
                            @keyframes shimmer {
                                0% { background-position: 200% 0; }
                                100% { background-position: -200% 0; }
                            }
                        `}</style>
                            </>
                        )}
                    </div>
                )}


                {/* Themes tab content */}
                {activeTab === 'themes' && (
                    <div style={{ width: '100%' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
                            borderRadius: '16px', padding: '2.5rem 2rem', marginBottom: '2rem',
                            color: '#fff', position: 'relative', overflow: 'hidden',
                            boxShadow: '0 10px 25px -5px rgba(147, 51, 234, 0.4)'
                        }}>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Roastcard Themes</h2>
                            </div>
                            <Palette size={120} style={{ position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.1 }} />
                        </div>

                        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>


                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
                                {ROAST_THEMES.map(theme => {
                                    const isSelected = roastEnabledThemes.includes(theme.id);
                                    const isLightText = theme.textColor === '#ffffff';
                                    return (
                                        <div
                                            key={theme.id}
                                            onClick={async () => {
                                                const newThemes = isSelected ? roastEnabledThemes.filter(id => id !== theme.id) : [...roastEnabledThemes, theme.id];
                                                setRoastEnabledThemes(newThemes);
                                                try {
                                                    const headers = await getAuthHeaders();
                                                    await fetch(`${API}/api/admin/setting/update`, {
                                                        method: 'PATCH',
                                                        headers,
                                                        body: JSON.stringify({ key: 'roast_enabled_themes', value: JSON.stringify(newThemes) })
                                                    });
                                                } catch (e) {
                                                    showToast('Failed to save theme selection', 'error');
                                                }
                                            }}
                                            style={{
                                                padding: '1.25rem 0.75rem 0.85rem 0.75rem',
                                                borderRadius: '16px',
                                                border: isSelected ? '2.5px solid #4f46e5' : '2px solid #e2e8f0',
                                                background: theme.bg || '#fff',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                minHeight: '115px',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                opacity: isSelected ? 1 : 0.65,
                                                position: 'relative',
                                                boxShadow: isSelected ? '0 8px 20px -4px rgba(79, 70, 229, 0.25)' : '0 2px 6px rgba(0,0,0,0.04)',
                                                transform: isSelected ? 'translateY(-2px)' : 'none'
                                            }}
                                        >
                                            {/* Selected Checkmark Badge */}
                                            {isSelected && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '-8px',
                                                    right: '-8px',
                                                    background: '#4f46e5',
                                                    color: '#fff',
                                                    borderRadius: '50%',
                                                    width: '22px',
                                                    height: '22px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: '0 2px 6px rgba(79, 70, 229, 0.4)',
                                                    fontSize: '12px',
                                                    fontWeight: 800
                                                }}>
                                                    ✓
                                                </div>
                                            )}

                                            {/* Theme Name */}
                                            <span style={{
                                                fontSize: '0.95rem',
                                                fontWeight: 700,
                                                color: theme.textColor || '#111',
                                                letterSpacing: '0.01em',
                                                textShadow: isLightText ? '0 1px 2px rgba(0,0,0,0.35)' : 'none',
                                                textAlign: 'center'
                                            }}>
                                                {theme.id.charAt(0).toUpperCase() + theme.id.slice(1)}
                                            </span>

                                            {/* Preview Pill Button */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPreviewTheme(theme);
                                                }}
                                                style={{
                                                    marginTop: '0.75rem',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    padding: '0.35rem 0.75rem',
                                                    borderRadius: '999px',
                                                    background: isLightText ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.07)',
                                                    color: theme.textColor || '#334155',
                                                    border: isLightText ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid rgba(0, 0, 0, 0.1)',
                                                    backdropFilter: 'blur(4px)',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease',
                                                    textShadow: 'none'
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.transform = 'scale(1.05)';
                                                    e.currentTarget.style.background = isLightText ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.14)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                    e.currentTarget.style.background = isLightText ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.07)';
                                                }}
                                                title={`Preview ${theme.id} design`}
                                            >
                                                <Eye size={13} strokeWidth={2.2} />
                                                <span>Preview</span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {previewTheme && (
                                <div onClick={() => setPreviewTheme(null)} style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", display: "flex", flexDirection: "column", alignItems: "center", padding: "2rem 1rem", overflowY: "auto" }}>
                                    <div onClick={(e) => e.stopPropagation()} style={{ margin: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem", width: "100%", maxWidth: "380px" }}>
                                        <div style={{ position: "relative", width: "100%", borderRadius: "30px", boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
                                            <CardVisual
                                                phase="ready"
                                                roastText="Oh look, another person buying an aesthetic water bottle they'll use twice. Your wishlist screams 'I want to be a Pinterest board' but your budget says 'maybe next month'. Please, save your money for something you actually need."
                                                dateStr={new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                                showButton={true}
                                                downloading={false}
                                                isCapture={false}
                                                tearing={false}
                                                theme={previewTheme}
                                            />
                                        </div>
                                        <div style={{ display: "flex", gap: "0.75rem", width: "100%", marginTop: "1.5rem" }}>
                                            <button onClick={() => setPreviewTheme(null)} style={{ flex: 1, padding: "0.9rem 1.25rem", background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "16px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", fontFamily: "inherit", backdropFilter: "blur(4px)" }}>Close Preview</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}


                {/* Broadcast tab content */}
                {activeTab === 'broadcast' && (
                    <div style={{ width: '100%' }}>
                        {/* Segmented Control */}
                        <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: '16px', padding: '4px', gap: '4px', width: 'fit-content', marginBottom: '1.5rem' }}>
                            {[
                                { key: 'compose', label: '✏️ Compose' },
                                { key: 'history', label: '📊 History' }
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => {
                                        setBroadcastView(key);
                                        if (key === 'history') fetchBroadcastHistory();
                                    }}
                                    style={{
                                        padding: '0.55rem 1.2rem', border: 'none', borderRadius: '12px', cursor: 'pointer',
                                        fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s',
                                        background: broadcastView === key ? '#db2777' : 'transparent',
                                        color: broadcastView === key ? '#fff' : 'var(--text-muted)',
                                        boxShadow: broadcastView === key ? '0 2px 12px rgba(219,39,119,0.3)' : 'none'
                                    }}
                                >{label}</button>
                            ))}
                        </div>

                        {/* ── History View ── */}
                        {broadcastView === 'history' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#f2f2f7', padding: '1rem', borderRadius: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.5rem' }}>
                                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#000' }}>Broadcast History</h2>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => setIsDeleteHistoryModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', background: '#ff3b30', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                                            <Trash2 size={14} /> Clear
                                        </button>
                                        <button onClick={fetchBroadcastHistory} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', background: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#007aff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                            <RefreshCw size={14} style={{ animation: broadcastHistoryLoading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
                                        </button>
                                    </div>
                                </div>
                                {broadcastHistoryLoading ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                                        <RefreshCw size={24} color="#007aff" style={{ animation: 'spin 1s linear infinite' }} />
                                    </div>
                                ) : broadcastHistory.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '12px', border: '0.5px solid #e5e5ea' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                                        <p style={{ color: '#000', fontWeight: 600, margin: 0 }}>No broadcasts sent yet</p>
                                        <p style={{ color: '#8e8e93', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>Switch to Compose to send your first notification!</p>
                                    </div>
                                ) : (
                                    <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e5e5ea', overflow: 'hidden' }}>
                                    {broadcastHistory.map((record, index) => {
                                        const ctr = record.sent_count > 0 ? ((record.click_count / record.sent_count) * 100).toFixed(1) : '0.0';
                                        const ctrColor = parseFloat(ctr) >= 10 ? '#34c759' : parseFloat(ctr) >= 5 ? '#ff9500' : '#ff3b30';
                                        return (
                                            <div key={record.id} style={{
                                                padding: '1rem',
                                                borderBottom: index < broadcastHistory.length - 1 ? '0.5px solid #e5e5ea' : 'none',
                                                display: 'flex', flexDirection: 'column', gap: '0.75rem'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 600, fontSize: '1rem', color: '#000', marginBottom: '0.2rem' }}>{record.title}</div>
                                                        <div style={{ fontSize: '0.85rem', color: '#8e8e93', lineHeight: 1.3 }}>{record.body}</div>
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: '#8e8e93', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: 500 }}>
                                                        {new Date(record.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.2rem 0.5rem', background: '#f2f2f7', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#007aff' }}>
                                                        <Users size={12} /> {record.sent_count} Sent
                                                    </span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.2rem 0.5rem', background: '#f2f2f7', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#af52de' }}>
                                                        👆 {record.click_count} Clicked
                                                    </span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.2rem 0.5rem', background: record.sent_count > 0 ? `${ctrColor}15` : '#f2f2f7', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, color: ctrColor }}>
                                                        📈 {ctr}% CTR
                                                    </span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.2rem 0.5rem', background: '#f2f2f7', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#ff2d55' }}>
                                                        🎯 {record.target}
                                                    </span>
                                                    {record.failed_count > 0 && (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.2rem 0.5rem', background: '#fef2f2', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#ff3b30' }}>
                                                            ❌ {record.failed_count} Failed
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Compose View ── */}
                        {broadcastView === 'compose' && <div className="broadcast-grid">
                            {/* Left Column - Editor */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#f2f2f7', padding: '1rem', borderRadius: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', padding: '0 0.5rem' }}>
                                    <div style={{ background: '#db2777', padding: '0.5rem', borderRadius: '10px', color: '#fff' }}>
                                        <Megaphone size={20} />
                                    </div>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#000' }}>Compose Broadcast</h2>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#8e8e93' }}>Send push notifications to your users</p>
                                    </div>
                                </div>

                                {/* GROUP 1: Title & Message */}
                                <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e5e5ea', overflow: 'hidden' }}>
                                    <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'flex-start' }}>
                                        <label style={{ width: '80px', fontSize: '0.95rem', color: '#000', paddingTop: '0.4rem', fontWeight: 500 }}>Title</label>
                                        <input type="text" value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} placeholder="Notification Title"
                                            style={{ flex: 1, padding: '0.4rem 0', background: 'transparent', border: 'none', color: '#000', fontSize: '1rem', outline: 'none' }} />
                                    </div>
                                    <div style={{ height: '0.5px', background: '#e5e5ea', marginLeft: '1rem' }} />
                                    <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'flex-start' }}>
                                        <label style={{ width: '80px', fontSize: '0.95rem', color: '#000', paddingTop: '0.4rem', fontWeight: 500 }}>Message</label>
                                        <textarea value={broadcastBody} onChange={e => setBroadcastBody(e.target.value)} placeholder="Keep it short and engaging..." rows={3}
                                            style={{ flex: 1, padding: '0.4rem 0', background: 'transparent', border: 'none', color: '#000', fontSize: '1rem', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
                                    </div>
                                </div>

                                {/* GROUP 2: Links & Media */}
                                <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e5e5ea', overflow: 'hidden' }}>
                                    <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center' }}>
                                        <label style={{ width: '85px', minWidth: '85px', flexShrink: 0, fontSize: '0.95rem', color: '#000', fontWeight: 500 }}>Target URL</label>
                                        <input type="text" value={broadcastUrl} onChange={e => setBroadcastUrl(e.target.value)} placeholder="/discover"
                                            style={{ flex: 1, minWidth: 0, padding: '0.2rem 0', background: 'transparent', border: 'none', color: '#000', fontSize: '1rem', outline: 'none' }} />
                                    </div>
                                    <div style={{ height: '0.5px', background: '#e5e5ea', marginLeft: '1rem' }} />
                                    <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                            <label style={{ width: '85px', minWidth: '85px', flexShrink: 0, fontSize: '0.95rem', color: '#000', fontWeight: 500 }}>Image URL</label>
                                            <input type="text" value={broadcastImage} onChange={e => setBroadcastImage(e.target.value)} placeholder="https://..."
                                                style={{ flex: 1, minWidth: 0, padding: '0.2rem 0', background: 'transparent', border: 'none', color: '#000', fontSize: '1rem', outline: 'none', textOverflow: 'ellipsis' }} />
                                        </div>
                                        <label style={{ padding: '0.35rem 0.75rem', background: '#f2f2f7', color: '#db2777', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap', marginLeft: '0.5rem', flexShrink: 0 }}>
                                            {isUploadingImage ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Upload'}
                                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} disabled={isUploadingImage} />
                                        </label>
                                    </div>
                                </div>

                                {/* GROUP 3: Target Audience */}
                                <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e5e5ea', overflow: 'hidden' }}>
                                    <div 
                                        onClick={() => setIsBroadcastFilterOpen(!isBroadcastFilterOpen)}
                                        style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: isBroadcastFilterOpen ? '#f9fafb' : 'transparent' }}
                                    >
                                        <label style={{ fontSize: '0.95rem', color: '#000', fontWeight: 500, cursor: 'pointer' }}>Target Audience</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '0.95rem', color: '#8e8e93' }}>
                                                {broadcastTargetUserIds.length > 0 ? `${broadcastTargetUserIds.length} users` : 'All Users'}
                                            </span>
                                            <ChevronDown size={16} color="#c7c7cc" style={{ transform: isBroadcastFilterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                        </div>
                                    </div>

                                    {isBroadcastFilterOpen && (
                                        <div style={{ background: '#f2f2f7', padding: '0.75rem 1rem', borderTop: '0.5px solid #e5e5ea' }}>
                                            <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                                                <Search size={14} color="#8e8e93" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                                                <input
                                                    type="text" placeholder="Search users..."
                                                    value={broadcastUserSearchTerm} onChange={(e) => setBroadcastUserSearchTerm(e.target.value)}
                                                    style={{ width: '100%', padding: '0.4rem 0.4rem 0.4rem 28px', background: '#e3e3e8', border: 'none', borderRadius: '8px', outline: 'none', color: '#000', fontSize: '0.9rem', boxSizing: 'border-box' }}
                                                />
                                            </div>

                                            {!broadcastUserSearchTerm && (
                                                <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '0.5px solid #e5e5ea', marginBottom: '0.75rem' }}>
                                                    <button type="button" onClick={() => { setBroadcastTargetUserIds([]); setIsBroadcastFilterOpen(false); }} style={{ width: '100%', padding: '0.65rem 0.75rem', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#000', fontWeight: 500, fontSize: '0.9rem', borderBottom: '0.5px solid #e5e5ea' }}>
                                                        <Users size={16} color="#db2777" /> All Users (Global)
                                                    </button>
                                                    <button type="button" onClick={() => { setBroadcastTargetUserIds(users.filter(u => u.isPremium).map(u => u.id)); setIsBroadcastFilterOpen(false); }} style={{ width: '100%', padding: '0.65rem 0.75rem', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#000', fontWeight: 500, fontSize: '0.9rem', borderBottom: '0.5px solid #e5e5ea' }}>
                                                        <Crown size={16} color="#eab308" /> Premium Users
                                                    </button>
                                                    <button type="button" onClick={() => { setBroadcastTargetUserIds(users.filter(u => !u.isPremium).map(u => u.id)); setIsBroadcastFilterOpen(false); }} style={{ width: '100%', padding: '0.65rem 0.75rem', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#000', fontWeight: 500, fontSize: '0.9rem' }}>
                                                        <User size={16} color="#3b82f6" /> Free Users
                                                    </button>
                                                </div>
                                            )}

                                            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', maxHeight: '200px', overflowY: 'auto', border: '0.5px solid #e5e5ea' }}>
                                                {users.filter(u => {
                                                    if (!broadcastUserSearchTerm) return true;
                                                    const s = broadcastUserSearchTerm.toLowerCase();
                                                    return (u.name || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s);
                                                }).map((u, idx, arr) => (
                                                    <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: idx < arr.length - 1 ? '0.5px solid #e5e5ea' : 'none', background: 'transparent' }} onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                        <input
                                                            type="checkbox" checked={broadcastTargetUserIds.includes(u.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setBroadcastTargetUserIds([...broadcastTargetUserIds, u.id]);
                                                                else setBroadcastTargetUserIds(broadcastTargetUserIds.filter(id => id !== u.id));
                                                            }}
                                                            style={{ accentColor: '#db2777', width: '16px', height: '16px', cursor: 'pointer' }}
                                                        />
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span style={{ fontSize: '0.9rem', color: '#000' }}>{u.name || 'Anonymous'}</span>
                                                            <span style={{ fontSize: '0.75rem', color: '#8e8e93' }}>{u.email}</span>
                                                        </div>
                                                    </label>
                                                ))}
                                                {users.filter(u => {
                                                    if (!broadcastUserSearchTerm) return true;
                                                    const s = broadcastUserSearchTerm.toLowerCase();
                                                    return (u.name || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s);
                                                }).length === 0 && (
                                                    <div style={{ padding: '1rem', textAlign: 'center', color: '#8e8e93', fontSize: '0.85rem' }}>No users found.</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* GROUP 4: Action Button */}
                                <div>
                                    <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e5e5ea', overflow: 'hidden' }}>
                                        <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '28px', height: '28px', background: '#007aff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                                    <Command size={16} />
                                                </div>
                                                <span style={{ fontSize: '1rem', color: '#000' }}>Rich Action Button</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setBroadcastActionButtonEnabled(!broadcastActionButtonEnabled)}
                                                style={{
                                                    position: 'relative', width: '51px', height: '31px',
                                                    background: broadcastActionButtonEnabled ? '#34c759' : '#e9e9ea',
                                                    borderRadius: '99px', border: 'none', cursor: 'pointer', transition: 'background 0.3s ease', padding: 0
                                                }}
                                            >
                                                <div style={{
                                                    position: 'absolute', top: '2px', left: broadcastActionButtonEnabled ? '22px' : '2px',
                                                    width: '27px', height: '27px', background: '#fff', borderRadius: '50%',
                                                    transition: 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                }} />
                                            </button>
                                        </div>
                                        
                                        {broadcastActionButtonEnabled && (
                                            <div style={{ background: '#f9fafb' }}>
                                                <div style={{ height: '0.5px', background: '#e5e5ea' }} />
                                                <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center' }}>
                                                    <label style={{ width: '100px', fontSize: '0.9rem', color: '#8e8e93', fontWeight: 500 }}>Title</label>
                                                    <input type="text" value={broadcastActionButtonTitle} onChange={e => setBroadcastActionButtonTitle(e.target.value)} placeholder="e.g. View Deal"
                                                        style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', color: '#000' }} />
                                                </div>
                                                <div style={{ height: '0.5px', background: '#e5e5ea', marginLeft: '1rem' }} />
                                                <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center' }}>
                                                    <label style={{ width: '100px', fontSize: '0.9rem', color: '#8e8e93', fontWeight: 500 }}>URL</label>
                                                    <input type="text" value={broadcastActionButtonUrl} onChange={e => setBroadcastActionButtonUrl(e.target.value)} placeholder="e.g. /shop/sale"
                                                        style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', color: '#000' }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: '#8e8e93' }}>
                                        Add a custom button inside the notification.
                                    </div>
                                </div>

                                {/* GROUP 5: Templates */}
                                <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e5e5ea', overflow: 'hidden', padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#000' }}>Templates</h3>
                                        <button
                                            type="button"
                                            onClick={() => (broadcastTitle || broadcastBody) ? setIsPromptModalOpen(true) : showToast('Fill in a title or message first', 'error')}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'transparent', border: 'none', fontSize: '0.9rem', fontWeight: 500, color: '#007aff', cursor: 'pointer' }}
                                        >
                                            Save Current
                                        </button>
                                    </div>
                                    
                                    {customTemplates.length > 0 && (
                                        <div style={{ marginBottom: '1rem' }}>
                                            <div style={{ fontSize: '0.8rem', color: '#8e8e93', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>My Saved</div>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {customTemplates.map((tpl, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', background: '#f2f2f7', borderRadius: '99px', overflow: 'hidden' }}>
                                                        <button
                                                            type="button" onClick={() => { setBroadcastTitle(tpl.title); setBroadcastBody(tpl.body); setBroadcastUrl(tpl.url || ''); setBroadcastImage(tpl.image || ''); }}
                                                            style={{ padding: '0.4rem 0.75rem', background: 'transparent', border: 'none', fontSize: '0.85rem', color: '#000', cursor: 'pointer' }}
                                                        >
                                                            {tpl.label}
                                                        </button>
                                                        <button
                                                            type="button" onClick={() => { const updated = customTemplates.filter((_, idx) => idx !== i); setCustomTemplates(updated); showToast('Template deleted'); }}
                                                            style={{ padding: '0.4rem 0.6rem 0.4rem 0', background: 'transparent', border: 'none', cursor: 'pointer', color: '#ff3b30' }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: '#8e8e93', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Start</div>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {[
                                                { label: "Welcome 👋", title: "Welcome to WishFlow! 🎉", body: "Start building your ultimate wishlist today, {{name}}.", url: "/", image: "" },
                                                { label: "Sale 🛍️", title: "Weekend Sale! 🛍️", body: "Hey {{name}}, check out our exclusive weekend discounts, just for you.", url: "/discover", image: "" },
                                                { label: "Cart 🛒", title: "Don't forget your items! 🛒", body: "The items in your wishlist are waiting for you!", url: "/profile", image: "" },
                                                { label: "Update 🚀", title: "New Feature Alert! 🚀", body: "We've just added exciting new tools to help you manage your lists.", url: "/", image: "" },
                                                { label: "Miss You 🥺", title: "We miss you, {{name}}! 🥺", body: "Come back and see what's trending right now on WishFlow.", url: "/discover", image: "" },
                                                { label: "Feedback 📝", title: "We value your feedback!", body: "Take a 1-minute survey and get a special badge on your profile.", url: "/contact", image: "" },
                                            ].map((tpl, i) => (
                                                <button
                                                    key={i} type="button"
                                                    onClick={() => { setBroadcastTitle(tpl.title); setBroadcastBody(tpl.body); setBroadcastUrl(tpl.url || ''); setBroadcastImage(tpl.image || ''); }}
                                                    style={{ padding: '0.4rem 0.75rem', background: '#f2f2f7', border: 'none', borderRadius: '99px', fontSize: '0.85rem', color: '#000', cursor: 'pointer' }}
                                                >
                                                    {tpl.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - iOS Preview */}
                            <div className="broadcast-preview-col">
                                {/* iPhone Mockup */}
                                <div style={{
                                    width: '320px', height: '650px', background: '#000', borderRadius: '50px',
                                    padding: '14px', boxSizing: 'border-box', position: 'relative',
                                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), inset 0 0 0 2px #333, inset 0 0 0 8px #111'
                                }}>
                                    {/* Notch */}
                                    <div style={{ position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)', width: '120px', height: '35px', background: '#000', borderRadius: '0 0 20px 20px', zIndex: 10 }}>
                                        <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', width: '50px', height: '8px', background: '#111', borderRadius: '10px' }}></div>
                                        <div style={{ position: 'absolute', top: '10px', right: '25px', width: '12px', height: '12px', background: '#111', borderRadius: '50%' }}></div>
                                    </div>

                                    {/* Screen */}
                                    <div style={{ width: '100%', height: '100%', borderRadius: '38px', overflow: 'hidden', position: 'relative', background: 'url(https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1400&auto=format&fit=crop) center/cover' }}>
                                        {/* Status Bar */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', color: '#fff', fontSize: '0.75rem', fontWeight: 600, zIndex: 5, position: 'relative' }}>
                                            <span>{new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })}</span>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <span>📶</span> <span>🔋</span>
                                            </div>
                                        </div>

                                        {/* Lockscreen Time */}
                                        <div style={{ position: 'absolute', top: '80px', width: '100%', textAlign: 'center', color: '#fff', textShadow: '0 1px 10px rgba(0,0,0,0.2)' }}>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: '1.25rem' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                                            <p style={{ margin: '-10px 0 0', fontWeight: 800, fontSize: '5rem', letterSpacing: '-0.02em', fontFamily: 'system-ui, -apple-system' }}>
                                                {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })}
                                            </p>
                                        </div>

                                        {/* iOS Notification Toast */}
                                        <div style={{
                                            position: 'absolute', top: '300px', left: '16px', right: '16px',
                                            background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(25px)', WebkitBackdropFilter: 'blur(25px)',
                                            borderRadius: '24px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.2)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <img src="/192x192.png" alt="App" style={{ width: '20px', height: '20px', borderRadius: '5px' }} />
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(0,0,0,0.7)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>WishFlow</span>
                                                <span style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.5)', marginLeft: 'auto' }}>now</span>
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#000', lineHeight: 1.2 }}>{broadcastTitle || 'Notification Title'}</p>
                                                <p style={{ margin: '2px 0 0 0', fontWeight: 500, fontSize: '0.9rem', color: 'rgba(0,0,0,0.85)', lineHeight: 1.3 }}>{broadcastBody || 'The notification body goes here.'}</p>
                                            </div>
                                            {broadcastImage && (
                                                <div style={{ marginTop: '0.25rem', width: '100%', height: '140px', borderRadius: '12px', overflow: 'hidden', background: '#e2e8f0' }}>
                                                    <img src={broadcastImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                            )}
                                            {broadcastActionButtonEnabled && broadcastActionButtonTitle && (
                                                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                                    <div style={{ flex: 1, padding: '0.65rem', background: 'rgba(0,0,0,0.05)', borderRadius: '12px', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600, color: '#db2777' }}>
                                                        {broadcastActionButtonTitle}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Send Button */}
                                <button
                                    type="button"
                                    disabled={!broadcastTitle || !broadcastBody || broadcastLoading}
                                    onClick={() => setIsBroadcastModalOpen(true)}
                                    style={{
                                        width: '100%', padding: '1rem', background: '#db2777', color: '#fff',
                                        border: 'none', borderRadius: '16px', fontSize: '1rem', fontWeight: 800,
                                        cursor: (!broadcastTitle || !broadcastBody || broadcastLoading) ? 'not-allowed' : 'pointer',
                                        opacity: (!broadcastTitle || !broadcastBody || broadcastLoading) ? 0.6 : 1,
                                        transition: 'background 0.2s',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                    }}
                                >
                                    {broadcastLoading ? <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={20} />}
                                    {broadcastLoading ? 'Sending...' : 'Send Broadcast'}
                                </button>
                            </div>
                        </div>}
                    </div>
                )}

                {/* Global Settings tab content */}
                {activeTab === 'global-settings' && (
                    <div style={{ width: '100%' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                            borderRadius: '16px', padding: '2.5rem 2rem', marginBottom: '2rem',
                            color: '#fff', position: 'relative', overflow: 'hidden',
                            boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)'
                        }}>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Global App Settings</h2>

                            </div>
                            <Settings size={120} style={{ position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.1 }} />
                        </div>

                        <div style={{
                            background: '#fff',
                            borderRadius: '12px',
                            border: '0.5px solid #e5e5ea',
                            marginBottom: '2rem',
                            overflow: 'hidden'
                        }}>
                            {/* Roast Feature Row */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 1rem', background: '#fff' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '28px', height: '28px', background: '#ff3b30', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.9rem' }}>
                                        🔥
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 400, color: '#000' }}>Roast Feature</h3>
                                </div>
                                <button
                                    disabled={togglingRoast}
                                    onClick={async () => {
                                        setTogglingRoast(true);
                                        try {
                                            const headers = await getAuthHeaders();
                                            const res = await fetch(`${API}/api/admin/feature/toggle`, { method: 'PATCH', headers, body: JSON.stringify({ key: 'roast_feature_enabled', enabled: !roastFeatureEnabled }) });
                                            if (res.ok) {
                                                setRoastFeatureEnabled(!roastFeatureEnabled);
                                                showToast(!roastFeatureEnabled ? 'Enabled' : 'Disabled');
                                            } else throw new Error();
                                        } catch (e) {
                                            showToast('Error', 'error');
                                        } finally {
                                            setTogglingRoast(false);
                                        }
                                    }}
                                    style={{
                                        position: 'relative', width: '51px', height: '31px',
                                        background: roastFeatureEnabled ? '#34c759' : '#e9e9ea',
                                        borderRadius: '99px', border: 'none', cursor: togglingRoast ? 'wait' : 'pointer',
                                        transition: 'background 0.3s ease', padding: 0
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute', top: '2px', left: roastFeatureEnabled ? '22px' : '2px',
                                        width: '27px', height: '27px', background: '#fff', borderRadius: '50%',
                                        transition: 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 1rem', background: '#fff' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '28px', height: '28px', background: '#007aff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.9rem' }}>
                                        🖱️
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 400, color: '#000' }}>Magnetic Cursor</h3>
                                </div>
                                <button
                                    disabled={togglingCursor}
                                    onClick={async () => {
                                        setTogglingCursor(true);
                                        try {
                                            const headers = await getAuthHeaders();
                                            const res = await fetch(`${API}/api/admin/feature/toggle`, { method: 'PATCH', headers, body: JSON.stringify({ key: 'custom_cursor_enabled', enabled: !customCursorEnabled }) });
                                            if (res.ok) {
                                                setCustomCursorEnabled(!customCursorEnabled);
                                                window.dispatchEvent(new CustomEvent('cursorSettingChanged', { detail: { enabled: !customCursorEnabled } }));
                                                showToast(!customCursorEnabled ? 'Enabled' : 'Disabled');
                                            } else throw new Error();
                                        } catch (e) {
                                            showToast('Error', 'error');
                                        } finally {
                                            setTogglingCursor(false);
                                        }
                                    }}
                                    style={{
                                        position: 'relative', width: '51px', height: '31px',
                                        background: customCursorEnabled ? '#34c759' : '#e9e9ea',
                                        borderRadius: '99px', border: 'none', cursor: togglingCursor ? 'wait' : 'pointer',
                                        transition: 'background 0.3s ease', padding: 0
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute', top: '2px', left: customCursorEnabled ? '22px' : '2px',
                                        width: '27px', height: '27px', background: '#fff', borderRadius: '50%',
                                        transition: 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 1rem', background: '#fff' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '28px', height: '28px', background: '#34c759', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                        <RefreshCw size={16} />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 400, color: '#000' }}>Pull to Refresh</h3>
                                </div>
                                <button
                                    disabled={togglingRefresh}
                                    onClick={async () => {
                                        setTogglingRefresh(true);
                                        try {
                                            const headers = await getAuthHeaders();
                                            const res = await fetch(`${API}/api/admin/feature/toggle`, { method: 'PATCH', headers, body: JSON.stringify({ key: 'refresh_feature_enabled', enabled: !refreshFeatureEnabled }) });
                                            if (res.ok) {
                                                setRefreshFeatureEnabled(!refreshFeatureEnabled);
                                                showToast(!refreshFeatureEnabled ? 'Enabled' : 'Disabled');
                                            } else throw new Error();
                                        } catch (e) {
                                            showToast('Error', 'error');
                                        } finally {
                                            setTogglingRefresh(false);
                                        }
                                    }}
                                    style={{
                                        position: 'relative', width: '51px', height: '31px',
                                        background: refreshFeatureEnabled ? '#34c759' : '#e9e9ea',
                                        borderRadius: '99px', border: 'none', cursor: togglingRefresh ? 'wait' : 'pointer',
                                        transition: 'background 0.3s ease', padding: 0
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute', top: '2px', left: refreshFeatureEnabled ? '22px' : '2px',
                                        width: '27px', height: '27px', background: '#fff', borderRadius: '50%',
                                        transition: 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                {/* Search & Filter — only for users/items tabs */}
                {activeTab !== 'blog' && activeTab !== 'price-alerts' && activeTab !== 'global-settings' && activeTab !== 'broadcast' && activeTab !== 'themes' && (
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
                                style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 3rem', background: 'var(--surface)', border: '1px solid #e2e8f0', borderRadius: '99px', fontSize: '0.95rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(0,0,0,0.01)' }}
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
                                    style={{ background: 'var(--surface)', border: '1px solid #e2e8f0', color: '#0f172a', borderRadius: '99px', height: '100%', padding: '0.875rem 1.25rem', boxShadow: '0 1px 2px rgba(0,0,0,0.01)', fontWeight: 600 }}
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
                                    style={{ background: 'var(--surface)', border: '1px solid #e2e8f0', color: '#0f172a', borderRadius: '99px', height: '100%', padding: '0.875rem 1.25rem', boxShadow: '0 1px 2px rgba(0,0,0,0.01)', fontWeight: 600 }}
                                />
                            )}
                        </div>
                    </div>
                )}

                {activeTab !== 'blog' && activeTab !== 'price-alerts' && activeTab !== 'global-settings' && activeTab !== 'broadcast' && activeTab !== 'themes' && (
                    <>
                        {activeTab === 'users' ? (
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
                        ) : (
                            <>
                                {/* Items Table */}
                                <div className="admin-table-wrapper" style={{ background: 'var(--surface)', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                                    <div className="admin-table-header" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', padding: '1rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <span>Item Details</span>
                                        <span>Created By</span>
                                        <span>Price</span>
                                        <span>Date Added</span>
                                        <span>Link</span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        {loadingItems ? (
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                {Array.from({ length: 6 }).map((_, i) => (
                                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', padding: '1.25rem 1.5rem', alignItems: 'center', borderBottom: i < 5 ? '1px solid #f1f5f9' : 'none', gap: '1rem' }}>
                                                        {/* Item details col */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                            <div className="skeleton-shimmer" style={{ width: '48px', height: '48px', borderRadius: '8px', flexShrink: 0 }} />
                                                            <div className="skeleton-shimmer" style={{ height: '13px', width: '60%' }} />
                                                        </div>
                                                        {/* Created by col */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                            <div className="skeleton-shimmer" style={{ height: '13px', width: '70%' }} />
                                                            <div className="skeleton-shimmer" style={{ height: '11px', width: '85%' }} />
                                                        </div>
                                                        {/* Price col */}
                                                        <div className="skeleton-shimmer" style={{ height: '13px', width: '50px' }} />
                                                        {/* Date col */}
                                                        <div className="skeleton-shimmer" style={{ height: '13px', width: '70px' }} />
                                                        {/* Link col */}
                                                        <div className="skeleton-shimmer" style={{ height: '30px', width: '70px', borderRadius: '8px' }} />
                                                    </div>
                                                ))}
                                            </div>
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
                                                            background: 'var(--surface)',
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
                                {!loadingItems && filteredItems.length > 0 && (
                                    <div className="admin-pagination-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '0 0.5rem', paddingBottom: '2rem', flexWrap: 'nowrap', gap: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => setCurrentItemsPage(p => Math.max(1, p - 1))}
                                                disabled={currentItemsPage === 1}
                                                style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: currentItemsPage === 1 ? 'not-allowed' : 'pointer', color: '#64748b', opacity: currentItemsPage === 1 ? 0.5 : 1 }}
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
                                                style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: currentItemsPage === totalItemsPages ? 'not-allowed' : 'pointer', color: '#64748b', opacity: currentItemsPage === totalItemsPages ? 0.5 : 1 }}
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
                                                        style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'var(--surface)', color: '#0f172a', fontSize: '0.85rem' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )} {/* end activeTab !== 'blog' */}
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
                        background: #fff;
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
                isOpen={isBroadcastModalOpen}
                title="Global Broadcast Notification"
                message="Are you sure you want to send this push notification to ALL subscribed users?"
                cancelText="Cancel"
                confirmText="Send Broadcast"
                isDestructive={false}
                onCancel={() => setIsBroadcastModalOpen(false)}
                onConfirm={confirmBroadcast}
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

            <PromptModal
                isOpen={isPromptModalOpen}
                title="Save Template"
                message="Enter a short name for this custom template:"
                placeholder="e.g., Summer Sale"
                cancelText="Cancel"
                confirmText="Save"
                onCancel={() => setIsPromptModalOpen(false)}
                onConfirm={(label) => {
                    setIsPromptModalOpen(false);
                    if (label) {
                        setCustomTemplates([...customTemplates, { label: label + ' ⭐', title: broadcastTitle, body: broadcastBody, url: broadcastUrl, image: broadcastImage, isCustom: true }]);
                        showToast('Template saved!');
                    }
                }}
            />

            {/* Custom Delete History Modal */}
            {isDeleteHistoryModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn 0.2s ease' }}>
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '2rem', width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <div style={{ width: '48px', height: '48px', background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                            <Trash2 size={24} color="#ef4444" />
                        </div>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#111' }}>Clear History</h3>
                        <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
                            Select how much broadcast history you want to permanently delete.
                        </p>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>Timeframe</label>
                            <div style={{ position: 'relative' }}>
                                <div
                                    onClick={() => setIsTimeframeDropdownOpen(!isTimeframeDropdownOpen)}
                                    style={{
                                        width: '100%', padding: '0.9rem 1.2rem', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                                        fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', transition: 'all 0.2s',
                                        boxShadow: isTimeframeDropdownOpen ? '0 0 0 4px rgba(219,39,119,0.1)' : 'none',
                                        borderColor: isTimeframeDropdownOpen ? '#db2777' : '#e2e8f0'
                                    }}
                                >
                                    <span>
                                        {deleteHistoryTimeframe === '1day' ? 'Older than 1 Day' :
                                            deleteHistoryTimeframe === '1week' ? 'Older than 1 Week' :
                                                deleteHistoryTimeframe === '1month' ? 'Older than 1 Month' : 'Delete All History'}
                                    </span>
                                    <ChevronDown size={18} style={{ transform: isTimeframeDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#94a3b8' }} />
                                </div>

                                {isTimeframeDropdownOpen && (
                                    <>
                                        <div
                                            style={{ position: 'fixed', inset: 0, zIndex: 100 }}
                                            onClick={() => setIsTimeframeDropdownOpen(false)}
                                        />
                                        <div style={{
                                            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 101,
                                            background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                                            border: '1px solid rgba(0,0,0,0.08)', borderRadius: '16px', padding: '0.5rem',
                                            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)', animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                                        }}>
                                            {[
                                                { id: '1day', label: 'Older than 1 Day' },
                                                { id: '1week', label: 'Older than 1 Week' },
                                                { id: '1month', label: 'Older than 1 Month' },
                                                { id: 'all', label: 'Delete All History', isDestructive: true }
                                            ].map((option) => (
                                                <div
                                                    key={option.id}
                                                    onClick={() => {
                                                        setDeleteHistoryTimeframe(option.id);
                                                        setIsTimeframeDropdownOpen(false);
                                                    }}
                                                    style={{
                                                        padding: '0.85rem 1rem', borderRadius: '12px', cursor: 'pointer',
                                                        fontSize: '0.95rem', fontWeight: deleteHistoryTimeframe === option.id ? 700 : 500,
                                                        color: option.isDestructive ? '#ef4444' : '#1e293b',
                                                        background: deleteHistoryTimeframe === option.id ? (option.isDestructive ? '#fef2f2' : '#f1f5f9') : 'transparent',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onMouseEnter={e => {
                                                        if (deleteHistoryTimeframe !== option.id) e.currentTarget.style.background = option.isDestructive ? '#fef2f2' : '#f8fafc';
                                                    }}
                                                    onMouseLeave={e => {
                                                        if (deleteHistoryTimeframe !== option.id) e.currentTarget.style.background = 'transparent';
                                                    }}
                                                >
                                                    {option.label}
                                                    {deleteHistoryTimeframe === option.id && <Check size={16} color={option.isDestructive ? '#ef4444' : '#db2777'} />}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => setIsDeleteHistoryModalOpen(false)} style={{ flex: 1, padding: '0.9rem', background: '#f1f5f9', border: 'none', borderRadius: '14px', fontSize: '0.95rem', fontWeight: 700, color: '#475569', cursor: 'pointer', transition: 'background 0.2s' }}>
                                Cancel
                            </button>
                            <button onClick={confirmDeleteHistory} style={{ flex: 1, padding: '0.9rem', background: '#ef4444', border: 'none', borderRadius: '14px', fontSize: '0.95rem', fontWeight: 700, color: '#fff', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)' }}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                        <button onClick={() => setActiveTab('blog')} style={{ background: 'transparent', border: 'none', color: activeTab === 'blog' ? '#fff' : 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', padding: '0.5rem' }}>
                            <BookOpen size={22} strokeWidth={activeTab === 'blog' ? 2.5 : 2} />
                        </button>
                    </div>

                    <button onClick={refreshData} disabled={loadingUsers || loadingItems} style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#1d4ed8', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(29, 78, 216, 0.5)' }}>
                        <RefreshCw size={24} strokeWidth={2.5} style={{ animation: (loadingUsers || loadingItems) ? 'spin 1s linear infinite' : 'none' }} />
                    </button>
                </div>
            </div>
        </div>
    );
}

