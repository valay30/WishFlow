import { Link, useLocation } from 'react-router-dom';
import { Home, List, Plus, Package, Crown, ShieldCheck, LogOut, ShoppingBag } from 'lucide-react';

const ORANGE = '#10367D';

const NAV_LINKS = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/categories', icon: List, label: 'Categories' },
    { to: '/archive', icon: Package, label: 'Purchased' },
];

export default function Sidebar({ user, onLogout }) {
    const location = useLocation();

    const isActive = (path) => {
        if (path === '/?add=true') return location.pathname === '/' && new URLSearchParams(location.search).get('add') === 'true';
        if (path === '/') return location.pathname === '/' && !new URLSearchParams(location.search).get('add');
        return location.pathname.startsWith(path);
    };

    const initials = user?.name
        ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <aside className="sidebar">
            {/* Brand */}
            <div className="sidebar-brand">
                <div style={{ width: '2.4rem', height: '2.4rem', borderRadius: '12px', background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px rgba(16,54,125,0.4)`, flexShrink: 0 }}>
                    <ShoppingBag size={18} color="#fff" />
                </div>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#111', letterSpacing: '-0.02em' }}>WishFlow</h1>
            </div>

            <nav className="sidebar-nav">
                <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.5rem 1rem 0.35rem' }}>Menu</p>
                {NAV_LINKS.map(({ to, icon: Icon, label }) => (
                    <Link key={to} to={to} className={`sidebar-nav-link${isActive(to) ? ' active' : ''}`}>
                        <Icon size={20} /> {label}
                    </Link>
                ))}
                <Link to="/?add=true" className={`sidebar-nav-link${isActive('/?add=true') ? ' active' : ''}`}>
                    <Plus size={20} /> Add Product
                </Link>
                {user?.isAdmin && (
                    <Link to="/admin" className="sidebar-nav-link" style={{ color: '#f59e0b', marginTop: '0.5rem' }}>
                        <ShieldCheck size={20} /> Admin Panel
                    </Link>
                )}
            </nav>

            {/* User + Logout */}
            <div className="sidebar-footer">
                <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem', padding: '0.75rem', background: '#F5F5F5', borderRadius: '14px', border: '1px solid #D1D5DB', textDecoration: 'none', cursor: 'pointer' }}>
                    <div style={{ width: '2.4rem', height: '2.4rem', borderRadius: '50%', background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.72rem', flexShrink: 0 }}>
                        {initials}
                    </div>
                    <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</p>
                            {user?.isPremium
                                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', fontSize: '0.58rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}><Crown size={8} />Pro</span>
                                : <span style={{ display: 'inline-flex', alignItems: 'center', background: '#E5E7EB', color: '#6B7280', fontSize: '0.58rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>Free</span>
                            }
                        </div>
                        <p style={{ fontSize: '0.74rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || ''}</p>
                    </div>
                </Link>
                <button
                    onClick={onLogout}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1rem', borderRadius: '12px', color: '#ef4444', fontWeight: 600, fontSize: '0.9rem', border: 'none', cursor: 'pointer', background: 'transparent', fontFamily: 'inherit', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                    <LogOut size={18} /> Sign out
                </button>
            </div>
        </aside>
    );
}
