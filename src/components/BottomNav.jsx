import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, List, Plus, Package, Compass, LogIn, Lock, X } from 'lucide-react';

const ORANGE = 'var(--primary)';

export default function BottomNav({ user }) {
    const location = useLocation();
    const navigate = useNavigate();
    const isGuest = !user;
    const [showLoginModal, setShowLoginModal] = useState(false);

    const isActive = (path) => {
        if (path === '/home') return location.pathname === '/home' && !new URLSearchParams(location.search).get('add');
        return location.pathname.startsWith(path);
    };

    const handleRestrictedClick = (e) => {
        if (isGuest) {
            e.preventDefault();
            setShowLoginModal(true);
        }
    };

    return (
        <>
            <nav className="bottom-nav-container">
                <Link
                    to="/home"
                    onClick={handleRestrictedClick}
                    className={`bottom-nav-item${isActive('/home') ? ' active' : ''}`}
                    style={isGuest ? { filter: 'blur(1.5px)', opacity: 0.6 } : {}}
                >
                    <Home size={22} />
                    <span>Home</span>
                </Link>

                <Link
                    to="/archive"
                    onClick={handleRestrictedClick}
                    className={`bottom-nav-item${isActive('/archive') ? ' active' : ''}`}
                    style={isGuest ? { filter: 'blur(1.5px)', opacity: 0.6 } : {}}
                >
                    <Package size={22} />
                    <span>Purchased</span>
                </Link>

                {/* Add Button */}
                <Link
                    to="/home?add=true"
                    onClick={handleRestrictedClick}
                    className={`bottom-nav-add${new URLSearchParams(location.search).get('add') === 'true' ? ' active' : ''}`}
                    aria-label="Add product"
                    style={isGuest ? { filter: 'blur(1.5px)', opacity: 0.6 } : {}}
                >
                    <div className="bottom-nav-add-inner">
                        <div className="add-icon-wrapper">
                            <Plus size={24} />
                        </div>
                    </div>
                    <span>Add</span>
                </Link>

                <Link to="/discover" className={`bottom-nav-item${isActive('/discover') ? ' active' : ''}`}>
                    <Compass size={22} />
                    <span>Discover</span>
                </Link>

                {isGuest ? (
                    <button
                        onClick={() => navigate('/auth')}
                        className="bottom-nav-item"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: ORANGE }}
                        title="Login to use WishFlow"
                    >
                        <div style={{
                            width: '24px', height: '24px', borderRadius: '50%',
                            background: `rgba(var(--primary-rgb), 0.12)`,
                            border: `2px dashed ${ORANGE}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <LogIn size={13} color={ORANGE} />
                        </div>
                        <span style={{ color: ORANGE, fontSize: '0.68rem', fontWeight: 700 }}>Login</span>
                    </button>
                ) : (
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
                )}
            </nav>

            {showLoginModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                    padding: '2rem', animation: 'disc-fadeIn 0.2s ease',
                }}>
                    <div style={{
                        background: 'var(--surface, #fff)', padding: '1.75rem', borderRadius: '24px',
                        width: '100%', maxWidth: '300px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                        boxShadow: '0 16px 40px rgba(0,0,0,0.15)',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setShowLoginModal(false)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            <X size={20} />
                        </button>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '50%',
                            background: 'rgba(var(--primary-rgb),0.12)', border: `2px dashed ${ORANGE}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Lock size={24} color={ORANGE} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 0.4rem', color: 'var(--text)', fontSize: '1.2rem', fontWeight: 800 }}>Login Required</h3>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.4 }}>
                                Login to access your wishlist & save items
                            </p>
                        </div>
                        <button
                            onClick={() => { setShowLoginModal(false); navigate('/auth'); }}
                            style={{
                                width: '100%', padding: '0.85rem', borderRadius: '12px',
                                background: ORANGE, color: '#fff', fontWeight: 700,
                                border: 'none', fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit'
                            }}
                        >
                            Login / Sign Up
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
