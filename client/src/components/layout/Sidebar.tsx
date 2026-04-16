import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import {
  LayoutDashboard,
  Globe,
  BarChart3,
  GitCompareArrows,
  CalendarClock,
  ClipboardList,
  Key,
  Gift,
  Shield,
  SearchCheck,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useTheme } from '../../contexts/ThemeContext';
import { TIER_INFO } from '../../types/site.types';

const tierBadgeColors: Record<string, string> = {
  gray: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400',
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
  yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
};

const SIDEBAR_WIDTH = 256;
const SIDEBAR_COLLAPSED_WIDTH = 64;
const STORAGE_KEY = 'sidebar-collapsed';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const mainNavItems: NavItem[] = [
  { href: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/sites', label: 'Sites', icon: Globe },
  { href: '/app/audits', label: 'Audits', icon: ClipboardList },
  { href: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/app/schedules', label: 'Schedules', icon: CalendarClock },
  { href: '/app/compare', label: 'Compare', icon: GitCompareArrows },
  { href: '/app/search-console', label: 'Search Console', icon: SearchCheck },
  { href: '/app/referrals', label: 'Referrals', icon: Gift },
  { href: '/app/settings/api-keys', label: 'API Keys', icon: Key },
  { href: '/admin', label: 'Admin', icon: Shield, adminOnly: true },
];

const bottomNavItems: NavItem[] = [
  { href: '/app/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { logout, subscription } = useAuth();
  const isTrialing = subscription?.status === 'trialing';
  const daysRemaining = subscription?.daysRemaining ?? null;
  const { isAdmin } = useAdmin();
  const { resolvedTheme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const mobileSidebarRef = useRef<HTMLElement>(null);
  const closeMobileSidebar = useCallback(() => setIsMobileOpen(false), []);
  useFocusTrap(isMobileOpen, mobileSidebarRef, closeMobileSidebar);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === '/app/sites') {
      return location.pathname.startsWith('/app/sites');
    }
    if (path === '/app/audits') {
      return location.pathname.startsWith('/app/audits');
    }
    if (path === '/app/analytics') {
      return location.pathname.startsWith('/app/analytics');
    }
    if (path === '/app/schedules') {
      return location.pathname.startsWith('/app/schedules');
    }
    if (path === '/app/compare') {
      return location.pathname.startsWith('/app/compare');
    }
    if (path === '/app/search-console') {
      return location.pathname.startsWith('/app/search-console');
    }
    if (path === '/app/referrals') {
      return location.pathname.startsWith('/app/referrals');
    }
    if (path === '/admin') {
      return location.pathname.startsWith('/admin');
    }
    if (path === '/app/settings') {
      return location.pathname.startsWith('/app/settings') && !location.pathname.includes('/api-keys');
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const canShowItem = (item: NavItem) => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tierInfo = subscription?.tier
    ? TIER_INFO[subscription.tier]
    : TIER_INFO.free;

  const sidebarWidth = isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  const renderNavItem = (item: NavItem) => {
    if (!canShowItem(item)) return null;

    const active = isActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        to={item.href}
        className={`
          group relative flex items-center gap-3 px-3 py-2.5 rounded-lg
          transition-all duration-200
          ${active
            ? 'bg-gradient-to-r from-indigo-50 to-transparent dark:from-indigo-900/50 dark:to-transparent text-indigo-600 dark:text-indigo-400'
            : 'text-slate-600 dark:text-slate-500 hover:bg-gradient-to-r hover:from-slate-100 hover:to-transparent dark:hover:from-slate-800 dark:hover:to-transparent hover:text-slate-900 dark:hover:text-slate-200 hover:translate-x-0.5'
          }
          ${isCollapsed ? 'justify-center' : ''}
        `}
        title={isCollapsed ? item.label : undefined}
      >
        {/* Active indicator bar */}
        {active && !isCollapsed && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-indigo-500 rounded-r-full" />
        )}
        <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${!active ? 'group-hover:scale-110' : ''}`} />
        {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-slate-200/50 dark:border-slate-700/50 ${isCollapsed ? 'justify-center' : ''}`}>
        <Link to="/app/dashboard" className="flex items-center gap-2.5 group">
          <img src="/brand/favicon-32.svg" alt="" width="36" height="36" className="rounded-lg group-hover:scale-105 transition-transform" />
          {!isCollapsed && (
            <span className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
              Kritano
            </span>
          )}
        </Link>
      </div>

      {/* Subscription Tier Badge */}
      {!isCollapsed && (
        <div className="px-3 py-3 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800/30 border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/50 dark:to-indigo-900/30 flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">My Account</span>
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wide ${tierBadgeColors[tierInfo.color] || tierBadgeColors.gray}`}>
              {tierInfo.name}
            </span>
          </div>
          {isTrialing && daysRemaining !== null && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-1.5 px-3">
              Trial: {daysRemaining}d left
            </p>
          )}
        </div>
      )}

      {/* Collapsed tier indicator */}
      {isCollapsed && (
        <div className="px-3 py-3 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-center">
          <div
            className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/50 dark:to-indigo-900/30 flex items-center justify-center"
            title={`${tierInfo.name} Plan`}
          >
            <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Dashboard navigation">
        {mainNavItems.map(renderNavItem)}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 py-4 border-t border-slate-200/50 dark:border-slate-700/50 space-y-1">
        {bottomNavItems.map(renderNavItem)}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`
            group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
            transition-all duration-200
            text-slate-600 dark:text-slate-500
            hover:bg-red-50 dark:hover:bg-red-900/20
            hover:text-red-600 dark:hover:text-red-400
            ${isCollapsed ? 'justify-center' : ''}
          `}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>

      {/* Theme Toggle & Collapse */}
      <div className="px-3 py-3 space-y-1">
        {/* Subtle gradient divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent mb-2" />

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-lg
            text-slate-500 dark:text-slate-500
            hover:bg-slate-100 dark:hover:bg-slate-800
            hover:text-slate-700 dark:hover:text-slate-200
            transition-all duration-200
            ${isCollapsed ? 'justify-center' : ''}
          `}
          aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <div className="relative w-5 h-5">
            {resolvedTheme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </div>
          {!isCollapsed && (
            <span className="text-sm">{resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          )}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-lg
            text-slate-500 dark:text-slate-500
            hover:bg-slate-100 dark:hover:bg-slate-800
            hover:text-slate-700 dark:hover:text-slate-200
            transition-all duration-200
            ${isCollapsed ? 'justify-center' : ''}
          `}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <div className={`transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}>
            <ChevronLeft className="w-5 h-5" />
          </div>
          {!isCollapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
          role="presentation"
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        ref={mobileSidebarRef}
        role="dialog"
        aria-modal={isMobileOpen ? "true" : undefined}
        aria-label="Dashboard navigation"
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-200 ease-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 p-1 text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col fixed inset-y-0 left-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-200 ease-out z-30"
        style={{ width: sidebarWidth }}
      >
        {sidebarContent}
      </aside>

      {/* Spacer for main content */}
      <div
        className="hidden md:block flex-shrink-0 transition-all duration-200 ease-out"
        style={{ width: sidebarWidth }}
      />
    </>
  );
}
