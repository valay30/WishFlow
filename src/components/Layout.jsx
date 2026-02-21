import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, List, Plus, ShoppingBag, LogOut, User, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ORANGE = '#10367D';

const NAV_LINKS = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/categories', icon: List, label: 'Categories' },
    { to: '/archive', icon: Package, label: 'Purchased' },
];

/* ══════════════════════════════════════
   Desktop Sidebar
══════════════════════════════════════ */
function Sidebar({ user, onLogout }) {
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
            </nav>

            {/* User + Logout */}
            <div className="sidebar-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem', padding: '0.75rem', background: '#F5F5F5', borderRadius: '14px', border: '1px solid #D1D5DB' }}>
                    <div style={{ width: '2.4rem', height: '2.4rem', borderRadius: '50%', background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.72rem', flexShrink: 0 }}>
                        {initials}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</p>
                        <p style={{ fontSize: '0.74rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || ''}</p>
                    </div>
                </div>
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

/* ══════════════════════════════════════
   Tablet Top Header (768–1023px)
══════════════════════════════════════ */
function MobileHeader({ user, onLogout }) {
    const location = useLocation();
    const navigate = useNavigate();
    const isActive = (path) => location.pathname === path;
    const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

    return (
        <header className="mobile-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
                <div style={{ width: '2rem', height: '2rem', borderRadius: '9px', background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ShoppingBag size={15} color="#fff" />
                </div>
                <h1 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#111' }}>WishFlow</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {[{ to: '/', Icon: Home }, { to: '/categories', Icon: List }, { to: '/archive', Icon: Package }].map(({ to, Icon }) => (
                    <Link key={to} to={to} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.2rem', height: '2.2rem', borderRadius: '10px', background: isActive(to) ? 'rgba(16,54,125,0.1)' : 'transparent', color: isActive(to) ? ORANGE : '#666', textDecoration: 'none', transition: 'all 0.2s' }}>
                        <Icon size={20} />
                    </Link>
                ))}
                <div style={{ width: '2.2rem', height: '2.2rem', borderRadius: '50%', background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.7rem', flexShrink: 0 }}>{initials}</div>
                <button onClick={onLogout} title="Sign out" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.2rem', height: '2.2rem', borderRadius: '10px', background: 'transparent', color: '#666', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666'; }}>
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
}

/* ══════════════════════════════════════
   Mobile Bottom Navigation
══════════════════════════════════════ */
function BottomNav({ user }) {
    const location = useLocation();

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/' && !new URLSearchParams(location.search).get('add');
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="bottom-nav" style={{ justifyContent: 'space-evenly', padding: '0 0.5rem' }}>
            <Link to="/" className={`bottom-nav-item${isActive('/') ? ' active' : ''}`}>
                <Home size={22} />
                <span>Home</span>
            </Link>

            <Link to="/categories" className={`bottom-nav-item${isActive('/categories') ? ' active' : ''}`}>
                <List size={22} />
                <span>Lists</span>
            </Link>

            <Link to="/archive" className={`bottom-nav-item${isActive('/archive') ? ' active' : ''}`}>
                <Package size={22} />
                <span>Archive</span>
            </Link>

            {/* Add Button */}
            <Link to="/?add=true" className="bottom-nav-add" aria-label="Add product" style={{ margin: '0 -0.5rem' }}>
                <Plus size={26} />
            </Link>

            <Link to="/profile" className={`bottom-nav-item${isActive('/profile') ? ' active' : ''}`}>
                <div style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: ORANGE,
                    fontWeight: 900, fontSize: '0.88rem', transition: 'all 0.2s',
                    lineHeight: 1,
                    border: isActive('/profile') ? '2px solid rgba(255,255,255,0.3)' : 'none'
                }}>
                    {user?.name ? user.name[0].toUpperCase() : '?'}
                </div>
                <span>Profile</span>
            </Link>
        </nav>
    );
}

/* ══════════════════════════════════════
   Main Layout
══════════════════════════════════════ */
export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const handleLogout = () => { logout(); navigate('/auth'); };

    return (
        <div className="app-shell">
            <Sidebar user={user} onLogout={handleLogout} />

            <div className="main-content">
                {/* Tablet header */}
                <MobileHeader user={user} onLogout={handleLogout} />

                <main className="animate-fade-in" style={{ flex: 1 }}>
                    {children}
                </main>
            </div>

            {/* Tablet FAB */}
            <Link to="/?add=true" className="fab" aria-label="Add Item">
                <Plus size={26} />
            </Link>

            {/* Mobile Bottom Nav */}
            <BottomNav user={user} />
        </div>
    );
}
