# The Website Launch Checklist

Don't ship a broken site. The 65-check pre-launch audit Kritano runs automatically.

This is the checklist agencies print and run with clients in the final week before launch, and the one developers grep through the night before going live. Each item is a concrete check, not a discussion topic. Mark items off only when you have actually verified them.

The structure follows the launch timeline: pre-launch (T minus 7 days), launch day, and post-launch (T plus 24 hours and T plus 7 days). Items marked **[critical]** are blockers; do not flip the DNS until they are green.

### Contents

1. Pre-launch: T minus 7 days
2. Pre-launch: T minus 1 day
3. Launch day
4. Post-launch: T plus 24 hours
5. Post-launch: T plus 7 days
6. Post-launch: Ongoing
7. How to use this checklist

## Pre-launch: T minus 7 days

### Domain and DNS

- [ ] **[critical]** Production domain is registered to the client (not to the agency).
- [ ] DNS provider is access-controlled and the client has the keys.
- [ ] TLS certificate is provisioned and tested on the production host with the production domain (not staging).
- [ ] Both `www` and apex resolve correctly; one redirects to the other (consistently — pick a canonical and stick to it).
- [ ] `https://` is the default. HTTP traffic 301-redirects to HTTPS.
- [ ] DNSSEC enabled if the registrar supports it.
- [ ] DMARC, SPF, and DKIM records are in place if the domain sends email.

### Content audit

- [ ] **[critical]** Every published page passes a final proofread.
- [ ] No lorem ipsum, no placeholder image, no "TODO" comments visible in the page source.
- [ ] All links resolve. Run a link checker against the staging environment.
- [ ] All images load. Check for broken `<img src>` and missing CDN paths.
- [ ] Author pages exist for every named byline.
- [ ] Privacy policy, terms of service, and cookie policy are up to date and accessible from the footer of every page.

### SEO foundations

- [ ] **[critical]** `robots.txt` allows production crawling (NOT the staging-mode `Disallow: /`).
- [ ] `sitemap.xml` exists, references the production domain, and is submitted to Google Search Console.
- [ ] Every page has a unique `<title>` and `<meta name="description">`.
- [ ] Canonical URLs are set and use the production domain.
- [ ] Schema.org JSON-LD is present where appropriate (Article, FAQPage, Organization, LocalBusiness).
- [ ] Open Graph and Twitter card metadata are set for shareable pages.
- [ ] Test the OG image rendering with the Facebook Sharing Debugger and Twitter Card Validator.
- [ ] Google Search Console property is verified and connected.
- [ ] Bing Webmaster Tools registered (optional but easy).

### Performance

- [ ] **[critical]** Largest Contentful Paint is under 2.5s on a mobile device on a 4G connection.
- [ ] Interaction to Next Paint is under 200ms.
- [ ] Cumulative Layout Shift is under 0.1.
- [ ] Above-the-fold images have `loading="eager"` and `fetchpriority="high"`; everything else is `loading="lazy"`.
- [ ] Images are served in WebP or AVIF with appropriate fallbacks.
- [ ] Every image has explicit `width` and `height` attributes (or `aspect-ratio` CSS).
- [ ] Fonts are preloaded with `<link rel="preload" as="font">` and use `font-display: swap`.
- [ ] Render-blocking JavaScript is deferred or async.
- [ ] First-party CSS is minified and critical CSS is inlined where it materially affects FCP.
- [ ] A CDN serves static assets.

### Accessibility

- [ ] **[critical]** Run an automated accessibility scan against every template. Aim for zero violations on the homepage and the top three traffic pages.
- [ ] Every interactive element is keyboard-operable.
- [ ] Focus indicators are visible and pass 3:1 contrast.
- [ ] Skip-to-content link is the first focusable element on every page.
- [ ] Forms have proper labels and error messages.
- [ ] Page works at 200% zoom and at 320px viewport width without horizontal scroll.
- [ ] `<html lang>` is set on every page.
- [ ] Test with at least one screen reader (NVDA or VoiceOver) on the homepage and a form page.

### Security

- [ ] **[critical]** HSTS header is set with `max-age=31536000; includeSubDomains; preload` (after confirming all subdomains support HTTPS).
- [ ] `Content-Security-Policy` is set, scoped tightly, and contains no `unsafe-inline` for scripts.
- [ ] `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` are set.
- [ ] No mixed content. Every asset loads over HTTPS.
- [ ] Admin URLs, staging URLs, and any test endpoints are blocked or removed from production.
- [ ] Authentication endpoints are rate-limited.
- [ ] Session cookies have `Secure`, `HttpOnly`, and `SameSite=Lax` (or stricter).
- [ ] No public dependency manifests (`package.json`, `composer.lock`) accessible at the document root.

### Analytics and tracking

- [ ] Analytics tool of choice (GA4, Plausible, Fathom, etc.) is installed and firing on the production domain.
- [ ] Test event is visible in the dashboard.
- [ ] Cookie consent banner is shown before any non-essential tracking loads.
- [ ] "Reject all" is as easy as "Accept all". One-click reject is the standard.
- [ ] Server-side analytics (if used) are scoped to production traffic only.

