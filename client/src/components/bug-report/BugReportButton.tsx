/**
 * Bug Report Button
 *
 * Floating button that opens the bug report modal.
 * Positioned in the bottom-right corner of the screen.
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Bug } from 'lucide-react';
import { BugReportModal } from './BugReportModal';

export function BugReportButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating button - bottom right */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3 bg-slate-800 dark:bg-slate-700
                   text-white rounded-full shadow-lg hover:bg-slate-700 dark:hover:bg-slate-600
                   transition-all hover:scale-105 group"
        title="Report a bug"
        aria-label="Report a bug"
      >
        <Bug className="w-5 h-5" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2
                         bg-slate-800 text-white text-sm px-3 py-1.5 rounded-lg
                         opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap
                         pointer-events-none">
          Report a bug
        </span>
      </button>

      {isOpen && createPortal(
        <BugReportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />,
        document.body
      )}
    </>
  );
}
