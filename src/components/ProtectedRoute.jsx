import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function ProtectedRoute({ children }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/auth" replace />;
    // Support both: wrapping children directly OR acting as a layout route via <Outlet />
    return children ?? <Outlet />;
}
