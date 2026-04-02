# Design Audit

**Overall Assessment:** STRONG
**Score:** 8/10

## What's Working Well

1. **Comprehensive Typography System**: The `Typography.tsx` component faithfully implements the brand's three-font strategy (Instrument Serif for display, Outfit for body, JetBrains Mono for code). The `Display`, `Heading`, `Body`, `Mono`, `Label`, and `ScoreNumber` components enforce consistent type usage across the app. The Dashboard page demonstrates proper adoption with `Display` for the welcome heading and `Body`/`Mono` for supporting text.

2. **Robust Accessibility Foundations**: Core components show strong a11y practices. `Input.tsx` uses `aria-invalid`, `aria-describedby`, generated IDs, and proper `<label>` association. `Toast.tsx` uses `role="status"`, `aria-live="polite"`, and `role="alert"` for errors. `Button.tsx` marks the loading spinner `aria-hidden`. The `ProgressRing` provides `aria-label` on SVGs. Both `DashboardLayout` and `PublicLayout` include a `<SkipLink>` component. The `Sidebar` uses proper `role="dialog"` and `aria-modal` for mobile, with focus trapping via `useFocusTrap`.

3. **Well-Structured Component Library**: The `StatusBadge.tsx` file provides a cohesive badge system (`StatusBadge`, `SeverityBadge`, `CountBadge`, `PulseIndicator`) with consistent sizing configs, color mappings, and animation integration. Severity colors faithfully match the brand guidelines (red/critical, orange/serious, amber/moderate, sky/minor, slate/info).

4. **Brand-Consistent Color Application**: The indigo primary palette is applied consistently: `bg-indigo-600` for primary buttons, `text-indigo-600` for active nav states, `indigo-50` for hover highlights, and the `focus:ring-indigo-500` pattern across inputs and buttons. The amber accent is used strategically for CTA buttons via the `accent` variant, trial banners, and warning states.

5. **Thoughtful Layout Architecture**: The `DashboardLayout` cleanly separates the sidebar, main content area, trial banners, and email verification alerts. The `PublicLayout` provides a well-structured responsive navigation with services dropdown, mobile menu with focus trap, and a complete footer hierarchy. Both layouts follow the brand's spacing guidelines.

## Issues Found

### Dynamic Tailwind Class Construction in Sidebar Tier Badge
**Severity:** HIGH
**Location:** `/Users/chris/Herd/kritano/client/src/components/layout/Sidebar.tsx` (line 179)
**Finding:** The tier badge constructs Tailwind classes dynamically using template literals: `` bg-${tierInfo.color}-100 text-${tierInfo.color}-700 ``. Tailwind CSS purges classes at build time by scanning for complete class strings. Dynamically constructed class names will not be detected by the purger and will be missing from the production CSS bundle.
**Impact:** In production builds, the tier badge will render with no background or text color, appearing invisible or broken for all users. This is a functional bug disguised as a styling issue.
**Recommendation:** Replace dynamic class construction with a lookup map that contains complete class strings, e.g., `const tierColorMap: Record<string, string> = { indigo: 'bg-indigo-100 text-indigo-700', emerald: 'bg-emerald-100 text-emerald-700', ... }`.

### Public CTA Buttons Deviate from Brand Color System
**Severity:** MEDIUM
**Location:** `/Users/chris/Herd/kritano/client/src/components/layout/PublicLayout.tsx` (lines 186, 200, 295, 311)
**Finding:** The "Get Started" and "Dashboard" CTA buttons in the public navigation use `bg-slate-900 hover:bg-slate-800` instead of the brand primary (`bg-indigo-600 hover:bg-indigo-700`) or accent (`bg-amber-500`). The brand guidelines specify indigo-600 for primary CTAs and amber-500 for conversion-focused CTAs. The footer banner correctly uses `bg-indigo-600`, but the header buttons do not.
**Impact:** Creates visual inconsistency between the navigation and the rest of the site. Weakens brand recognition at the most critical conversion touchpoint (the header CTA).
**Recommendation:** Change header CTAs to `bg-indigo-600 hover:bg-indigo-700 text-white` for consistency, or use the amber accent variant for conversion emphasis as per guidelines.

### Input Focus Ring Missing Opacity Modifier
**Severity:** MEDIUM
**Location:** `/Users/chris/Herd/kritano/client/src/components/ui/Input.tsx` (line 33)
**Finding:** The Input component uses `focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`. The brand guidelines specify `ring-2 ring-indigo-500/20 border-indigo-500` -- note the `/20` opacity modifier on the ring. The current implementation produces a solid, opaque indigo ring which is visually heavy and inconsistent with inputs across the rest of the app (44 files use `ring-indigo-500/20`).
**Impact:** Focused inputs have an overly prominent, opaque ring that visually clashes with the subtler focus styles used elsewhere.
**Recommendation:** Change to `focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500` to match the brand guidelines and the pattern used in other components.

### Button Secondary Variant Deviates from Guidelines
**Severity:** MEDIUM
**Location:** `/Users/chris/Herd/kritano/client/src/components/ui/Button.tsx` (lines 39-43)
**Finding:** The `secondary` button variant uses `bg-slate-600 text-white hover:bg-slate-700`, which renders as a dark solid button. The brand guidelines define secondary buttons as `bg-white border-slate-200 text-slate-700 hover:bg-slate-50` -- a light bordered style. The current implementation is functionally a "dark" variant, not a secondary. The `outline` variant partially fills this gap but uses `border-slate-300` instead of `border-slate-200`.
**Impact:** Developers choosing `secondary` expect the guideline-defined light bordered button but get a dark filled button instead. This creates confusion and inconsistency.
**Recommendation:** Rename current `secondary` to `dark` and create a new `secondary` variant matching the guidelines: `bg-white border border-slate-200 text-slate-700 hover:bg-slate-50`.

