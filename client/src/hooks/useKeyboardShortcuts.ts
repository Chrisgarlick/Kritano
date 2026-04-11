import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger in input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        navigate('/app/audits/new');
      } else if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('input[placeholder*="Search"]');
        searchInput?.focus();
      } else if (e.key === 'Escape') {
        if (showHelp) {
          setShowHelp(false);
        } else {
          (document.activeElement as HTMLElement)?.blur();
        }
      } else if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setShowHelp(prev => !prev);
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navigate, showHelp]);

  return { showHelp, setShowHelp };
}
