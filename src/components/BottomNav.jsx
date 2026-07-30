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
        <nav className="bottom-nav-container">
            <Link to="/" className={`bottom-nav-item${isActive('/') ? ' active' : ''}`}>
                <Home size={22} />
                <span>Home</span>
            </Link>

            <Link to="/archive" className={`bottom-nav-item${isActive('/archive') ? ' active' : ''}`}>
                <Package size={22} />
                <span>Archive</span>
            </Link>

            {/* Add Button */}
            <Link to="/?add=true" className="bottom-nav-add" aria-label="Add product">
                <Plus size={22} />
                <span>Add</span>
            </Link>

            <Link to="/profile" className={`bottom-nav-item${isActive('/profile') ? ' active' : ''}`}>
                <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: isActive('/profile') ? '#fff' : 'rgba(16, 54, 125, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: ORANGE,
                    fontWeight: 700, fontSize: '0.75rem',
                    lineHeight: 1
                }}>
                    {user?.name ? user.name[0].toUpperCase() : '?'}
                </div>
                <span>Profile</span>
            </Link>
        </nav>
    );
}
