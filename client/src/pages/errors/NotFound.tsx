/**
 * 404 Not Found Page
 *
 * Displayed when a user navigates to a non-existent route.
 * Features the PagePulser pulse aesthetic with helpful navigation.
 */

import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Display, Body } from '../../components/ui/Typography';
import { useState } from 'react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/sites?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-lg w-full text-center">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <Display
            size="2xl"
            className="text-[10rem] leading-none font-bold text-slate-200 dark:text-slate-800 select-none"
          >
            404
          </Display>

          {/* Pulse line overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-full h-32 text-indigo-500/30 dark:text-indigo-400/30"
              viewBox="0 0 400 100"
              preserveAspectRatio="none"
            >
              {/* Flatline with blip */}
              <path
                d="M0,50 L120,50 L140,50 L150,20 L160,80 L170,35 L180,65 L190,50 L200,50 L400,50"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-pulse"
              />
            </svg>
          </div>
        </div>

        {/* Message */}
        <Display size="md" className="text-slate-900 dark:text-white mb-4">
          Page not found
        </Display>

        <Body size="lg" muted className="mb-8 max-w-md mx-auto">
          This page seems to have gone off the grid. It might have been moved, deleted,
          or perhaps it never existed.
        </Body>

        {/* Search form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative max-w-sm mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search for a site..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>

        {/* Helpful links */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <Body size="sm" muted className="mb-4">
            Looking for something specific?
          </Body>
          <div className="flex items-center justify-center gap-6 text-sm">
            <Link
              to="/sites"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Your Sites
            </Link>
            <Link
              to="/audits"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Audits
            </Link>
            <Link
              to="/settings"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
