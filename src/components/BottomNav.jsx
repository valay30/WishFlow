import { Link, useLocation } from 'react-router-dom';
import { Home, List, Plus, Package } from 'lucide-react';

const ORANGE = 'var(--primary)';

export default function BottomNav({ user }) {
    const location = useLocation();

    const isActive = (path) => {
        if (path === '/home') return location.pathname === '/home' && !new URLSearchParams(location.search).get('add');
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="bottom-nav-container">
            <Link to="/home" className={`bottom-nav-item${isActive('/home') ? ' active' : ''}`}>
                <Home size={22} />
                <span>Home</span>
            </Link>

            <Link to="/archive" className={`bottom-nav-item${isActive('/archive') ? ' active' : ''}`}>
                <Package size={22} />
                <span>Purchased</span>
            </Link>

            {/* Add Button */}
            <Link to="/home?add=true" className={`bottom-nav-add${new URLSearchParams(location.search).get('add') === 'true' ? ' active' : ''}`} aria-label="Add product">
                <div className="bottom-nav-add-inner">
                    <div className="add-icon-wrapper">
                        <Plus size={24} />
                    </div>
                </div>
                <span>Add</span>
            </Link>

            <Link to="/profile" className={`bottom-nav-item${isActive('/profile') ? ' active' : ''}`}>
                <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: isActive('/profile') ? '#fff' : 'rgba(var(--primary-rgb), 0.1)',
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
