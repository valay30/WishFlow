import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, List, Package, Crown, LogOut, ShoppingBag } from 'lucide-react';

const ORANGE = '#10367D';

export default function MobileHeader({ user, onLogout }) {
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
                <Link to="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.2rem', height: '2.2rem', borderRadius: '10px', background: isActive('/') ? 'rgba(16,54,125,0.1)' : 'transparent', color: isActive('/') ? ORANGE : '#666', textDecoration: 'none', transition: 'all 0.2s' }}>
                    <Home size={20} />
                </Link>
                <Link to="/categories" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.2rem', height: '2.2rem', borderRadius: '10px', background: isActive('/categories') ? 'rgba(16,54,125,0.1)' : 'transparent', color: isActive('/categories') ? ORANGE : '#666', textDecoration: 'none', transition: 'all 0.2s' }}>
                    <List size={20} />
                </Link>
                <Link to="/archive" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.2rem', height: '2.2rem', borderRadius: '10px', background: isActive('/archive') ? 'rgba(16,54,125,0.1)' : 'transparent', color: isActive('/archive') ? ORANGE : '#666', textDecoration: 'none', transition: 'all 0.2s' }}>
                    <Package size={20} />
                </Link>
                <Link to="/profile" style={{ display: 'inline-flex', textDecoration: 'none', position: 'relative' }}>
                    <div style={{ width: '2.2rem', height: '2.2rem', borderRadius: '50%', background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.7rem', flexShrink: 0 }}>{initials}</div>
                    {user?.isPremium && (
                        <span style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff' }}>
                            <Crown size={7} color="#fff" />
                        </span>
                    )}
                </Link>
                <button onClick={onLogout} title="Sign out" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.2rem', height: '2.2rem', borderRadius: '10px', background: 'transparent', color: '#666', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666'; }}>
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
}
