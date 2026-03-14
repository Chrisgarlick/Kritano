# pagepulser Rebrand Plan

## Overview

This document outlines the complete plan for rebranding from **Audit Armour** to **pagepulser** across the entire codebase, infrastructure, and business materials. This should also include changing the name of the database and any references to it in the worker logs etc.

**Scope**: 40+ files across 16 categories

---

## Phase 1: Design System Foundation

### 1.1 Install Custom Fonts

**File:** `client/index.html`

```html
<!-- Add to <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### 1.2 Update Tailwind Configuration

**File:** `client/tailwind.config.js`

Replace the current minimal config with full brand tokens:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary: Indigo (replacing blue)
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Accent: Amber
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      fontFamily: {
        display: ['Instrument Serif', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 40px rgba(99, 102, 241, 0.15)',
        'glow-accent': '0 0 40px rgba(251, 191, 36, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
```

### 1.3 Update Global Styles

**File:** `client/src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Brand Colors */
  --color-primary: #4f46e5;
  --color-primary-light: #6366f1;
  --color-primary-dark: #4338ca;
  --color-accent: #fbbf24;
  --color-accent-dark: #f59e0b;

  /* Typography */
  --font-display: 'Instrument Serif', serif;
  --font-body: 'Outfit', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Transitions */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
}

body {
  @apply bg-slate-50 text-slate-800 antialiased;
  font-family: var(--font-body);
}

/* Utility classes */
.font-display {
  font-family: var(--font-display);
}

/* Existing animations... */
@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.animate-slide-in {
  animation: slide-in 300ms ease-out;
}

/* Print utilities */
@media print {
  .no-print { display: none !important; }
  .print-break { page-break-before: always; }
}
```

### 1.4 Update Design Tokens

**File:** `client/src/utils/constants.ts`

Update color references to use new primary/accent naming:

```typescript
// Status colors (keep semantic, update if using primary)
export const STATUS_COLORS = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  processing: { bg: 'bg-primary-100', text: 'text-primary-800', border: 'border-primary-200' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  failed: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  cancelled: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
};

// Category colors (update purple to violet for SEO)
export const CATEGORY_COLORS = {
  seo: { bg: 'bg-violet-100', text: 'text-violet-800', icon: 'text-violet-500' },
  accessibility: { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: 'text-emerald-500' },
  security: { bg: 'bg-red-100', text: 'text-red-800', icon: 'text-red-500' },
  performance: { bg: 'bg-sky-100', text: 'text-sky-800', icon: 'text-sky-500' },
};
```

---

## Phase 2: Brand Name Updates

### 2.1 Package Files

| File | Change |
|------|--------|
| `package.json` | `"name": "pagepulser"` |
| `client/package.json` | `"name": "pagepulser-client"` |
| `server/package.json` | `"name": "pagepulser-server"`, description update |

### 2.2 HTML & Meta Tags

**File:** `client/index.html`

```html
<title>pagepulser - See What Others Miss</title>
<meta name="description" content="pagepulser reveals hidden SEO, accessibility, security, and performance issues on your website. See what others miss." />
```

### 2.3 React Components

| File | Line | Change |
|------|------|--------|
| `client/src/pages/Home.tsx` | 14 | `AuditArmor` → `pagepulser` |
| `client/src/pages/Home.tsx` | 96 | Footer copyright → `pagepulser` |
| `client/src/pages/auth/Login.tsx` | 8 | `AuditArmor` → `pagepulser` |
| `client/src/pages/auth/Register.tsx` | 8 | `AuditArmor` → `pagepulser` |
| `client/src/pages/auth/RegisterSuccess.tsx` | 13 | `AuditArmor` → `pagepulser` |
| `client/src/components/layout/DashboardLayout.tsx` | 59 | Logo text → `pagepulser` |
| `client/src/pages/invitations/AcceptInvitation.tsx` | 140 | `AuditArmor` → `pagepulser` |
| `client/src/pages/settings/ApiKeys.tsx` | 126, 139 | `Audit Armour` → `pagepulser` |

