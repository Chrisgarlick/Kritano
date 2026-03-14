/**
 * Feedback Button
 *
 * Unified floating button that opens a popup menu with options
 * to report a bug or request a feature.
 * Replaces the standalone BugReportButton.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquarePlus, Bug, Lightbulb } from 'lucide-react';
import { BugReportModal } from '../bug-report/BugReportModal';
import { FeatureRequestModal } from '../feature-request/FeatureRequestModal';

export function FeedbackButton() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bugModalOpen, setBugModalOpen] = useState(false);
  const [featureModalOpen, setFeatureModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuItemsRef = useRef<HTMLButtonElement[]>([]);

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Focus first menu item when menu opens
  useEffect(() => {
    if (menuOpen && menuItemsRef.current[0]) {
      menuItemsRef.current[0].focus();
    }
  }, [menuOpen]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setMenuOpen(false);
      buttonRef.current?.focus();
      return;
    }

    const items = menuItemsRef.current;
    const currentIndex = items.indexOf(e.target as HTMLButtonElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (currentIndex + 1) % items.length;
      items[next]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (currentIndex - 1 + items.length) % items.length;
      items[prev]?.focus();
    }
  }, []);

  const handleBugReport = () => {
    setMenuOpen(false);
    setBugModalOpen(true);
  };

  const handleFeatureRequest = () => {
    setMenuOpen(false);
    setFeatureModalOpen(true);
  };

  return (
    <>
      {/* Menu popup */}
      {menuOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Feedback options"
          onKeyDown={handleKeyDown}
          className="fixed bottom-20 right-6 z-40 bg-white dark:bg-slate-800 rounded-lg shadow-xl
                     border border-slate-200 dark:border-slate-700 overflow-hidden min-w-[200px]
                     animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <button
            ref={(el) => { if (el) menuItemsRef.current[0] = el; }}
            role="menuitem"
            onClick={handleBugReport}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200
                     hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Bug className="w-4 h-4 text-red-500" />
            Report a Bug
          </button>
          <div className="border-t border-slate-100 dark:border-slate-700" />
          <button
            ref={(el) => { if (el) menuItemsRef.current[1] = el; }}
            role="menuitem"
            onClick={handleFeatureRequest}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200
                     hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Request a Feature
          </button>
        </div>
      )}

      {/* Floating button */}
      <button
        ref={buttonRef}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-expanded={menuOpen}
        aria-haspopup="true"
        className="fixed bottom-6 right-6 z-40 p-3 bg-slate-800 dark:bg-slate-700
                   text-white rounded-full shadow-lg hover:bg-slate-700 dark:hover:bg-slate-600
                   transition-all hover:scale-105 group"
        title="Send feedback"
        aria-label="Send feedback"
      >
        <MessageSquarePlus className="w-5 h-5" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2
                         bg-slate-800 text-white text-sm px-3 py-1.5 rounded-lg
                         opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap
                         pointer-events-none">
          Send feedback
        </span>
      </button>

      {/* Modals */}
      {bugModalOpen && createPortal(
        <BugReportModal isOpen={bugModalOpen} onClose={() => setBugModalOpen(false)} />,
        document.body
      )}
      {featureModalOpen && createPortal(
        <FeatureRequestModal isOpen={featureModalOpen} onClose={() => setFeatureModalOpen(false)} />,
        document.body
      )}
    </>
  );
}
