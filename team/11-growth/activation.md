# Activation Strategy -- Kritano

---

## The "Aha Moment"

**Definition:** The user completes their first audit and sees their scores across all six pillars.

**Why this is the aha moment:** This is when the user goes from "I wonder how my site is doing" to "Oh, I had no idea about these issues." The score reveal is the emotional hook. Everything before this is friction. Everything after this is retention.

**Time-to-aha target:** Under 3 minutes from registration to seeing first audit results.

---

## Current Activation Funnel (As Built)

```
Register -> Verify Email -> Add First Site -> Run First Audit -> View Results -> Verify Domain
```

**Current friction points:**
1. No guided onboarding after registration -- user lands on empty dashboard
2. No "what to do next" guidance after email verification
3. Domain verification is optional but shown prominently, which may confuse users who just want to try the tool
4. No celebration or highlight when first audit completes

---

## Recommended Onboarding Checklist (HIGH PRIORITY -- Build This)

Add a persistent checklist to the dashboard that appears for new users:

```
Welcome to Kritano! Let's get your first audit running.

[x] Create your account
[ ] Verify your email (check your inbox)
[ ] Add your first website
[ ] Run your first audit (takes ~60 seconds)
[ ] Review your results
[ ] (Optional) Verify domain ownership for full features
```

**Behaviour:**
- Checklist appears on dashboard until all required steps are complete
- Each completed step shows a green tick and brief congratulations
- "Run your first audit" step should auto-redirect to the audit in progress with a progress indicator
- After first audit completes: celebration moment (confetti? score reveal animation?) + prompt to explore results
- Checklist can be dismissed after first audit is viewed but remains accessible

**Expected impact:** 20-40% improvement in registration-to-first-audit conversion.

---

## Empty State Design

**Current:** Empty table when no sites added
**Recommended:** Replace with a clear CTA:

```
-----------------------------------------------
|                                               |
|   Your dashboard is waiting for its first     |
|   website. Add one and we'll audit it in      |
|   under 60 seconds.                           |
|                                               |
|   [ Add Your First Website ]                  |
|                                               |
|   Not sure what to expect? See a sample audit |
|                                               |
-----------------------------------------------
```

The "See a sample audit" link shows a demo audit result so users know what they'll get before committing.

---

## Welcome Email Sequence

| Timing | Subject | Purpose |
|--------|---------|---------|
| Immediate | "Welcome -- run your first audit in 60 seconds" | Drive first audit |
| +24h (if no audit) | "Your website audit is waiting" | Nudge inactive |
| +72h (if no audit) | "Most sites score between 40 and 60 -- where's yours?" | Curiosity hook |
| +24h (after first audit) | "Here's what your scores mean" | Educate on results |
| +72h (after first audit) | "3 quick wins from your audit results" | Drive action on findings |

---

## Progress Mechanics

1. **Score improvement tracking:** Show before/after scores when users re-audit
2. **Issue resolution counter:** "You've fixed 12 of 47 issues" with progress bar
3. **Milestone notifications:** "Your accessibility score just hit 80 -- that's better than 73% of sites we've audited"
4. **Weekly digest email:** Summary of any score changes, new issues found on scheduled audits
