/**
 * SkipLink — Skip-to-content accessibility link.
 *
 * Visually hidden by default, becomes visible when focused via keyboard.
 * Should be the first focusable element on every page layout.
 *
 * WCAG 2.4.1 Bypass Blocks (Level A)
 */

export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]
                 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg
                 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:shadow-lg
                 focus:text-sm focus:font-medium"
    >
      Skip to main content
    </a>
  );
}
