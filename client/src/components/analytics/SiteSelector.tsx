import { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import type { SiteWithStats } from '../../types/site.types';

interface SiteSelectorProps {
  sites: SiteWithStats[];
  currentSiteId?: string;
  onChange: (siteId: string) => void;
  placeholder?: string;
}

export function SiteSelector({
  sites,
  currentSiteId,
  onChange,
  placeholder = 'Jump to site...'
}: SiteSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentSite = sites.find(s => s.id === currentSiteId);

  // Filter out the current site from the list
  const otherSites = sites.filter(s => s.id !== currentSiteId);

  if (otherSites.length === 0) {
    return null; // Don't show selector if there are no other sites to jump to
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors min-w-[200px]"
      >
        <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <span className="flex-1 text-left truncate">
          {currentSite ? currentSite.name : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 py-1 max-h-64 overflow-auto">
            {otherSites.map(site => (
              <button
                key={site.id}
                onClick={() => {
                  onChange(site.id);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="font-medium truncate">{site.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{site.domain}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
