# Plan: Waitlist & Early Access Public Website Overhaul

## Context

The current site has a `ComingSoonGuard` that blocks ALL public pages when `coming_soon_enabled` is `true`, showing only a basic email capture form. This prevents the marketing site, blog, and services pages from being visible during pre-launch, killing SEO and content marketing efforts.

**Goal:** 3 modes for the public site:
1. **Waitlist** - full marketing site visible (no pricing), CTAs drive to waitlist signup, blog accessible
2. **Early Access** - full marketing site + pricing, CTAs drive to EA signup, existing EA users can sign in and use the app
3. **Live** - full site as currently built, standard sign up / sign in

---

## Phase 1: Backend - Site Mode Setting

### Step 1.1: Add `site_mode` to system_settings

**File:** `server/src/db/migrations/XXX_site_mode.sql` (new migration)

```sql
-- Replace coming_soon_enabled with site_mode
INSERT INTO system_settings (key, value)
VALUES ('site_mode', '"waitlist"')
ON CONFLICT (key) DO NOTHING;
```

The existing `coming_soon_enabled`, `coming_soon_headline`, `coming_soon_description` settings stay for backwards compatibility. The new `site_mode` key takes precedence.

### Step 1.2: Update system-settings service

**File:** `server/src/services/system-settings.service.ts`

Add helper function:
```typescript
export async function getSiteMode(): Promise<'waitlist' | 'early_access' | 'live'> {
  const mode = await getSetting('site_mode');
  if (mode === 'waitlist' || mode === 'early_access' || mode === 'live') return mode;
  // Fallback: check legacy coming_soon_enabled
  const comingSoon = await isComingSoonEnabled();
  return comingSoon ? 'waitlist' : 'live';
}
```

### Step 1.3: Update the coming-soon status endpoint

**File:** `server/src/routes/index.ts` (lines 612-635, the `GET /api/coming-soon/status` handler)

Change the response to include `mode`:
```typescript
// Before:
res.json({ enabled, headline, description });

// After:
const mode = await getSiteMode();
res.json({ enabled: mode !== 'live', mode, headline, description });
```

This is backwards-compatible - `enabled` still works for any old clients, but `mode` gives the new detail.

### Step 1.4: Admin settings endpoint already exists

**File:** `server/src/routes/admin/settings.ts`

The `PATCH /api/admin/settings` endpoint already accepts `{ key, value }` and calls `setSetting()`. No changes needed - the admin UI just needs to call:
```
PATCH /api/admin/settings { key: 'site_mode', value: 'waitlist' }
```

---

## Phase 2: Frontend - Site Mode Context

### Step 2.1: Create SiteModeContext

**New file:** `client/src/contexts/SiteModeContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { comingSoonApi } from '../services/api';

type SiteMode = 'waitlist' | 'early_access' | 'live';

const SiteModeContext = createContext<SiteMode>('live');

export function SiteModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<SiteMode>('live');

  useEffect(() => {
    // Check sessionStorage cache first (60s TTL)
    const cached = sessionStorage.getItem('site_mode_cache');
    if (cached) {
      const { mode: cachedMode, ts } = JSON.parse(cached);
      if (Date.now() - ts < 60000) {
        setMode(cachedMode);
        return;
      }
    }

    comingSoonApi.getStatus().then(res => {
      const m = res.data.mode || (res.data.enabled ? 'waitlist' : 'live');
      setMode(m);
      sessionStorage.setItem('site_mode_cache', JSON.stringify({ mode: m, ts: Date.now() }));
    }).catch(() => setMode('live'));
  }, []);

  return <SiteModeContext.Provider value={mode}>{children}</SiteModeContext.Provider>;
}

export const useSiteMode = () => useContext(SiteModeContext);
```

### Step 2.2: Update frontend API types

**File:** `client/src/services/api.ts` (line ~2672)

Update the `comingSoonApi.getStatus` return type:
```typescript
getStatus: () =>
  api.get<{ enabled: boolean; mode: 'waitlist' | 'early_access' | 'live'; headline: string; description: string }>('/coming-soon/status'),
```

---

## Phase 3: Refactor ComingSoonGuard -> SiteModeGuard

### Step 3.1: Refactor the guard

