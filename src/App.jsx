import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { processSyncQueue } from './db/syncQueue';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { SettingsProvider } from './context/SettingsContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import OfflinePage from './pages/OfflinePage';
import OnboardingFlow from './components/OnboardingFlow';

// ── Lazy-loaded page chunks ──────────────────────────────────────────────────
// Each page is split into its own chunk and only downloaded when first visited.
const AuthPage         = lazy(() => import('./pages/AuthPage'));
const Home             = lazy(() => import('./pages/Home'));
const AddProduct       = lazy(() => import('./pages/AddProduct'));
const Categories       = lazy(() => import('./pages/Categories'));
const ProductDetails   = lazy(() => import('./pages/ProductDetails'));
const Profile          = lazy(() => import('./pages/Profile'));
const Archive          = lazy(() => import('./pages/Archive'));
const AdminPanel       = lazy(() => import('./pages/AdminPanel'));
const Collections      = lazy(() => import('./pages/Collections'));
const LandingPage      = lazy(() => import('./pages/LandingPage'));
const Privacy          = lazy(() => import('./pages/Privacy'));
const Terms            = lazy(() => import('./pages/Terms'));
const Refund           = lazy(() => import('./pages/Refund'));
const SharedCollection = lazy(() => import('./pages/SharedCollection'));
const ShareTargetPage  = lazy(() => import('./pages/ShareTargetPage'));
const Discover         = lazy(() => import('./pages/Discover'));
const Blog             = lazy(() => import('./pages/Blog'));
const BlogPost         = lazy(() => import('./pages/BlogPost'));
// ────────────────────────────────────────────────────────────────────────────

/** Minimal full-screen spinner shown while a lazy page chunk is loading */
function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      background: 'var(--bg)',
    }}>
      <div style={{
        width: 36,
        height: 36,
        border: '3px solid var(--border)',
        borderTopColor: 'var(--primary)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  );
}

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
      <Suspense fallback={<PageLoader />}>
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
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />

          {/* ── Public app routes (with Layout) ── */}
          <Route element={<Layout />}>
            <Route path="/discover" element={<Discover />} />
          </Route>

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
      </Suspense>

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


