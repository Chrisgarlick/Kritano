import { type ReactNode } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { useSiteMode, useSiteModeLoading } from '../contexts/SiteModeContext';

/**
 * SiteModeGuard - Controls route access based on the current site mode.
 *
 * Waitlist mode:
 *   - Public marketing pages: allowed (Home, About, Services, Blog, Contact, Waitlist, Terms, Privacy, Docs)
 *   - Pricing: blocked (redirect to /)
 *   - Auth routes (login, register): blocked (redirect to /waitlist)
 *   - App routes (dashboard, audits, sites, etc.): blocked (redirect to /)
 *   - Admin routes: always allowed
 *
 * Early Access mode:
 *   - All public pages including Pricing: allowed
 *   - Auth routes: allowed (login, register with ?ea param, EA success)
 *   - Register without ?ea: redirect to /
 *   - App routes: handled by ProtectedRoute (EA users get in, others don't)
 *   - Admin routes: always allowed
 *
 * Live mode:
 *   - Everything allowed (no guard logic)
 */
export function SiteModeGuard({ children }: { children: ReactNode }) {
  const mode = useSiteMode();
  const isLoading = useSiteModeLoading();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const { isAdmin } = useAdmin();
  const location = useLocation();
  const path = location.pathname;

  // Admin routes always pass through regardless of mode
  if (path.startsWith('/admin')) return <>{children}</>;

  // Live mode: authenticated users pass through
  if (mode === 'live' && !isLoading && isAuthenticated) return <>{children}</>;

  // Admins always pass through regardless of mode
  if (isAuthenticated && isAdmin) return <>{children}</>;

  // Beta access users pass through regardless of mode (full app access without admin)
  if (isAuthenticated && user?.betaAccess) return <>{children}</>;

  // In waitlist mode, non-admin authenticated users are blocked from app routes (handled below)
  // In other modes, authenticated users pass through
  if (isAuthenticated && mode !== 'waitlist') return <>{children}</>;

  // Live mode: no restrictions for anyone
  if (mode === 'live' && !isLoading) return <>{children}</>;

  // Wait for both site mode AND auth to finish loading before making redirect decisions
  if (isLoading || isAuthLoading) {
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

  // Public routes that are always allowed in both waitlist and early access
  const publicRoutes = [
    '/',
    '/about',
    '/services',
    '/blog',
    '/contact',
    '/waitlist',
    '/faq',
    '/terms',
    '/privacy',
    '/email/unsubscribe',
  ];

  const isPublicRoute = publicRoutes.includes(path)
    || path.startsWith('/services/')
    || path.startsWith('/blog/')
    || path.startsWith('/docs')
    || path.startsWith('/public/reports/');

  // Early access success route always allowed
  const isEaSuccessRoute = path === '/register/early-access-success';
  if (isEaSuccessRoute) return <>{children}</>;

  // Site invitation routes always allowed
  if (path.startsWith('/site-invitations/')) return <>{children}</>;

  // OAuth callback always allowed
  if (path.startsWith('/auth/callback/')) return <>{children}</>;

  // ---- WAITLIST MODE ----
  if (mode === 'waitlist') {
    // Public routes: allowed
    if (isPublicRoute) return <>{children}</>;

    // Login always allowed (admins need to sign in to access /admin)
    if (path === '/login') return <>{children}</>;

    // Pricing: redirect to home
    if (path === '/pricing') return <Navigate to="/" replace />;

    // Password reset and email verification allowed (beta users and admins need these)
    if (path.startsWith('/forgot-password') || path.startsWith('/reset-password')
      || path.startsWith('/verify-email')) {
      return <>{children}</>;
    }

    // Registration: redirect to waitlist (no public registration during waitlist)
    if (path === '/register' || path === '/register/success') {
      return <Navigate to="/waitlist" replace />;
    }

    // App routes: redirect to home (not accessible in waitlist mode)
    if (path.startsWith('/app')) {
      return <Navigate to="/" replace />;
    }

    // Everything else: let through to React Router (will show 404 for unknown routes)
    return <>{children}</>;
  }

  // ---- EARLY ACCESS MODE ----
  if (mode === 'early_access') {
    // All public routes allowed, including pricing
    if (isPublicRoute || path === '/pricing') return <>{children}</>;

    // Login always allowed
    if (path === '/login') return <>{children}</>;

    // Register with ?ea param: allowed
    const searchParams = new URLSearchParams(location.search);
    if (path === '/register' && searchParams.get('ea')) return <>{children}</>;

    // Register success, verify email, password reset: allowed (user is in auth flow)
    if (path === '/register/success'
      || path.startsWith('/verify-email')
      || path.startsWith('/forgot-password')
      || path.startsWith('/reset-password')) {
      return <>{children}</>;
    }

    // Register without ?ea: redirect to EA signup
    if (path === '/register') return <Navigate to="/register?ea=email" replace />;

    // App routes (dashboard, audits, sites, etc.): let through
    // ProtectedRoute will handle auth - EA users get in, unauthenticated users get redirected to login
    return <>{children}</>;
  }

  // Fallback: let everything through
  return <>{children}</>;
}