**File:** `client/src/components/ComingSoonGuard.tsx` (rename to `SiteModeGuard.tsx`)

Replace the binary "show ComingSoon or show app" logic with mode-aware routing:

**Waitlist mode:**
- Allow: `/`, `/about`, `/services`, `/services/:slug`, `/blog`, `/blog/:slug`, `/contact`, `/waitlist`, `/terms`, `/privacy`, `/docs/*`
- Block: `/pricing` (redirect to `/`), `/dashboard/*`, `/audits/*`, `/sites/*`, `/settings/*`, `/analytics/*`, `/compare/*`
- Block: `/login`, `/register` (no accounts in waitlist phase)
- Always allow: `/admin/*`

**Early Access mode:**
- Allow: ALL public routes including `/pricing`
- Allow: `/login`, `/register?ea=*`, `/register/early-access-success`
- Block: `/register` without `?ea=` param (redirect to `/`)
- Block: `/dashboard/*` etc. for non-authenticated users (they get redirected to `/login`)
- EA users who sign in: full app access
- Always allow: `/admin/*`

**Live mode:**
- Allow everything (current behaviour, no guard)

### Step 3.2: Wrap app with SiteModeProvider

**File:** `client/src/App.tsx`

Replace `<ComingSoonGuard>` wrapper with:
```tsx
<SiteModeProvider>
  <SiteModeGuard>
    {/* existing routes */}
  </SiteModeGuard>
</SiteModeProvider>
```

Add `/waitlist` route alongside other public routes:
```tsx
<Route path="/waitlist" element={<WaitlistPage />} />
```

---

## Phase 4: Reusable Components

### Step 4.1: InlineSignup component

**New file:** `client/src/components/public/InlineSignup.tsx`

A reusable email capture form used across multiple pages:
- Consumes `useSiteMode()` to adapt behaviour
- **Waitlist mode:** Name + email fields, submits to `comingSoonApi.signup()`, shows success confirmation
- **Early Access mode:** "Join Early Access" button linking to `/register?ea=email`
- **Live mode:** "Get Started" button linking to `/register`
- Props: `variant: 'hero' | 'inline' | 'footer' | 'blog'` for different visual treatments
- Success state with CheckCircle animation
- Error handling with user-friendly messages
- Uses existing brand styling (indigo primary buttons, Outfit font, slate neutrals)

### Step 4.2: BlogCTA component

**New file:** `client/src/components/blog/BlogCTA.tsx`

Rendered at the bottom of every blog post, above related articles:
- Consumes `useSiteMode()` for mode-appropriate messaging
- **Waitlist:** "Want to try Kritano when it launches?" + InlineSignup
- **Early Access:** "Kritano is in early access." + founding member benefits + EA signup link
- **Live:** "Start your free audit today." + register link
- Styled as a branded card (indigo-50 background, rounded-xl, generous padding)

---

## Phase 5: Dedicated Waitlist Page

### Step 5.1: Create Waitlist page

**New file:** `client/src/pages/public/Waitlist.tsx`

Structure:
1. **Hero section:** "Be the first to audit your website with Kritano" + InlineSignup (hero variant)
2. **Social proof:** "Join X others on the waitlist" (count from API or hardcoded initially)
3. **Feature preview grid:** 4 cards showing the 6 pillars (Accessibility, SEO, Security, Performance, Content Quality, AI Readiness) - use existing category colours
4. **How it works:** 3-step visual (Sign up -> Get notified -> Audit your site)
5. **FAQ section:** 4-5 questions about launch timeline, pricing, what's included
6. **Bottom CTA:** Another InlineSignup

Uses `PublicLayout` wrapper and `PageSeo` for meta tags.

---

## Phase 6: Adapt PublicLayout

### Step 6.1: Header navigation

**File:** `client/src/components/layout/PublicLayout.tsx`

The header currently has: Services dropdown, Pricing, About, Blog, Contact, API Docs, Sign In, Get Started.

Consume `useSiteMode()` in the layout:

**Waitlist mode header:**
- Nav: Services, About, Blog, Contact (remove Pricing, API Docs)
- CTA: Single "Join the Waitlist" button (indigo primary, links to `/waitlist`)
- No Sign In button

