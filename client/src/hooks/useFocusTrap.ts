import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Trap keyboard focus inside a container element.
 *
 * When active:
 * - Stores the previously focused element
 * - Moves focus to the first focusable child (or the container itself)
 * - Tab / Shift+Tab cycle through focusable elements within the container
 * - Escape key calls onEscape callback
 *
 * When deactivated:
 * - Restores focus to the previously focused element
 */
export function useFocusTrap(
  isActive: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onEscape?: () => void
): void {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    // Store currently focused element for restoration
    previouslyFocused.current = document.activeElement as HTMLElement;

    // Move focus into the container
    const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (focusables.length > 0) {
      focusables[0].focus();
    } else {
      container.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      if (e.key !== 'Tab') return;

      const currentFocusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (currentFocusables.length === 0) return;

      const first = currentFocusables[0];
      const last = currentFocusables[currentFocusables.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if on first element, wrap to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: if on last element, wrap to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);

      // Restore focus when deactivated
      if (previouslyFocused.current && previouslyFocused.current.isConnected) {
        previouslyFocused.current.focus();
      }
    };
  }, [isActive, containerRef, onEscape]);
}
