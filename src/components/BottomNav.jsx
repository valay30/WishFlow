import { Link, useLocation } from 'react-router-dom';
import { Home, List, Plus, Package } from 'lucide-react';

const ORANGE = '#10367D';

export default function BottomNav({ user }) {
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
