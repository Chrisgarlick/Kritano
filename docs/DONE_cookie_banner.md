# Cookie Banner — Ultrathink Plan

## Overview

Kritano currently uses three server-set cookies (access_token, refresh_token, csrf_token) — all strictly necessary for authentication and security. There is no analytics, tracking, or marketing cookie infrastructure. The app uses localStorage only for theme preference (non-tracking).

This plan implements a GDPR/UK-GDPR/PECR-compliant cookie consent banner system that:
1. Classifies cookies into categories (Necessary, Analytics, Marketing)
2. Shows a consent banner on first visit with granular controls
3. Persists consent choice in localStorage + logs it server-side for compliance
4. Gates future analytics/marketing scripts behind consent
5. Provides a "Manage Cookies" modal accessible from the footer at all times
6. Integrates cleanly with the existing consent logging service on the backend

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Consent storage** | localStorage (`pp-cookie-consent`) + server-side log | localStorage is immediately available on page load; server log creates an auditable compliance trail |
| **Banner position** | Bottom of viewport, full-width | Industry standard, doesn't block key navigation or CTAs |
| **Consent model** | Opt-in (granular) | UK-GDPR requires opt-in for non-essential cookies; "Accept All" + "Manage Preferences" + "Reject All" |
| **Cookie categories** | Necessary (always on), Analytics (opt-in), Marketing (opt-in) | Standard GDPR tiers; Necessary cannot be toggled off |
| **Script loading** | Consent-gated via context | Analytics/marketing `<script>` tags only injected after explicit consent |
| **Consent version** | Semver string (`COOKIE_CONSENT_VERSION = '1.0'`) | Re-prompts users when consent text or categories change |
| **Scope** | All pages (public + authenticated) | GDPR applies regardless of auth state; banner wraps at App.tsx level |
| **Dark mode** | Full dark mode support | Matches existing theme context (`useTheme`) |
| **Mobile** | Fully responsive | Stack buttons vertically on `< sm`, full-width banner |
| **Accessibility** | `role="dialog"`, focus trap, `aria-label`, keyboard navigable | Matches existing modal patterns (UnverifiedDomainConsentModal) |

---

## Cookie Inventory

### Currently Set Cookies

| Cookie | Category | Purpose | HttpOnly | Duration |
|--------|----------|---------|----------|----------|
| `access_token` | **Necessary** | JWT authentication | Yes | 4 hours |
| `refresh_token` | **Necessary** | Session persistence | Yes | 7 days |
| `csrf_token` | **Necessary** | CSRF protection | No | 24 hours |

### Future Cookies (Gated Behind Consent)

| Cookie | Category | Purpose | Set By |
|--------|----------|---------|--------|
| `_ga`, `_gid` | **Analytics** | Google Analytics (if added) | GA4 script |
| `_fbp` | **Marketing** | Facebook Pixel (if added) | FB script |
| `_hjid` | **Analytics** | Hotjar (if added) | Hotjar script |

### localStorage Usage (Non-Cookie, Documented)

| Key | Purpose | Consent Required? |
|-----|---------|-------------------|
| `kritano-theme` | Theme preference | No (functional) |
| `sidebar-collapsed` | UI preference | No (functional) |
| `pp-cookie-consent` | Consent state itself | No (exempt — consent mechanism) |

---

## Database Changes

### Migration: `078_cookie_consent_log.sql`

```sql
-- Cookie consent audit log for GDPR compliance
CREATE TABLE IF NOT EXISTS cookie_consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who consented (nullable for anonymous visitors)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Consent details
  consent_version VARCHAR(20) NOT NULL,
  categories JSONB NOT NULL,  -- { necessary: true, analytics: false, marketing: false }
  action VARCHAR(20) NOT NULL CHECK (action IN ('accept_all', 'reject_all', 'custom', 'withdraw')),

  -- Context
  ip_address INET,
  user_agent TEXT,
  page_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cookie_consent_user ON cookie_consent_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_cookie_consent_created ON cookie_consent_logs(created_at);
```

This table is append-only — consent is never updated, only new records are inserted. This creates a complete audit trail for compliance.

---

## Backend Changes

### 1. Constants: `server/src/constants/consent.constants.ts`

Add to the existing file:

```typescript
/**
 * Cookie consent version
 * Increment when consent categories or text change
 */
export const COOKIE_CONSENT_VERSION = '1.0';

/**
 * Cookie category definitions
 */
export const COOKIE_CATEGORIES = {
  necessary: {
    label: 'Strictly Necessary',
    description: 'Essential for the website to function. These cookies enable core features like security, authentication, and accessibility. They cannot be disabled.',
    required: true,
    cookies: ['access_token', 'refresh_token', 'csrf_token'],
  },
  analytics: {
    label: 'Analytics',
    description: 'Help us understand how visitors interact with our website by collecting anonymous usage data. This helps us improve Kritano for everyone.',
    required: false,
    cookies: ['_ga', '_gid', '_gat'],
  },
  marketing: {
    label: 'Marketing',
    description: 'Used to deliver relevant advertisements and track the effectiveness of our marketing campaigns. These cookies may be set by third-party advertising partners.',
    required: false,
    cookies: ['_fbp', '_gcl_au'],
  },
} as const;

export type CookieCategory = keyof typeof COOKIE_CATEGORIES;
```

