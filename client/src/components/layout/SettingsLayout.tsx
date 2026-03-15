/**
 * Settings Layout
 *
 * Full-width layout for settings pages with horizontal tabs on mobile.
 */

import { NavLink, Outlet } from 'react-router-dom';
import {
  User,
  Globe,
  Key,
  Palette,
  Bell,
  type LucideIcon,
} from 'lucide-react';
import { DashboardLayout } from './DashboardLayout';
import { Display, Body } from '../ui/Typography';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const settingsNav: NavItem[] = [
  {
    label: 'Profile',
    href: '/settings/profile',
    icon: User,
  },
  {
    label: 'My Sites',
    href: '/settings/sites',
    icon: Globe,
  },
  {
    label: 'Branding',
    href: '/settings/branding',
    icon: Palette,
  },
  {
    label: 'Notifications',
    href: '/settings/notifications',
    icon: Bell,
  },
  {
    label: 'API Keys',
    href: '/settings/api-keys',
    icon: Key,
  },
];

export function SettingsLayout() {
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Display size="sm" className="text-slate-900 dark:text-white">
            Settings
          </Display>
          <Body muted className="mt-1">
            Manage your account and preferences
          </Body>
        </div>

        {/* Horizontal Tabs */}
        <div className="mb-6 -mx-4 px-4 overflow-x-auto border-b border-slate-200 dark:border-slate-700">
          <nav className="flex gap-1 min-w-max">
            {settingsNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) => `
                    flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-[1px]
                    ${isActive
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                      : 'border-transparent text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:border-slate-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Content Area - Full Width */}
        <main>
          <Outlet />
        </main>
      </div>
    </DashboardLayout>
  );
}