**Early Access mode header:**
- Nav: Services, Pricing, About, Blog, Contact (remove API Docs)
- CTAs: "Sign In" (secondary/outline) + "Join Early Access" (indigo primary, links to `/register?ea=email`)

**Live mode header:**
- Current behaviour unchanged

### Step 6.2: Footer

Same file, footer section:

**Waitlist mode footer:**
- Remove "Product" column links (Dashboard, Audits, Reports - these don't exist yet for public users)
- Dark CTA banner: "Be the first to know" + inline email capture
- Keep Company and Resources columns

**Early Access mode footer:**
- Keep Product column but link to `/register?ea=email` instead of dashboard
- Dark CTA banner: "Join as a Founding Member" + benefits callout + EA link

**Live mode footer:**
- Current behaviour unchanged

---

## Phase 7: Adapt Public Pages

### Step 7.1: Home page

**File:** `client/src/pages/public/Home.tsx`

The Home page hero section has CTA buttons. Consume `useSiteMode()`:

- **Waitlist:** Primary CTA -> "Join the Waitlist" (link to `/waitlist`). Remove secondary "Start Free Audit" button. Add waitlist signup section before footer.
- **Early Access:** Primary CTA -> "Join Early Access" (link to `/register?ea=email`). Secondary -> "Sign In" (link to `/login`). Add founding member benefits callout.
- **Live:** No changes.

Also update any other CTA buttons throughout the page (e.g. "Start Free Audit" sections further down).

### Step 7.2: Services page

**File:** `client/src/pages/public/Services.tsx`

Update CTA buttons at the bottom of each service section:
- **Waitlist/EA:** Change "Start Free Audit" to "Join the Waitlist" / "Join Early Access"
- **Live:** No changes

### Step 7.3: About page

**File:** `client/src/pages/public/About.tsx`

Update bottom CTA section:
- **Waitlist/EA:** Adapt CTA text and link
- **Live:** No changes

### Step 7.4: Pricing page routing

**File:** `client/src/App.tsx`

In waitlist mode, redirect `/pricing` to `/`. In the route definition:
```tsx
<Route path="/pricing" element={
  mode === 'waitlist' ? <Navigate to="/" replace /> : <PricingPage />
} />
```

### Step 7.5: Blog post detail

**File:** `client/src/pages/blog/PostDetailPage.tsx`

Add `<BlogCTA />` component after the article content and before the related posts section.

---

## Phase 8: Admin UI

### Step 8.1: Add site mode dropdown to admin settings

**File:** `client/src/pages/admin/AdminSettings.tsx` (or the specific settings page that controls coming-soon)

Add a dropdown/select:
```
Site Mode: [Waitlist v] [Early Access] [Live]
```

Calls: `PATCH /api/admin/settings` with `{ key: 'site_mode', value: 'waitlist' | 'early_access' | 'live' }`

Show description for each mode:
- Waitlist: "Public site visible, no pricing, CTAs drive to waitlist signup"
- Early Access: "Full site visible, founding members can sign in, new users join EA"
- Live: "Full site, standard registration open to everyone"

---

## Implementation Order (with file paths)

| # | Task | Files | Depends On |
|---|------|-------|------------|
| 1 | Migration: add `site_mode` setting | `server/src/db/migrations/XXX_site_mode.sql` | - |
| 2 | Backend: add `getSiteMode()` helper | `server/src/services/system-settings.service.ts` | 1 |
| 3 | Backend: update status endpoint to return `mode` | `server/src/routes/index.ts` (lines 612-635) | 2 |
| 4 | Frontend: create SiteModeContext | `client/src/contexts/SiteModeContext.tsx` (new) | 3 |
| 5 | Frontend: update API types | `client/src/services/api.ts` (line ~2672) | 3 |
| 6 | Frontend: refactor ComingSoonGuard to SiteModeGuard | `client/src/components/ComingSoonGuard.tsx` -> `SiteModeGuard.tsx` | 4 |
| 7 | Frontend: wrap app with SiteModeProvider | `client/src/App.tsx` | 4, 6 |
| 8 | Frontend: build InlineSignup component | `client/src/components/public/InlineSignup.tsx` (new) | 4 |
| 9 | Frontend: build BlogCTA component | `client/src/components/blog/BlogCTA.tsx` (new) | 8 |
| 10 | Frontend: create Waitlist page | `client/src/pages/public/Waitlist.tsx` (new) | 8 |
| 11 | Frontend: add /waitlist route | `client/src/App.tsx` | 10 |
| 12 | Frontend: adapt PublicLayout header + footer | `client/src/components/layout/PublicLayout.tsx` | 4 |
| 13 | Frontend: adapt Home page CTAs | `client/src/pages/public/Home.tsx` | 4, 8 |
| 14 | Frontend: adapt Services page CTAs | `client/src/pages/public/Services.tsx` | 4 |
| 15 | Frontend: adapt About page CTAs | `client/src/pages/public/About.tsx` | 4 |
| 16 | Frontend: pricing redirect in waitlist mode | `client/src/App.tsx` | 4 |
| 17 | Frontend: add BlogCTA to post detail | `client/src/pages/blog/PostDetailPage.tsx` | 9 |
| 18 | Frontend: admin UI site mode dropdown | `client/src/pages/admin/AdminSettings.tsx` | 3 |
| 19 | Test all 3 modes end-to-end | - | All |

---

## Existing Code References

| What | Where | Notes |
|------|-------|-------|
| Coming-soon status endpoint | `server/src/routes/index.ts` lines 612-635 | Modify to return `mode` |
| Coming-soon signup endpoint | `server/src/routes/index.ts` lines 637-691 | Keep as-is, used by waitlist |
| System settings service | `server/src/services/system-settings.service.ts` | Add `getSiteMode()` |
| Settings DB table | `server/src/db/migrations/077_system_settings.sql` | `system_settings` table |
| Signups DB table | Same migration | `coming_soon_signups` table |
| Admin settings PATCH | `server/src/routes/admin/settings.ts` | Already generic, no changes needed |
| ComingSoonGuard | `client/src/components/ComingSoonGuard.tsx` | Refactor to SiteModeGuard |
| ComingSoon page component | `client/src/pages/ComingSoon.tsx` | Keep for reference, parts reused in Waitlist |
| Frontend API client | `client/src/services/api.ts` lines 2670-2697 | Update return type |
| PublicLayout | `client/src/components/layout/PublicLayout.tsx` (437 lines) | Modify header + footer |
| Home page | `client/src/pages/public/Home.tsx` | Modify hero CTAs |
| Blog post detail | `client/src/pages/blog/PostDetailPage.tsx` | Add BlogCTA |
| App router | `client/src/App.tsx` | Add routes, wrap with provider |
| Brand guidelines | `docs/BRAND_GUIDELINES.md` | Reference for all new components |
| Early access success page | `client/src/pages/auth/EarlyAccessSuccess.tsx` | Reference for EA flow |
| Admin EA page | `client/src/pages/admin/AdminEarlyAccess.tsx` | Reference for EA management |

---

## Verification Checklist

### Waitlist Mode
- [ ] All public pages load (Home, About, Services, Blog, Contact)
- [ ] Pricing page redirects to `/`
- [ ] Pricing link hidden from nav
- [ ] All CTAs say "Join the Waitlist"
- [ ] `/waitlist` page loads with email capture form
- [ ] Email signup works (appears in admin coming-soon signups)
- [ ] Blog posts have waitlist CTA at bottom
- [ ] Dashboard/app routes are blocked
- [ ] Admin routes still work
- [ ] No "Sign In" button in header

### Early Access Mode
- [ ] All public pages load including Pricing
- [ ] CTAs say "Join Early Access"
- [ ] "Sign In" button visible in header
- [ ] EA registration link works (`/register?ea=email`)
- [ ] Existing EA users can sign in and access the app
- [ ] Non-EA users who somehow register cannot access dashboard
- [ ] Blog posts have EA CTA at bottom
- [ ] Admin routes still work

### Live Mode
- [ ] Everything works exactly as before
- [ ] No mode-specific UI changes visible
- [ ] Standard "Get Started" / "Sign In" CTAs

### Cross-cutting
- [ ] Mobile responsive in all 3 modes
- [ ] SEO meta tags present on all public pages
- [ ] Dark mode works in all 3 modes
- [ ] Admin can switch modes via dropdown
- [ ] Mode change takes effect within 60 seconds (cache TTL)