### 2.4 LocalStorage Keys

**File:** `client/src/contexts/OrganizationContext.tsx`

```typescript
const STORAGE_KEY = 'pagepulser-current-org';
```

---

## Phase 3: Backend Updates

### 3.1 User Agent Strings

All crawler identification needs updating:

| File | Line(s) | New Value |
|------|---------|-----------|
| `server/src/types/spider.types.ts` | 21 | `'pagepulser/1.0 (+https://pagepulser.io/bot)'` |
| `server/src/routes/audits/index.ts` | 364 | `'pagepulser/1.0 (URL Check)'` |
| `server/src/services/queue/audit-worker.service.ts` | 45, 1133, 1148 | `'pagepulser/1.0 (+https://pagepulser.io/bot)'` |
| `server/src/services/spider/sitemap-parser.service.ts` | 32 | `'pagepulser/1.0'` |
| `server/src/services/spider/robots-parser.service.ts` | 17, 256 | `'pagepulser'` |
| `server/src/services/spider/coordinator.service.ts` | 17 | `'pagepulser/1.0 (+https://pagepulser.io/bot)'` |
| `server/src/services/audit-engines/security.engine.ts` | 623, 639, 676 | `'pagepulser/1.0 Security Scanner'` |

### 3.2 Email Service

**File:** `server/src/services/email.service.ts`

Update all brand references:

```typescript
// Line 23
this.fromAddress = process.env.EMAIL_FROM || 'pagepulser <noreply@pagepulser.io>';

// Line 124 - Verification email subject
const subject = 'Verify your pagepulser account';

// Line 134 - Email header
<h1 style="color: #4f46e5; margin: 0;">pagepulser</h1>

// Line 139 - Welcome text
<p>Welcome to pagepulser! Please verify your email address...</p>

// Line 152 - Footer
<p>If you didn't create an account with pagepulser...</p>

// Line 166 - Password reset
const subject = 'Reset your pagepulser password';

// Update all email headers to use indigo-600 (#4f46e5) instead of blue
```

### 3.3 JWT Configuration

**File:** `server/src/config/auth.config.ts`

```typescript
issuer: 'pagepulser.io',
audience: 'pagepulser-api',
```

### 3.4 API Responses

**File:** `server/src/index.ts`

```typescript
// Line 81
res.json({ status: 'ok', service: 'pagepulser', timestamp: new Date().toISOString() });

// Line 87
name: 'pagepulser API',

// Line 153
console.log(`👁️  pagepulser server running on http://localhost:${port}`);
```

### 3.5 Worker Process

**File:** `server/src/worker.ts`

```typescript
// Line 2
* pagepulser Worker Process

// Line 264
console.log('👁️  pagepulser Worker');
```

### 3.6 PDF Reports

**File:** `server/src/routes/audits/index.ts`

```typescript
// Line 1108
Author: 'pagepulser',

// Line 1110
Creator: 'pagepulser'

// Line 1523
doc.text('Generated by pagepulser', ...)
```

### 3.7 API Documentation

**File:** `server/src/routes/docs/index.ts`

Multiple updates needed:
- Page title: `API Documentation | pagepulser`
- Meta description
- All brand text references
- Update primary color from `#2563eb` to `#4f46e5`
- Footer copyright

---

## Phase 4: Infrastructure Updates

### 4.1 Docker Compose

**File:** `docker-compose.yml`

```yaml
services:
  db:
    container_name: pagepulser-db
    environment:
      POSTGRES_USER: pagepulser
      POSTGRES_PASSWORD: pagepulser_dev_password
      POSTGRES_DB: pagepulser
```

### 4.2 Environment Files

**File:** `server/.env.example`

```bash
DATABASE_URL=postgresql://pagepulser:pagepulser_dev_password@localhost:5433/pagepulser
EMAIL_FROM=pagepulser <noreply@yourdomain.com>
```

