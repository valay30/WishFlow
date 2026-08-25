import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, List, Plus, Package, Crown, ShieldCheck, LogOut, ShoppingBag, FolderHeart, Compass, Lock } from 'lucide-react';

const ORANGE = 'var(--primary)';

const NAV_LINKS = [
    { to: '/home', icon: Home, label: 'Home' },
    { to: '/categories', icon: List, label: 'Categories' },
    { to: '/collections', icon: FolderHeart, label: 'Collections' },
    { to: '/discover', icon: Compass, label: 'Discover' },
    { to: '/archive', icon: Package, label: 'Purchased' },
];

// Blurred lock overlay used over the nav + footer for guests
function GuestLockOverlay({ onLogin }) {
    return (
        <div style={{
            position: 'absolute', inset: 0,
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            background: 'rgba(var(--bg-rgb, 255,255,255),0.55)',
            borderRadius: '16px',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '0.75rem', zIndex: 5,
            padding: '1rem',
        }}>
            <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'rgba(var(--primary-rgb),0.12)',
                border: `2px dashed ${ORANGE}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Lock size={20} color={ORANGE} />
            </div>
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text)', margin: '0 0 0.3rem' }}>Login Required</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>Login to access your wishflow</p>
            </div>
            <button
                onClick={onLogin}
                style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '10px',
                    background: ORANGE,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: '0 4px 12px rgba(var(--primary-rgb),0.35)',
                    transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
                Login / Sign Up
            </button>
        </div>
    );
}

export default function Sidebar({ user, onLogout }) {
    const location = useLocation();
    const navigate = useNavigate();
    const isGuest = !user;

    const isActive = (path) => {
        if (path === '/home?add=true') return location.pathname === '/home' && new URLSearchParams(location.search).get('add') === 'true';
        if (path === '/home') return location.pathname === '/home' && !new URLSearchParams(location.search).get('add');
        return location.pathname.startsWith(path);
    };

    const initials = user?.name
        ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <aside className="sidebar">
            {/* Brand */}
            <div className="sidebar-brand">
                <div style={{ width: '2.4rem', height: '2.4rem', borderRadius: '12px', background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px rgba(var(--primary-rgb),0.4)`, flexShrink: 0 }}>
                    <ShoppingBag size={18} color="#fff" />
                </div>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>WishFlow</h1>
            </div>

            {/* Nav — blurred for guests with lock overlay */}
            <div style={{ position: 'relative', flex: 1 }}>
                <nav className="sidebar-nav" style={{ pointerEvents: isGuest ? 'none' : 'auto' }}>
                    <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.5rem 1rem 0.35rem' }}>Menu</p>
                    {NAV_LINKS.map(({ to, icon: Icon, label }) => (
                        <Link key={to} to={to} className={`sidebar-nav-link${isActive(to) ? ' active' : ''}`}>
                            <Icon size={20} /> {label}
                        </Link>
                    ))}
                    <Link to="/home?add=true" className={`sidebar-nav-link${isActive('/home?add=true') ? ' active' : ''}`}>
                        <Plus size={20} /> Add Product
                    </Link>
                    {user?.isAdmin && (
                        <Link to="/admin" className="sidebar-nav-link" style={{ color: '#f59e0b', marginTop: '0.5rem' }}>
                            <ShieldCheck size={20} /> Admin Panel
                        </Link>
                    )}
                </nav>

                {/* Lock overlay for guests */}
                {isGuest && <GuestLockOverlay onLogin={() => navigate('/auth')} />}
            </div>

            {/* User + Logout — hidden for guests */}
            {!isGuest && (
                <div className="sidebar-footer">
                    <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem', padding: '0.75rem', background: 'var(--surface-2)', borderRadius: '14px', border: '1px solid var(--border)', textDecoration: 'none', cursor: 'pointer' }}>
                        <div style={{ width: '2.4rem', height: '2.4rem', borderRadius: '50%', background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.72rem', flexShrink: 0 }}>
                            {initials}
                        </div>
                        <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</p>
                                {user?.isPremium
                                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', fontSize: '0.58rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}><Crown size={8} />Pro</span>
                                    : <span style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--border)', color: 'var(--text-dim)', fontSize: '0.58rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>Free</span>
                                }
                            </div>
                            <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || ''}</p>
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
            )}
        </aside>
    );
}
