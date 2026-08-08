import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

  return (
    <>
      <Routes>
        {/* Public route — redirect to home if already logged in (unless in recovery mode) */}
        <Route
          path="/auth"
          element={(user && !recoveryMode) ? <Navigate to="/" replace /> : <AuthPage />}
        />

        {/* Protected routes — wrapped in Layout */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/add" element={<AddProduct />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/collections" element={<Collections />} />
                  <Route path="/product/:id" element={<ProductDetails />} />
                  <Route path="/archive" element={<Archive />} />
                  <Route path="/profile" element={<Profile />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* Admin panel — own full-page layout, protected inside component */}
        <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
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