**File:** `server/.env`

```bash
DATABASE_URL=postgresql://pagepulser:pagepulser_dev_password@localhost:5433/pagepulser
EMAIL_FROM=pagepulser <noreply@yourdomain.com>
```

### 4.3 CLI Helper Script

**File:** `aa` → Rename to `ss` (pagepulser)

```bash
#!/bin/bash

# pagepulser CLI helper

DB_CONTAINER="pagepulser-db"
DB_USER="pagepulser"
DB_NAME="pagepulser"

# Update all echo messages
echo "Starting pagepulser..."
echo "pagepulser is ready!"
echo "Stopping pagepulser..."
echo "Resetting pagepulser (deleting all data)..."
echo "pagepulser CLI"
```

### 4.4 Database Schema Comment

**File:** `server/src/db/schema.sql`

```sql
-- pagepulser Database Schema
```

---

## Phase 5: Documentation Updates

### 5.1 Main Documentation Files

| File | Change |
|------|--------|
| `PROJECT.md` | `AuditArmor` → `pagepulser` throughout |
| `DEVELOPMENT.md` | Update all references, container names |
| `docs/SCRAPER_V1.md` | Header update |
| `docs/SCRAPER_V2.md` | Header update, CLI examples |
| `docs/SCRAPER_V3.md` | User-Agent references |
| `docs/SCRAPER_V4.md` | User-Agent references |
| `docs/COMPETITORS.md` | Header update |
| `docs/RESTRUCTURE.md` | All references |
| `docs/INNOVATION.md` | All references, CLI package names |
| `docs/TEAM.md` | All references, token examples |

### 5.2 Package Lock Files

After all changes, regenerate:
```bash
rm -rf node_modules package-lock.json
rm -rf client/node_modules client/package-lock.json
rm -rf server/node_modules server/package-lock.json
npm install
cd client && npm install
cd server && npm install
```

---

## Phase 6: Brand Assets

### 6.1 Create Logo Assets

Required files to create:

```
client/public/
├── favicon.ico                    # 16x16, 32x32, 48x48 multi-size
├── favicon-16x16.png
├── favicon-32x32.png
├── apple-touch-icon.png           # 180x180
├── android-chrome-192x192.png
├── android-chrome-512x512.png
├── og-image.png                   # 1200x630
├── twitter-card.png               # 1200x600
├── logo.svg                       # Full logo
└── site.webmanifest               # PWA manifest

client/src/assets/
├── logo-full.svg                  # Full logo with wordmark
├── logo-icon.svg                  # Icon only
├── logo-wordmark.svg              # Wordmark only
├── logo-full-dark.svg             # For dark backgrounds
└── logo-icon-dark.svg
```

### 6.2 Web Manifest

**File:** `client/public/site.webmanifest`

```json
{
  "name": "pagepulser",
  "short_name": "pagepulser",
  "description": "See What Others Miss",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#4f46e5",
  "background_color": "#f8fafc",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## Phase 7: Database Migration

### 7.1 Rename Database (Development)

```bash
# Stop services
docker-compose down

# Update docker-compose.yml with new names

# Remove old volume (WARNING: deletes data)
docker volume rm audit-armour_postgres_data