### 2. Route: `server/src/routes/consent/cookie-consent.ts`

New route file for logging cookie consent:

```typescript
// POST /api/consent/cookies
// Body: { consent_version, categories, action, page_url }
// Auth: optional (logs user_id if authenticated)
// Rate limit: 10 per minute per IP
```

The endpoint:
- Accepts consent data from the frontend
- Logs to `cookie_consent_logs` table
- Captures IP address (from `req.ip`) and user agent (from `req.headers['user-agent']`)
- Returns `{ success: true, logged_at: timestamp }`
- Does NOT require CSRF token (this fires before user has authenticated in many cases)

### 3. Route registration: `server/src/routes/index.ts`

Add the cookie consent route under `/api/consent/cookies` (public, no auth required).

### 4. Admin API: `server/src/routes/admin/consent.ts`

Admin endpoint to view cookie consent analytics:

```typescript
// GET /api/admin/consent/cookies/stats
// Returns: { total_consents, by_action: { accept_all, reject_all, custom },
//            analytics_opt_in_rate, marketing_opt_in_rate }
```

---

## Frontend Changes

### File Structure

```
client/src/
├── contexts/
│   └── CookieConsentContext.tsx       ← Context provider + hook
├── components/
│   └── cookies/
│       ├── CookieBanner.tsx           ← Bottom banner (initial prompt)
│       └── CookiePreferencesModal.tsx ← Full preferences modal
├── types/
│   └── consent.types.ts              ← Shared types
└── services/
    └── api.ts                        ← Add consent API method
```

### 1. Types: `client/src/types/consent.types.ts`

```typescript
export interface CookieConsent {
  version: string;
  categories: {
    necessary: true;  // Always true
    analytics: boolean;
    marketing: boolean;
  };
  action: 'accept_all' | 'reject_all' | 'custom' | 'withdraw';
  timestamp: string;  // ISO 8601
}

export type CookieCategory = 'necessary' | 'analytics' | 'marketing';

export interface CookieCategoryInfo {
  label: string;
  description: string;
  required: boolean;
  cookies: string[];
}
```

### 2. Context: `client/src/contexts/CookieConsentContext.tsx`

This is the core of the system. The context:

**State:**
- `consent: CookieConsent | null` — current consent state (null = not yet consented)
- `showBanner: boolean` — whether the banner should be visible
- `showPreferences: boolean` — whether the preferences modal is open

**Logic:**
- On mount, reads `pp-cookie-consent` from localStorage
- If no consent found, or consent version differs from `COOKIE_CONSENT_VERSION`, shows the banner
- Provides `acceptAll()`, `rejectAll()`, `savePreferences(categories)`, `withdraw()` functions
- Each function:
  1. Updates localStorage
  2. Updates context state
  3. Fires `POST /api/consent/cookies` to log server-side (fire-and-forget, no blocking)
  4. Dispatches a custom `cookieConsentChanged` event on `window` for script loaders to react
- Provides `openPreferences()` to open the modal from anywhere (footer link)
- Provides `hasConsent(category: CookieCategory): boolean` helper for gating scripts

**Script gating approach:**
- Expose a `useConsentGate(category)` hook that returns `true`/`false`
- Components that load analytics/marketing scripts check this before injecting `<script>` tags
- Example: `const analyticsAllowed = useConsentGate('analytics');`

**Key implementation detail — the context must be placed ABOVE the router in `App.tsx`** so it's available on every page, including public routes where the user hasn't authenticated.

### 3. Component: `client/src/components/cookies/CookieBanner.tsx`

**Design (matching Brand Guidelines):**

```
┌─────────────────────────────────────────────────────────────────────┐
│  🍪                                                                 │
│  We use cookies to improve your experience                         │
│                                                                     │
│  We use essential cookies for security and authentication.          │
│  With your permission, we'd also like to use analytics cookies      │
│  to understand how you use Kritano so we can make it better.    │
│                                                                     │
│  [Manage Preferences]    [Reject All]    [Accept All]              │
│                                                                     │
│  Read our Privacy Policy                                            │
└─────────────────────────────────────────────────────────────────────┘
```