### Backups and recovery

- [ ] **[critical]** A full backup of the production database has been taken and a restore has been tested in the last 7 days.
- [ ] Backup destination is geographically separate from production.
- [ ] Application code is in version control with the launch commit tagged.
- [ ] Rollback plan is documented and ready: how to revert DNS, how to restore the previous code, how to restore the database.
- [ ] On-call rota is set for the launch window.

## Pre-launch: T minus 1 day

### Final checks

- [ ] **[critical]** Final smoke test on a real production-like environment (same DNS, same TLS, same database). Not staging.
- [ ] All forms submit. Test the contact form end to end (a real email arrives).
- [ ] Payment flow tested with real card in a small charge (refund immediately).
- [ ] Account creation works. Test creating a new account and signing in.
- [ ] Password reset works. Email arrives within 60 seconds.
- [ ] Search works (if applicable). Try a non-trivial query.
- [ ] Any internal scheduled jobs (cron, queue workers) are running.
- [ ] Logs are flowing to the logging service.
- [ ] Errors are flowing to the error-tracking service (Sentry or similar). Force one to confirm.
- [ ] Uptime monitoring is set up and pinging the production URL.

### Communication

- [ ] Client knows what time the DNS flip happens.
- [ ] Client knows the rollback plan and who to call.
- [ ] If the launch is announced publicly, the announcement copy and channels are queued.
- [ ] If users are migrating from an old site, the migration email is drafted and ready to send.

## Launch day

### Pre-flight (1 hour before flip)

- [ ] **[critical]** Final database backup taken right before the flip.
- [ ] Confirmation that staging matches production code commit exactly.
- [ ] All caches purged (CDN, app cache, browser cache test on a fresh device).
- [ ] DNS TTL has been lowered to 5 minutes for at least 24 hours so the flip propagates quickly.

### The flip

- [ ] DNS A or CNAME record updated.
- [ ] Confirm propagation from at least three geographic regions (use a DNS-checker tool).
- [ ] Open the production URL in an incognito window from a phone on cellular. Site loads, looks right, no errors.

### First hour post-flip

- [ ] Error rate is normal (compare to staging baseline).
- [ ] Response times are normal.
- [ ] Analytics is recording traffic.
- [ ] No surge of 404s (a few are normal; hundreds suggest a routing problem).
- [ ] Search console is not flagging crawl errors.

## Post-launch: T plus 24 hours

- [ ] **[critical]** Re-run the full Kritano scan against the production domain. Compare to staging scan.
- [ ] Submit the updated sitemap to Google Search Console.
- [ ] Submit to Bing Webmaster Tools (if applicable).
- [ ] Check for any new errors in the error-tracking dashboard.
- [ ] Check uptime monitoring history. Aim for zero downtime in the first 24 hours.
- [ ] Spot-check the top 10 most important pages from a mobile device and a desktop.
- [ ] Verify analytics is recording the day's traffic accurately.
- [ ] Verify form submissions are arriving where expected.
- [ ] Restore DNS TTL to its previous value (typically 1 hour or longer).

## Post-launch: T plus 7 days

- [ ] Run a full audit again. New issues that appeared once the site got real traffic.
- [ ] Check Core Web Vitals on real-user data (Search Console > Page experience).
- [ ] Review error-tracking volume and triage anything that appears more than once.
- [ ] Check analytics for traffic anomalies (a big drop suggests a routing or canonical issue; a big spike could be a launch-day bot).
- [ ] Confirm Google has indexed at least the homepage and the top 5 pages.
- [ ] Review accessibility complaints if any have come in.
- [ ] Run a fresh database backup.
- [ ] Document any issues for the next launch.

## Post-launch: Ongoing

A site is a living artefact, not a finished project. Keep these on the calendar.

- [ ] **Weekly:** Kritano scan, review delta from last week, fix anything that turned red.
- [ ] **Monthly:** Review uptime, performance trends, and Core Web Vitals on real-user data.
- [ ] **Quarterly:** Full audit, accessibility statement refresh, dependency audit.
- [ ] **Annually:** Penetration test on production. Review the launch checklist against current technologies; some checks will be outdated.

## How to use this checklist

1. Print it. Mark items off in pen on a real sheet. This is more reliable than a project-management tool because you cannot resolve an item with a click.
2. Assign each section to one person. Multiple owners means none.
3. The **[critical]** items are non-negotiable. If one is red on launch day, the launch slips.
4. Bring the marked-up sheet to the launch retrospective. It is a remarkable artefact for the next launch and a defensible record of what was checked.

## How Kritano helps

Kritano automates roughly 70 of these checks. It runs them on schedule, surfaces the differences from last week, and flags any item that flips from green to red. The remaining items are operational (backups, on-call, communication) and require a human running them.

For new sites, set up a Kritano scan on staging as soon as you have a working build. Make it part of CI for the parts that can be automated; make it part of the launch ritual for the rest.

[Start a free scan at kritano.com](https://kritano.com).