# Start with new names
docker-compose up -d
```

### 7.2 Production Migration

For production, data migration required:
1. Backup existing database
2. Create new database with new name
3. Restore data to new database
4. Update connection strings
5. Deploy updated application

---

## Implementation Order

### Step 1: Design Foundation (Low Risk)
1. Update `tailwind.config.js`
2. Update `index.css`
3. Update `constants.ts`
4. Add font imports to `index.html`

### Step 2: Frontend Brand Text (Medium Risk)
5. Update all React component brand text
6. Update HTML title and meta tags
7. Update localStorage keys

### Step 3: Backend Configuration (Medium Risk)
8. Update email service
9. Update API responses
10. Update JWT config
11. Update user agent strings

### Step 4: Infrastructure (Higher Risk - Requires Restart)
12. Update docker-compose.yml
13. Update environment files
14. Rename CLI script
15. Reset/migrate database

### Step 5: Documentation
16. Update all markdown files
17. Regenerate package-lock files

### Step 6: Assets
18. Create logo assets
19. Create favicon package
20. Create OG/social images
21. Add web manifest

---

## Verification Checklist

### Visual Verification
- [ ] Logo displays correctly in header
- [ ] Favicon shows in browser tab
- [ ] Colors match brand guidelines (indigo primary, amber accent)
- [ ] Fonts load correctly (Instrument Serif, Outfit, JetBrains Mono)
- [ ] Email templates render with correct branding

### Functional Verification
- [ ] Login/register flows work
- [ ] Audit creation works
- [ ] PDF reports generate with correct branding
- [ ] API documentation accessible
- [ ] JWT tokens validate correctly

### Infrastructure Verification
- [ ] Database connects with new credentials
- [ ] Docker containers start correctly
- [ ] CLI script (`pp`) works
- [ ] Email sending works

### SEO/External Verification
- [ ] robots.txt mentions correct bot name
- [ ] User-Agent strings correct in crawl logs
- [ ] OG images render in social previews
- [ ] Site manifest works for PWA

---

## Rollback Plan

If issues arise:

1. **Git**: All changes should be in a single branch, easy to revert
2. **Database**: Keep backup before migration
3. **Docker**: Old container names still work if not removed
4. **DNS**: pagepulser.io and auditarmor.io can both point to same infrastructure during transition

---

## Timeline Estimate

| Phase | Effort |
|-------|--------|
| Design Foundation | 1-2 hours |
| Frontend Brand Text | 2-3 hours |
| Backend Configuration | 2-3 hours |
| Infrastructure | 1-2 hours |
| Documentation | 1-2 hours |
| Assets Creation | 4-6 hours (logo design) |
| Testing | 2-3 hours |
| **Total** | **13-21 hours** |

---

## Files Summary

### Total Files to Modify: 45+

**Client (16 files)**
- `package.json`
- `index.html`
- `tailwind.config.js`
- `src/index.css`
- `src/utils/constants.ts`
- `src/pages/Home.tsx`
- `src/pages/auth/Login.tsx`
- `src/pages/auth/Register.tsx`
- `src/pages/auth/RegisterSuccess.tsx`
- `src/pages/settings/ApiKeys.tsx`
- `src/pages/invitations/AcceptInvitation.tsx`
- `src/components/layout/DashboardLayout.tsx`
- `src/contexts/OrganizationContext.tsx`
- `public/site.webmanifest` (new)
- Various asset files (new)

**Server (15 files)**
- `package.json`
- `src/index.ts`
- `src/worker.ts`
- `src/config/auth.config.ts`
- `src/services/email.service.ts`
- `src/services/queue/audit-worker.service.ts`
- `src/services/spider/sitemap-parser.service.ts`
- `src/services/spider/robots-parser.service.ts`
- `src/services/spider/coordinator.service.ts`
- `src/services/audit-engines/security.engine.ts`
- `src/routes/audits/index.ts`
- `src/routes/docs/index.ts`
- `src/types/spider.types.ts`
- `src/db/schema.sql`
- `.env.example`, `.env`

**Root (14 files)**
- `package.json`
- `docker-compose.yml`
- `aa` → `ss` (rename)
- `PROJECT.md`
- `DEVELOPMENT.md`
- `docs/SCRAPER_V1.md`
- `docs/SCRAPER_V2.md`
- `docs/SCRAPER_V3.md`
- `docs/SCRAPER_V4.md`
- `docs/COMPETITORS.md`
- `docs/RESTRUCTURE.md`
- `docs/INNOVATION.md`
- `docs/TEAM.md`
- `docs/BRAND_GUIDELINES.md` (already created)