**Styling:**
- Position: `fixed bottom-0 inset-x-0 z-[60]` (above all other z-indices including sidebar z-50)
- Background: `bg-white dark:bg-slate-900`
- Border: `border-t border-slate-200 dark:border-slate-700`
- Shadow: `shadow-lg` (elevation level 3)
- Content max-width: `max-w-5xl mx-auto`
- Padding: `px-6 py-5`
- Animation: slide up from bottom (`transform translate-y-full → translate-y-0`, 300ms ease-out)

**Buttons:**
- "Accept All": `bg-indigo-600 hover:bg-indigo-700 text-white` (primary style)
- "Reject All": `bg-white border border-slate-200 text-slate-700 hover:bg-slate-50` (secondary/outline)
- "Manage Preferences": `text-indigo-600 hover:text-indigo-700 underline` (ghost/link style)

**Mobile layout (< sm):**
- Buttons stack vertically, full-width
- Padding reduced to `px-4 py-4`
- Text size remains same (body-sm/body-md)

**Accessibility:**
- `role="dialog"` + `aria-label="Cookie consent"`
- Focus trapped within banner when visible
- "Accept All" receives initial focus
- Escape key = Reject All

### 4. Component: `client/src/components/cookies/CookiePreferencesModal.tsx`

Full modal with granular toggle controls:

```
┌─────────────────────────────────────────────────────────────────┐
│  Cookie Preferences                                        [X] │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  We use cookies and similar technologies to help personalise    │
│  content and provide a better experience. You can manage your   │
│  preferences below.                                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ○ Strictly Necessary                     [Always On]   │   │
│  │  Essential for security, authentication, and core       │   │
│  │  functionality. Cannot be disabled.                     │   │
│  │  Cookies: access_token, refresh_token, csrf_token       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ○ Analytics                              [Toggle]      │   │
│  │  Help us understand how visitors use Kritano by      │   │
│  │  collecting anonymous usage data.                       │   │
│  │  Cookies: _ga, _gid, _gat                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ○ Marketing                              [Toggle]      │   │
│  │  Used to deliver relevant ads and track campaign        │   │
│  │  effectiveness.                                         │   │
│  │  Cookies: _fbp, _gcl_au                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                          [Reject All]  [Save Preferences]      │
│                                                                 │
│  You can change your preferences at any time from the footer.  │
└─────────────────────────────────────────────────────────────────┘
```

**Styling:**
- Centered modal overlay (matches existing modal pattern)
- Backdrop: `fixed inset-0 bg-black/50 z-[70]`
- Modal: `bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-lg w-full mx-4 p-6`
- Category cards: `bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700`
- Toggle switches: Custom toggle component (indigo-600 when on, slate-300 when off)
- "Always On" badge: `bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs px-2 py-0.5 rounded`

**Toggle component:**
- 44px wide × 24px tall (meets minimum tap target)
- `bg-indigo-600` when on, `bg-slate-300 dark:bg-slate-600` when off
- White circle indicator with smooth transition
- `role="switch"` + `aria-checked`

**Accessibility:**
- `role="dialog"` + `aria-modal="true"` + `aria-label="Cookie preferences"`
- Focus trapped within modal
- Close button has `aria-label="Close cookie preferences"`
- Each toggle has associated label via `aria-labelledby`
- Escape key closes modal

### 5. Integration: `client/src/App.tsx`

Wrap the app with `CookieConsentProvider`:

```tsx
<HelmetProvider>
  <ThemeProvider>
    <CookieConsentProvider>
      <AuthProvider>
        ...
      </AuthProvider>
    </CookieConsentProvider>
  </ThemeProvider>
</HelmetProvider>
```

The `CookieBanner` and `CookiePreferencesModal` render inside the provider, positioned fixed — no layout impact.

### 6. Footer Link: `client/src/components/layout/PublicLayout.tsx`

Add "Cookie Settings" link in the footer bottom bar, next to Privacy Policy and Terms of Service:

```tsx
<button
  onClick={() => openCookiePreferences()}
  className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
>
  Cookie Settings
</button>
```

Also add the same link in `DashboardLayout` footer area (or as a settings option).

### 7. API: `client/src/services/api.ts`

Add consent logging method:

```typescript
export const consentApi = {
  logCookieConsent: (data: {
    consent_version: string;
    categories: Record<string, boolean>;
    action: string;
    page_url: string;
  }) => api.post('/consent/cookies', data),
};
```

---

## Critical Files Summary

