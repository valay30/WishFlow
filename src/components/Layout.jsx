import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import BottomNav from './BottomNav';

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
