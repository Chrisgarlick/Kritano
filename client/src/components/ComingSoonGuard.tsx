import { useState, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { comingSoonApi } from '../services/api';
import ComingSoon from '../pages/ComingSoon';

const CACHE_KEY = 'coming_soon_status';
const CACHE_TTL = 60_000; // 60 seconds

interface CachedStatus {
  enabled: boolean;
  headline: string;
  description: string;
  timestamp: number;
}

function getCached(): CachedStatus | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedStatus = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function setCache(data: Omit<CachedStatus, 'timestamp'>) {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, timestamp: Date.now() }));
}

export function ComingSoonGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [status, setStatus] = useState<CachedStatus | null>(() => getCached());
  const [loading, setLoading] = useState(!getCached());

  useEffect(() => {
    const cached = getCached();
    if (cached) {
      setStatus(cached);
      setLoading(false);
      return;
    }

    comingSoonApi.getStatus()
      .then((res) => {
        const data = res.data;
        setStatus({ ...data, timestamp: Date.now() });
        setCache(data);
      })
      .catch(() => {
        // On error, assume not enabled
        setStatus({ enabled: false, headline: '', description: '', timestamp: Date.now() });
      })
      .finally(() => setLoading(false));
  }, []);

  // Admin routes always pass through
  const isAdminRoute = location.pathname.startsWith('/admin');
  if (isAdminRoute) return <>{children}</>;

  // Allow early access registration routes through
  const searchParams = new URLSearchParams(location.search);
  const eaValue = searchParams.get('ea');
  const hasEaParam = !!eaValue;
  const isRegisterRoute = location.pathname === '/register';
  const isEaSuccessRoute = location.pathname === '/register/early-access-success';
  const isAuthRoute = ['/login', '/register/success'].includes(location.pathname)
    || location.pathname.startsWith('/verify-email')
    || location.pathname.startsWith('/forgot-password')
    || location.pathname.startsWith('/reset-password');

  if (isEaSuccessRoute || isAuthRoute || (isRegisterRoute && hasEaParam)) return <>{children}</>;

  if (loading) {
    // Minimal loading state — just the logo centered
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white font-display">
            Kritano
          </span>
        </div>
      </div>
    );
  }

  if (status?.enabled) {
    return <ComingSoon headline={status.headline} description={status.description} />;
  }

  return <>{children}</>;
}