| File | Action | Priority |
|------|--------|----------|
| `server/src/db/migrations/078_cookie_consent_log.sql` | Create | Backend |
| `server/src/constants/consent.constants.ts` | Modify — add cookie categories | Backend |
| `server/src/routes/consent/cookie-consent.ts` | Create — consent logging endpoint | Backend |
| `server/src/routes/index.ts` | Modify — register consent route | Backend |
| `client/src/types/consent.types.ts` | Create — shared types | Frontend |
| `client/src/contexts/CookieConsentContext.tsx` | Create — core context provider | Frontend |
| `client/src/components/cookies/CookieBanner.tsx` | Create — bottom banner | Frontend |
| `client/src/components/cookies/CookiePreferencesModal.tsx` | Create — preferences modal | Frontend |
| `client/src/App.tsx` | Modify — wrap with CookieConsentProvider | Frontend |
| `client/src/components/layout/PublicLayout.tsx` | Modify — add "Cookie Settings" footer link | Frontend |
| `client/src/services/api.ts` | Modify — add consent API method | Frontend |

---

## Testing Plan

### Unit Tests
1. **CookieConsentContext**: Test localStorage read/write, version mismatch re-prompt, `hasConsent()` logic
2. **CookieBanner**: Renders when no consent; hidden after consent; correct button actions
3. **CookiePreferencesModal**: Toggle states, "Accept All" sets all true, "Reject All" sets non-necessary false, "Save" uses current toggles

### Integration Tests
4. **Consent flow**: Visit site → see banner → click "Accept All" → banner disappears → reload page → no banner
5. **Reject flow**: Click "Reject All" → banner disappears → localStorage has analytics:false, marketing:false
6. **Custom flow**: Click "Manage" → toggle analytics on → "Save" → localStorage correct
7. **Version bump**: Change COOKIE_CONSENT_VERSION → reload → banner re-appears despite existing consent
8. **Footer link**: Click "Cookie Settings" → preferences modal opens

### Playwright Tests (add to existing mobile suite)
9. **Mobile banner**: Banner visible on mobile, buttons stack, no overflow
10. **Mobile modal**: Preferences modal scrollable, toggles tappable, no overflow

### Backend Tests
11. **POST /api/consent/cookies**: Logs correctly, validates action enum, handles missing user_id
12. **Admin stats endpoint**: Returns correct aggregation

---

## Implementation Order

1. **Backend first:**
   a. Create migration `078_cookie_consent_log.sql`
   b. Add constants to `consent.constants.ts`
   c. Create `server/src/routes/consent/cookie-consent.ts`
   d. Register route in `server/src/routes/index.ts`
   e. Run migration

2. **Frontend types + context:**
   a. Create `client/src/types/consent.types.ts`
   b. Create `client/src/contexts/CookieConsentContext.tsx`
   c. Add API method to `client/src/services/api.ts`

3. **Frontend components:**
   a. Create `client/src/components/cookies/CookieBanner.tsx`
   b. Create `client/src/components/cookies/CookiePreferencesModal.tsx`

4. **Integration:**
   a. Wrap App.tsx with `CookieConsentProvider`
   b. Add "Cookie Settings" to PublicLayout footer
   c. Add "Cookie Settings" option in DashboardLayout or settings

5. **Testing:**
   a. Manual test all consent flows
   b. Add Playwright mobile tests
   c. Verify server-side logging

6. **Polish:**
   a. Verify dark mode rendering
   b. Test with screen reader
   c. Verify z-index stacking (banner must be above sidebar, below restart-confirm modals)

---

## Legal Compliance Notes

### GDPR/UK-GDPR Requirements Met
- **Informed consent**: Banner clearly explains what each category does
- **Granular control**: Users can accept/reject individual categories
- **Easy withdrawal**: "Cookie Settings" accessible from every page footer
- **Pre-ticked prohibition**: No non-essential category is pre-selected
- **Audit trail**: Server-side log with timestamp, IP, user agent, consent version
- **Version tracking**: Re-prompts when consent text changes

### Necessary Cookies Exempt
Per GDPR Article 5(3) and PECR Regulation 6, strictly necessary cookies do not require consent. Our auth and CSRF cookies qualify as they are essential for the service to function.

### Privacy Policy Link
The banner links to `/privacy` (currently redirects to `/contact`). A proper privacy policy page should be implemented separately and should include:
- Full cookie table with names, purposes, durations
- Third-party cookie details (when analytics/marketing added)
- How to delete cookies via browser settings
- Data controller contact information

---

## Verification

1. Visit site as anonymous user → banner appears at bottom
2. Click "Manage Preferences" → modal opens with toggles
3. Toggle analytics on, marketing off → "Save Preferences" → banner disappears
4. Reload page → no banner
5. Check localStorage `pp-cookie-consent` → correct JSON
6. Check `cookie_consent_logs` table → row with correct data
7. Click "Cookie Settings" in footer → modal re-opens with saved state
8. Change preferences → new row in `cookie_consent_logs` (append-only)
9. Bump `COOKIE_CONSENT_VERSION` → reload → banner re-appears
10. Test on mobile (390px) → banner and modal fully responsive
11. Test in dark mode → correct colors
12. Test with keyboard only → focus trap works, Escape closes
13. `npx tsc --noEmit` → no TypeScript errors
