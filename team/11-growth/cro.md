# CRO Recommendations -- Kritano

---

## Priority 1: Registration Page

**Hypothesis:** Adding social proof and a clearer value proposition to the registration page will increase visitor-to-registration conversion.

**Current state:** Email + password form. Minimal context.

**Recommended changes:**
1. Add a one-line value prop above the form: "See your website's accessibility, SEO, security, and performance scores in under 2 minutes."
2. Add social proof below the form: "Join [X] website owners who've run [X] audits"
3. Add trust signals: "Free forever. No credit card required."
4. Add a sample score preview (screenshot of a real audit result, blurred)

**Success metric:** Registration rate (visitors to /register who complete signup)
**Test:** A/B test current vs. enhanced registration page

---

## Priority 2: Activation (Registration to First Audit)

**Hypothesis:** A guided onboarding checklist will increase the percentage of registered users who complete their first audit.

**Current state:** Users land on empty dashboard with no guidance.

**Recommended changes:**
1. Onboarding checklist (see activation.md for full spec)
2. Empty state with clear CTA and sample audit link
3. Auto-focus the "Add Site" input on first login

**Success metric:** % of registered users who complete first audit within 24 hours
**Target:** 60% (up from estimated 40%)
**Test:** Before/after (not A/B -- just ship it, it's clearly better)

---

## Priority 3: Free-to-Paid Conversion

**Hypothesis:** Enabling auto-send on trial expiry emails and adding upgrade prompts at natural moments will increase trial-to-paid conversion.

**Current state:** Trial expiry triggers exist but are set to SKIP_AUTO_SEND. Upgrade prompts appear when users hit tier limits.

**Recommended changes:**
1. Enable auto-send on `trial_expiring` and `trial_expired` triggers
2. Add upgrade prompt after first audit results (subtle: "Want to see how to fix these? Upgrade to see remediation guidance")
3. Add comparison table on pricing page showing specifically what the user has used that they'd lose on downgrade
4. Add a "recommended plan" based on actual usage patterns

**Success metric:** Trial-to-paid conversion rate
**Target:** 5% within 90 days of the changes
**Test:** Enable emails first (lowest effort), then add contextual prompts

---

## Priority 4: Landing Page Optimisation

**Hypothesis:** The landing page can better convert organic traffic by matching search intent.

**Recommended changes:**
1. Create intent-specific landing pages: /free-website-audit, /accessibility-audit, /seo-audit
2. Each page focuses on one pillar with relevant copy, then reveals "plus 5 more dimensions"
3. Inline "enter your URL" widget on landing pages (run audit without registering first)

**Success metric:** Landing page to registration conversion rate
**Target:** 5-8% (typical for free tool landing pages)
**Test:** Build one landing page (/free-website-audit), measure, then replicate

---

## Priority 5: Pricing Page

**Hypothesis:** Users who visit the pricing page but don't convert can be recovered with better information architecture.

**Recommended changes:**
1. Highlight the most popular plan
2. Add "You're currently using: [X] of [Y] audits, [X] of [Y] sites" for logged-in users
3. Add a feature comparison table (not just plan names)
4. Add FAQ section addressing common objections
5. Add testimonials from users at each tier level

**Success metric:** Pricing page to checkout conversion rate
**Test:** Implement changes incrementally, measure each
