import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { adminApi } from '../services/api';
import { useAuth } from './AuthContext';

interface AdminState {
  isAdmin: boolean;
  isLoading: boolean;
  adminEmail: string | null;
}

interface AdminContextType extends AdminState {
  checkAdminStatus: () => Promise<boolean>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<AdminState>({
    isAdmin: false,
    isLoading: true,
    adminEmail: null,
  });

  const checkAdminStatus = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) {
      setState({
        isAdmin: false,
        isLoading: false,
        adminEmail: null,
      });
      return false;
    }

    try {
      const response = await adminApi.check();
      setState({
        isAdmin: response.data.isAdmin,
        isLoading: false,
        adminEmail: response.data.admin?.email || null,
      });
      return response.data.isAdmin;
    } catch {
      // 403 means user is not admin - this is expected
      setState({
        isAdmin: false,
        isLoading: false,
        adminEmail: null,
      });
      return false;
    }
  }, [isAuthenticated]);

  // Check admin status when auth state changes
  useEffect(() => {
    if (!authLoading) {
      checkAdminStatus();
    }
  }, [authLoading, checkAdminStatus]);

  return (
    <AdminContext.Provider
      value={{
        ...state,
        checkAdminStatus,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextType {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
