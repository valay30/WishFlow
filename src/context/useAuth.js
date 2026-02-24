// Separate file for the useAuth hook to satisfy Vite Fast Refresh rules
// (component files may not mix component exports with non-component exports)
import { useContext } from 'react';
import { AuthContext } from './AuthContext';

export const useAuth = () => useContext(AuthContext);
