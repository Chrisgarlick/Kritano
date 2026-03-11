import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { authApi, userApi } from '../services/api';
import type { AuthState, LoginCredentials, RegisterData } from '../types/auth.types';
import type { Subscription, TierLimits } from '../types/site.types';

interface ExtendedAuthState extends AuthState {
  subscription: Subscription | null;
  tierLimits: TierLimits | null;
}

interface AuthContextType extends ExtendedAuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<unknown>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<ExtendedAuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    subscription: null,
    tierLimits: null,
  });

  // Load subscription data
  const loadSubscription = useCallback(async () => {
    try {
      const response = await userApi.getSubscription();
      setState(prev => ({
        ...prev,
        subscription: response.data.subscription,
        tierLimits: response.data.limits,
      }));
    } catch {
      // Silently fail - subscription info is optional
      setState(prev => ({
        ...prev,
        subscription: null,
        tierLimits: null,
      }));
    }
  }, []);

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authApi.me();
        setState(prev => ({
          ...prev,
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        }));
        // Load subscription after auth
        loadSubscription();
      } catch {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          subscription: null,
          tierLimits: null,
        });
      }
    };

    checkAuth();
  }, [loadSubscription]);

  // Set up token refresh interval (every 14 minutes)
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const refreshInterval = setInterval(
      async () => {
        try {
          await authApi.refresh();
        } catch {
          // Token refresh failed - user will be logged out on next request
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            subscription: null,
            tierLimits: null,
          });
        }
      },
      14 * 60 * 1000 // 14 minutes (1 minute before 15 min expiry)
    );

    return () => clearInterval(refreshInterval);
  }, [state.isAuthenticated]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials.email, credentials.password);

    setState(prev => ({
      ...prev,
      user: response.data.user,
      isAuthenticated: true,
      isLoading: false,
    }));

    // Load subscription in background (don't block login)
    loadSubscription();
  }, [loadSubscription]);

  const register = useCallback(async (data: RegisterData) => {
    const res = await authApi.register(data);
    // Don't auto-login after registration - user needs to verify email
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        subscription: null,
        tierLimits: null,
      });
    }
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await authApi.logoutAll();
    } finally {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        subscription: null,
        tierLimits: null,
      });
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.me();
      setState(prev => ({
        ...prev,
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      }));
    } catch {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        subscription: null,
        tierLimits: null,
      });
    }
  }, []);

  const refreshSubscription = useCallback(async () => {
    await loadSubscription();
  }, [loadSubscription]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        logoutAll,
        refreshUser,
        refreshSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
