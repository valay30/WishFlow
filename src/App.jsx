import { useEffect, useState, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { processSyncQueue } from './db/syncQueue';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { SettingsProvider } from './context/SettingsContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import Home from './pages/Home';
import AddProduct from './pages/AddProduct';
import Categories from './pages/Categories';
import ProductDetails from './pages/ProductDetails';
import Profile from './pages/Profile';
import Archive from './pages/Archive';
import AdminPanel from './pages/AdminPanel';
import Collections from './pages/Collections';
import OnboardingFlow from './components/OnboardingFlow';
import LandingPage from './pages/LandingPage';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Refund from './pages/Refund';
import OfflinePage from './pages/OfflinePage';
import SharedCollection from './pages/SharedCollection';
import ShareTargetPage from './pages/ShareTargetPage';
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}

function AppRoutes() {
  const { user, recoveryMode, isNewSignup, clearNewSignup } = useAuth();
  const navigate = useNavigate();
  const prevUserRef = useRef(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const verifyOnlineStatus = async () => {
    if (!navigator.onLine) {
      setIsOffline(true);
      return false;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      await fetch(`/api/ping?_=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      setIsOffline(false);
      return true;
    } catch {
      setIsOffline(true);
      return false;
    }
  };

  useEffect(() => {
    // Initial verification on mount
    verifyOnlineStatus();

    const handleOnline = () => {
      verifyOnlineStatus().then((online) => {
        if (online) processSyncQueue();
      });
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', verifyOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', verifyOnlineStatus);
    };
  }, []);

  // Fire upgrade intent redirect the moment user logs in
  useEffect(() => {
    const wasLoggedOut = prevUserRef.current === null;
    const isNowLoggedIn = !!user;
    prevUserRef.current = user;

    if (wasLoggedOut && isNowLoggedIn) {
      const hasUpgradeIntent = sessionStorage.getItem('upgradeIntent') === '1';
      if (hasUpgradeIntent) {
        sessionStorage.removeItem('upgradeIntent');
        navigate('/profile?upgrade=true', { replace: true });
      }
    }
  }, [user]);

  // Render offline overlay on top of everything
  if (isOffline) {
    return (
      <OfflinePage
        onRetry={async () => {
          const online = await verifyOnlineStatus();
          if (online) {
            window.location.reload();
          }
        }}
      />
    );
  }

  return (
    <>
      <Routes>
        {/* ── Public routes ── */}
        <Route path="/" element={user ? <Navigate to="/home" replace /> : <LandingPage />} />
        <Route path="/auth" element={
          (user && !recoveryMode)
            ? (() => {
                const hasUpgradeIntent = sessionStorage.getItem('upgradeIntent') === '1';
                if (hasUpgradeIntent) {
                  sessionStorage.removeItem('upgradeIntent');
                  return <Navigate to="/profile?upgrade=true" replace />;
                }
                return <Navigate to="/home" replace />;
              })()
            : <AuthPage />
        } />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/refund" element={<Refund />} />
        <Route path="/shared/collection/:id" element={<SharedCollection />} />
        <Route path="/share-target" element={<ShareTargetPage />} />

        {/* ── Protected app routes (layout route — no path, uses Outlet) ── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/add" element={<AddProduct />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          {/* Admin — own full-page layout */}
          <Route path="/admin" element={<AdminPanel />} />
        </Route>
      </Routes>

      {/* Onboarding overlay — shown only once after first signup */}
      {isNewSignup && <OnboardingFlow onComplete={clearNewSignup} />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ScrollToTop />
        <AppRoutes />
        <Analytics />
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