### Keyboard Shortcuts Modal Lacks Focus Management
**Severity:** MEDIUM
**Location:** `/Users/chris/Herd/kritano/client/src/components/layout/DashboardLayout.tsx` (lines 71-111)
**Finding:** The keyboard shortcuts help modal in DashboardLayout uses `aria-hidden="true"` on the overlay div but does not trap focus within the dialog. While it has `role="dialog"` and `aria-modal="true"`, there is no `useFocusTrap` hook applied (unlike the mobile sidebar and mobile menu which both correctly use it). Pressing Tab will cycle focus to elements behind the modal overlay.
**Impact:** Keyboard users can tab behind the modal, creating a confusing navigation experience. This is a WCAG 2.1 AA failure (2.4.3 Focus Order).
**Recommendation:** Apply the existing `useFocusTrap` hook to this modal, matching the pattern already used in the Sidebar mobile menu.

### Toast Container Missing Keyboard Dismissal
**Severity:** LOW
**Location:** `/Users/chris/Herd/kritano/client/src/components/ui/Toast.tsx` (lines 51-68)
**Finding:** Toasts auto-dismiss after 4 seconds and have a close button, but the close button is not keyboard-focusable in context because the toast container uses `role="status"` with `aria-live="polite"`. Screen reader users hear the toast content but cannot easily dismiss it via keyboard since the dismiss button may not receive focus in the live region. Additionally, error toasts use `role="alert"` which is assertive but there is no Escape key handler to dismiss all visible toasts.
**Impact:** Minor inconvenience for keyboard/screen reader users who cannot quickly dismiss persistent toast notifications.
**Recommendation:** Add an Escape key handler to dismiss all toasts, and consider making the toast container focusable or adding `tabIndex={0}` to the dismiss button to ensure keyboard reachability.

### Homepage Hero CTA Not Using Button Component
**Severity:** LOW
**Location:** `/Users/chris/Herd/kritano/client/src/pages/Home.tsx` (lines 73-85)
**Finding:** The hero "Start Free Audit" CTA is a raw `<Link>` with inline Tailwind classes (`px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium`) rather than using the `Button` component. While the colors are correct, this bypasses the design system's focus ring, loading state, and disabled state patterns.
**Impact:** Inconsistent interaction patterns. If Button styles are updated, these inline CTAs will not inherit the changes.
**Recommendation:** Use the `Button` component with `as={Link}` or wrap in a proper button-styled component to maintain design system consistency. The same applies to the "Learn More" link and the CTA section buttons.

## Opportunities

1. **Consolidate Inline Button Styles**: Many pages (Home, PublicLayout, auth pages) use raw `<Link>` or `<a>` elements with hand-written button-like Tailwind classes instead of the `Button` component. Creating a `LinkButton` variant or adding `as` prop support to the Button component would centralize these styles and ensure consistent focus, hover, and disabled behavior across the app.

2. **Add Reduced Motion Integration to Component Library**: While `index.css` includes a global `prefers-reduced-motion` rule, the individual component animations (StatusBadge's `animate-pulse-glow`, `animate-success-flash`, `animate-shake`; ProgressRing's `animate-progress-fill`; Dashboard's `animate-reveal-up`) rely on this global rule. Components should optionally accept an `animated` prop (as ProgressRing does) and respect the user's motion preference more granularly, especially for the StatusBadge which applies animation to the entire badge element.

3. **Implement Dark Mode Toggle on Public Pages**: The dashboard sidebar includes a dark mode toggle using `ThemeContext`, but the public-facing pages (`PublicLayout`) have no mechanism for users to switch themes. The brand guidelines document a complete dark mode palette but it is only available in the authenticated experience.

4. **Add Tooltip Keyboard Activation**: The `Tooltip` component triggers on `onFocus`/`onBlur`, which is good, but it wraps children in a `<div>` that is not intrinsically focusable. If the child is not a focusable element (e.g., a static icon or text), the tooltip will never appear for keyboard users. Adding `tabIndex={0}` to the wrapper when the child is not natively focusable would fix this.

5. **Systematize Card Border Radius**: The brand guidelines specify `rounded-lg` (12px) for standard cards and `rounded-xl` (16px) for feature sections. The codebase mixes `rounded-xl`, `rounded-2xl`, and `rounded-lg` on cards without a clear hierarchy. Dashboard cards use `rounded-2xl`, feature cards use `rounded-xl`, and some settings cards use `rounded-lg`. Standardizing via a `Card` component with size variants would enforce consistency.

## Summary

Kritano's design system is well-architected and mostly faithfully implemented. The typography component system is a standout -- it properly encodes the three-font brand strategy into reusable components that are widely adopted across the codebase. Accessibility foundations are strong, with proper ARIA attributes, skip links, focus traps, and screen reader support in most components. The color system is consistently applied with indigo primary, amber accent, and warm slate neutrals matching the brand guidelines. The main issues are a broken dynamic Tailwind class in the Sidebar tier badge (which will fail in production), a secondary Button variant that contradicts the guidelines, inconsistent CTA button colors on public pages, and a missing focus trap on the keyboard shortcuts modal. These are all straightforward fixes. The codebase would benefit from consolidating the many inline button-styled links into the component system and standardizing card border radius values, but overall the design implementation is solid and coherent.
