/**
 * Admin Panel Layout
 *
 * Refined command-center aesthetic with depth, glass effects, and purposeful hierarchy.
 */

import { type ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, Bug, Lightbulb, Activity, CalendarClock,
  UserSearch, Zap, Mail, Send, Crosshair, Gift, ClipboardList,
  Share2, Tags,
  FileText, Image, BookOpen, Megaphone, Trophy,
  Funnel, TrendingUp, DollarSign, BarChart3,
  Settings, Clock, Search, Rocket,
  ChevronDown, ArrowLeft,
  Menu, X, Shield,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    defaultOpen: true,
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/organizations', label: 'Organizations', icon: Building2 },
      { href: '/admin/bug-reports', label: 'Bug Reports', icon: Bug },
      { href: '/admin/feature-requests', label: 'Feature Requests', icon: Lightbulb },
      { href: '/admin/schedules', label: 'Schedules', icon: CalendarClock },
      { href: '/admin/activity', label: 'Activity', icon: Activity },
    ],
  },
  {
    label: 'Growth',
    defaultOpen: true,
    items: [
      { href: '/admin/crm/leads', label: 'CRM Leads', icon: UserSearch },
      { href: '/admin/crm/triggers', label: 'Triggers', icon: Zap },
      { href: '/admin/email/templates', label: 'Email Templates', icon: Mail },
      { href: '/admin/email/campaigns', label: 'Campaigns', icon: Send },
      { href: '/admin/cold-prospects', label: 'Cold Prospects', icon: Crosshair },
      { href: '/admin/outreach-log', label: 'Outreach Log', icon: ClipboardList },
      { href: '/admin/referrals', label: 'Referrals', icon: Gift },
    ],
  },
  {
    label: 'Marketing',
    defaultOpen: true,
    items: [
      { href: '/admin/marketing/content', label: 'Social Content', icon: Share2 },
      { href: '/admin/marketing/campaigns', label: 'Campaigns', icon: Tags },
    ],
  },
  {
    label: 'Content',
    defaultOpen: true,
    items: [
      { href: '/admin/cms/posts', label: 'Blog Posts', icon: FileText },
      { href: '/admin/cms/media', label: 'Media', icon: Image },
      { href: '/admin/cms/advice', label: 'Advice Editor', icon: BookOpen },
      { href: '/admin/cms/announcements', label: 'Announcements', icon: Megaphone },
      { href: '/admin/cms/stories', label: 'Stories', icon: Trophy },
    ],
  },
  {
    label: 'Analytics',
    defaultOpen: true,
    items: [
      { href: '/admin/analytics/funnel', label: 'Funnel', icon: Funnel },
      { href: '/admin/analytics/trends', label: 'Global Trends', icon: TrendingUp },
      { href: '/admin/analytics/revenue', label: 'Revenue', icon: DollarSign },
      { href: '/admin/email/analytics', label: 'Email Stats', icon: BarChart3 },
    ],
  },
  {
    label: 'System',
    defaultOpen: true,
    items: [
      { href: '/admin/settings', label: 'Settings', icon: Settings, exact: true },
      { href: '/admin/seo', label: 'SEO Manager', icon: Search },
      { href: '/admin/early-access', label: 'Early Access', icon: Rocket },
      { href: '/admin/coming-soon', label: 'Coming Soon', icon: Clock },
    ],
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  const groupHasActive = (group: NavGroup) =>
    group.items.some((item) => isActive(item.href, item.exact));

  const sidebarContent = (
    <>
      {/* Logo / Header */}
      <div className="px-5 py-5">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white tracking-tight leading-none">Kritano</p>
            <p className="text-[10px] text-indigo-300/70 font-medium mt-0.5">Admin Console</p>
          </div>
        </div>
      </div>

      {/* Divider with gradient */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 admin-nav-scroll">
        {navGroups.map((group) => (
          <NavGroupSection
            key={group.label}
            group={group}
            isActive={isActive}
            defaultOpen={group.defaultOpen || groupHasActive(group)}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />
      <div className="px-4 py-4">
        <Link
          to="/dashboard"
          className="flex items-center space-x-2.5 px-3 py-2 text-[13px] text-slate-500 hover:text-slate-300 rounded-lg hover:bg-white/[0.03] transition-all duration-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to App</span>
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0c0e14] text-slate-200 flex">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-60 w-[600px] h-[400px] bg-indigo-500/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-violet-500/[0.02] rounded-full blur-3xl" />
      </div>

      {/* Mobile Hamburger */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2.5 bg-[#141620]/90 backdrop-blur-xl rounded-xl shadow-lg border border-white/[0.06]"
        aria-label="Open admin menu"
      >
        <Menu className="w-4 h-4 text-slate-500" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
          role="presentation"
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        role="dialog"
        aria-modal={isMobileOpen ? 'true' : undefined}
        aria-label="Admin navigation"
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[#111318]/95 backdrop-blur-2xl border-r border-white/[0.06] flex flex-col transform transition-transform duration-300 ease-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-5 right-4 p-1 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="Close admin menu"
        >
          <X className="w-4 h-4" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[260px] flex-shrink-0 bg-[#111318]/80 backdrop-blur-2xl border-r border-white/[0.06] flex-col relative z-10">
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 pt-16 pb-10 md:py-10">
          {children}
        </div>
      </main>

      {/* Admin-specific scrollbar + ambient styles */}
      <style>{`
        .admin-nav-scroll::-webkit-scrollbar { width: 3px; }
        .admin-nav-scroll::-webkit-scrollbar-track { background: transparent; }
        .admin-nav-scroll::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 10px; }
        .admin-nav-scroll::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.4); }
      `}</style>
    </div>
  );
}

function NavGroupSection({
  group,
  isActive,
  defaultOpen,
}: {
  group: NavGroup;
  isActive: (href: string, exact?: boolean) => boolean;
  defaultOpen: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500/80 hover:text-slate-500 transition-colors duration-200"
      >
        {group.label}
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
      </button>
      {isOpen && (
        <div className="mt-1 space-y-px">
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`group relative flex items-center space-x-2.5 px-3 py-[7px] rounded-lg text-[13px] transition-all duration-200 ${
                  active
                    ? 'bg-indigo-500/[0.12] text-indigo-200 font-medium'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                {/* Active indicator bar */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-indigo-400 rounded-r-full" />
                )}
                <Icon className={`w-[15px] h-[15px] flex-shrink-0 transition-colors duration-200 ${
                  active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-500'
                }`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
