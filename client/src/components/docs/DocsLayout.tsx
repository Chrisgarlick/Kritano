import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Book, Key, Gauge, AlertTriangle, Code2, Database, Menu, X } from 'lucide-react';

const SIDEBAR_SECTIONS = [
  {
    title: 'Getting Started',
    links: [
      { href: '/docs', label: 'Overview', icon: Book },
      { href: '/docs/authentication', label: 'Authentication', icon: Key },
      { href: '/docs/rate-limits', label: 'Rate Limits', icon: Gauge },
      { href: '/docs/errors', label: 'Error Handling', icon: AlertTriangle },
    ],
  },
  {
    title: 'Reference',
    links: [
      { href: '/docs/endpoints', label: 'Endpoints', icon: Code2 },
      { href: '/docs/objects', label: 'Object Reference', icon: Database },
    ],
  },
];

interface Props {
  children: ReactNode;
}

export default function DocsLayout({ children }: Props) {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebar = (
    <nav className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      {SIDEBAR_SECTIONS.map(section => (
        <div key={section.title} className="px-4 py-4 border-b border-slate-100 last:border-b-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">{section.title}</div>
          <div className="space-y-1">
            {section.links.map(link => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-20 py-10">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden flex items-center gap-2 mb-6 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg"
      >
        {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        {sidebarOpen ? 'Close Menu' : 'Docs Menu'}
      </button>

      {/* Mobile sidebar */}
      {sidebarOpen && <div className="lg:hidden mb-6">{sidebar}</div>}

      <div className="flex gap-10">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-[240px] flex-shrink-0">
          <div className="sticky top-[96px]">{sidebar}</div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
