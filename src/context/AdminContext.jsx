import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useIsland } from './IslandContext';
import { API_URL as API, ADMIN_SECRET } from '../config';

export const AdminContext = createContext(null);

const headers = {
    'Content-Type': 'application/json',
    'x-admin-secret': ADMIN_SECRET,
};

export function AdminProvider({ children }) {
    const { user } = useAuth();
    const { showIsland } = useIsland();
    const [users, setUsers] = useState([]);
    const [items, setItems] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingItems, setLoadingItems] = useState(true);
    const [hasFetched, setHasFetched] = useState(false);

    const showToast = useCallback((msg, type = 'success') => {
        showIsland({ title: type === 'success' ? 'Success' : 'Error', subtitle: msg, type });
    }, [showIsland]);

    const fetchUsers = useCallback(async () => {
        setLoadingUsers(true);
        try {
            const res = await fetch(`${API}/api/admin/users`, { headers });
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('fetchUsers error:', err);
            showToast('Failed to load users: ' + err.message, 'error');
        } finally {
            setLoadingUsers(false);
        }
    }, [showToast]);

    const fetchItems = useCallback(async () => {
        setLoadingItems(true);
        try {
            const res = await fetch(`${API}/api/admin/items`, { headers });
            if (!res.ok) throw new Error('Failed to fetch items');
            const data = await res.json();
            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('fetchItems error:', err);
            showToast('Failed to load items: ' + err.message, 'error');
        } finally {
            setLoadingItems(false);
        }
    }, [showToast]);

    const refreshData = useCallback(() => {
        fetchUsers();
        fetchItems();
    }, [fetchUsers, fetchItems]);

    useEffect(() => {
        if (user && user.isAdmin && !hasFetched) {
            setHasFetched(true);
            refreshData();
        } else if (!user) {
            setHasFetched(false);
            setUsers([]);
            setItems([]);
        }
    }, [user, hasFetched, refreshData]);

    return (
        <AdminContext.Provider value={{
            users, setUsers,
            items, setItems,
            loadingUsers, loadingItems,
            refreshData
        }}>
            {children}
        </AdminContext.Provider>
    );
}

export const useAdminContext = () => useContext(AdminContext);
