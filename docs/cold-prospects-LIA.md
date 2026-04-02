# Legitimate Interest Assessment (LIA) — Cold Prospect Outreach

> **Data Controller**: Kritano
> **Assessment Date**: 14 March 2026
> **Assessor**: [Name / Role]
> **Review Date**: 14 September 2026 (6-monthly review)
> **Status**: Draft — requires sign-off

---

## 1. Overview

This Legitimate Interest Assessment covers Kritano's cold prospect outreach pipeline, which identifies newly registered domains, extracts publicly available business contact information, and sends outreach emails offering website auditing services.

### Processing Activity Summary

| Item | Detail |
|------|--------|
| **Data subjects** | Businesses operating newly registered domains (not individuals) |
| **Personal data processed** | Generic/role-based business email (e.g. info@, hello@, support@), domain, technology stack, business type, country |
| **Source of data** | Publicly available: WHOIS data services (e.g. WhoisDS), website contact pages, meta tags |
| **Lawful basis relied upon** | Legitimate interest — GDPR Article 6(1)(f) |
| **Processing purpose** | B2B marketing outreach to offer website accessibility and SEO auditing services |
| **Data storage** | `cold_prospects` table in PostgreSQL database |
| **Retention period** | 6 months from collection if no engagement; deleted immediately on opt-out |
| **Volume** | 10–20 emails per day; maximum 1 email per domain |
| **Email targeting** | Generic/role-based addresses only (info@, hello@, support@, contact@). Named personal emails are excluded. |

---

## 2. Part One — Purpose Test

> *Is there a legitimate interest behind the processing?*

### **Yes.** Kritano has a legitimate commercial interest in:

1. **Business growth** — Reaching potential customers who have recently launched websites and may benefit from accessibility auditing, SEO analysis, and compliance checking.

2. **Promoting accessibility compliance** — Many new website owners are unaware of WCAG requirements and legal obligations (e.g. Equality Act 2010 in the UK, European Accessibility Act). Informing them serves a public benefit.

3. **Timely relevance** — Newly registered domains represent website owners at the point where auditing is most valuable (during initial build/launch), making the outreach genuinely useful rather than speculative.

### Is the interest legitimate?

- It is a standard, lawful B2B marketing activity
- It does not involve any illegal, unethical, or deceptive purpose
- It aligns with reasonable commercial practice in the SaaS industry
- There is a genuine benefit to the data subject (awareness of accessibility obligations)

**Conclusion: Purpose test — PASSED**

---

## 3. Part Two — Necessity Test

> *Is the processing necessary to achieve the purpose? Could the purpose be achieved in a less intrusive way?*

### Why this processing is necessary

- To contact business website owners about auditing services, we need a way to identify and reach them
- Newly registered domains are a strong signal of a business launching a website
- Email is the most direct and cost-effective channel for B2B outreach
- Contact details are extracted from publicly available sources (the website's own contact page, meta tags, and social links)

### Less intrusive alternatives considered

| Alternative | Assessment |
|-------------|------------|
| **Paid advertising (Google/social)** | Used in parallel, but doesn't reach business owners at the specific moment of domain registration. Not a replacement. |
| **Content marketing / SEO** | Used in parallel, but passive — relies on prospects finding us. Doesn't serve the time-sensitive nature of new domain launches. |
| **Partnerships / referrals** | Limited scale; doesn't cover the breadth of newly launched websites. |
| **Consent-based collection only** | Not feasible — we cannot ask consent from someone we haven't yet contacted. This is the inherent bootstrapping problem with B2B outreach. |

### Data minimisation

We collect only:
- Contact email (necessary to send the outreach)
- Contact name (necessary for personalisation / professional courtesy)
- Contact role (necessary to ensure we're reaching a relevant person)
- Domain and basic site metadata (necessary to personalise the audit offer)

We do **not** collect:
- Personal browsing history
- Social media activity beyond public profile links
- Financial information
- Any data from behind authentication
- Data about individuals' personal lives

**Conclusion: Necessity test — PASSED (with data minimisation applied)**

---

## 4. Part Three — Balancing Test

> *Do the individual's interests, rights, and freedoms override the legitimate interest?*

### Factors in favour of processing

| Factor | Assessment |
|--------|------------|
| **Nature of data** | Generic/role-based business email addresses (info@, hello@, support@) — not personal email addresses, not sensitive/special category data |
| **Source** | Publicly published by the business on their own website |
| **Data subject expectations** | Businesses that publish generic contact addresses expect to receive business enquiries — that is the explicit purpose of these addresses |
| **Relationship** | While there's no prior relationship, the outreach is directly relevant to their activity (launching a website) |
| **Impact on individual** | Negligible — a single email to a generic business inbox about a relevant service |
| **Vulnerable individuals** | Not targeting vulnerable individuals; B2B context only; no personal email addresses |
| **Volume per individual** | Single email per domain; 10–20 total emails per day across all prospects |
| **Personal data question** | Role-based emails (info@, hello@) are arguably **not personal data** under GDPR, as they do not identify a natural person. This significantly reduces the privacy impact. We apply GDPR safeguards regardless as a precaution. |

### Factors against processing

| Factor | Assessment | Mitigation |
|--------|------------|------------|
| **No prior relationship** | The business hasn't interacted with Kritano before | First email clearly states who we are, where we got their details, and how to opt out |
| **Automated collection** | Domain data is collected automatically | Very low volume (10–20/day); quality-filtered; only generic business emails targeted |
| **Cross-border processing** | Prospects may be in any jurisdiction | We respect GDPR regardless of location; filter by country where possible |
| **Sole traders** | Some "businesses" may be sole traders with full consumer GDPR protection | Mitigated by targeting generic mailboxes (info@, hello@) rather than named personal emails. A sole trader's info@ is still a business address. |
| **Email tracking** | We track opens and clicks | Standard B2B practice; disclosed in email footer; used only to measure campaign effectiveness |

### Safeguards implemented

1. **Generic addresses only**: We exclusively target role-based email addresses (info@, hello@, support@, contact@). Named personal email addresses (e.g. john@, j.smith@) are filtered out and never contacted. This is the single most important safeguard — it means we are almost certainly not processing personal data at all.

2. **Minimal volume**: 10–20 emails per day total. This is not mass email marketing — it is low-volume, targeted business outreach.

3. **Single contact per domain**: Each domain receives a maximum of 1 email. No follow-ups, no drip sequences, no repeated contact.

4. **Transparent first contact**: The email includes:
   - Clear identification of Kritano as the sender
   - How we found their contact details ("We noticed you recently launched [domain]")
   - A clear, prominent unsubscribe link
   - Our contact details for data protection queries

5. **Immediate opt-out**: Unsubscribe requests are honoured immediately via the `cold_prospect_unsubscribes` table, checked before every send

6. **Auto-deletion**: Prospects with no engagement are automatically deleted after 6 months

7. **Exclusion filtering**: The pipeline excludes:
   - Named/personal email addresses
   - Domains that appear to be personal (blogs, portfolios without business indicators)
   - Domains already in our user base
   - Domains on the unsubscribe list
   - Known spam/parked domains

8. **Right to object**: Any recipient can request deletion of their data at any time, processed within 48 hours

9. **Regular review**: This LIA is reviewed every 6 months, or sooner if:
   - Complaint volumes increase
   - Regulatory guidance changes
   - The processing activity changes materially

**Conclusion: Balancing test — PASSED (with safeguards in place)**

---

## 5. PECR Compliance (UK)

Under the Privacy and Electronic Communications Regulations 2003 (as amended), B2B marketing emails are permitted without prior consent **if**:

| Requirement | Status |
|-------------|--------|
| The recipient is a business (not individual/sole trader) | ✅ Filtered for business indicators |
| The email is relevant to their business role | ✅ Website auditing is directly relevant to website owners |
| Every email includes an opt-out mechanism | ✅ Unsubscribe link in every email |
| Opt-outs are honoured promptly | ✅ Immediate via `cold_prospect_unsubscribes` |
| The sender is identified clearly | ✅ Kritano branding and contact details in every email |
| A valid postal address is included | ⚠️ **TODO: Add registered business address to email footer** |

> **Note**: If targeting sole traders, partnerships, or individuals, prior consent (opt-in) is required under PECR. Our filtering attempts to exclude these, but cannot guarantee 100% accuracy.

---

## 6. ePrivacy Directive Compliance (EU)

For EU-based prospects, similar rules apply under national implementations of the ePrivacy Directive. Key differences:

- Some EU member states (e.g. Germany) have stricter rules on B2B cold email
- The upcoming ePrivacy Regulation may change requirements
- When in doubt, treat EU prospects more conservatively

**Recommendation**: Consider limiting EU outreach to countries with more permissive B2B email rules, or switching to consent-based outreach for EU prospects.

---

## 7. Data Flow

```
WHOIS Data Service (e.g. WhoisDS)
    │
    ▼
[Batch Import] ─── New domain registrations (daily)
    │
    ▼
[Liveness Check] ─── Is the site live? Has SSL? HTTP status?
    │
    ▼
[Contact Extraction] ─── Scrape contact page, meta tags, social links
    │                      Extract: email, name, role
    │
    ▼
[Quality Scoring] ─── Score based on: has SSL, page count, business type
    │                   Filter out: parked, personal, low-quality
    │
    ▼
[Exclusion Check] ─── Check against:
    │                   • cold_prospect_unsubscribes
    │                   • Existing users
    │                   • Previously contacted
    │                   • Exclusion rules
    │
    ▼
[Email Send] ─── Single outreach email via campaign system
    │              Includes: who we are, data source, unsubscribe link
    │
    ▼
[Tracking] ─── Monitor: delivered, opened, clicked, bounced, complained
    │
    ▼
[Outcome] ─── Converted → Link to user account
              No engagement after 6 months → Auto-delete
              Unsubscribed → Immediate removal + added to exclusion list
              Complained → Immediate removal + exclusion + review
```

---

## 8. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Complaint to ICO/DPA | Very Low | Medium | LIA documented, generic addresses only, 1 email per domain, immediate opt-out |
| Hitting sole traders/individuals | Low | Low | Generic mailboxes (info@, hello@) are business addresses regardless of entity type; no personal emails used |
| Email deliverability damage (spam reports) | Low | High | Very low volume (10–20/day), high relevance, immediate unsubscribe, complaint monitoring |
| Reputational damage | Very Low | High | Professional tone, genuine value proposition, transparent data sourcing, single contact only |
| Regulatory change (ePrivacy Regulation) | Medium | Medium | 6-monthly LIA review; prepared to switch to consent model |
| Data breach (prospect data exposed) | Very Low | Low | Minimal data stored; generic emails are not sensitive personal data |

### Complaint Monitoring

- If complaint rate exceeds **0.1% of emails sent**, pause outreach and review
- If any ICO/DPA inquiry is received, immediately escalate and engage legal counsel
- Track spam complaint rate via Resend webhooks (`email.complained` event)
- Monthly review of complaint metrics

---

## 9. Data Subject Rights

| Right | How We Honour It |
|-------|-----------------|
| **Right to be informed** (Art. 13/14) | First email discloses: data controller identity, data source, purpose, right to object |
| **Right of access** (Art. 15) | Respond within 30 days with all data held about the prospect |
| **Right to rectification** (Art. 16) | Update or correct data on request |
| **Right to erasure** (Art. 17) | Delete all prospect data within 48 hours of request |
| **Right to object** (Art. 21) | Immediate opt-out via unsubscribe link; no requirement to provide a reason |
| **Right to restrict processing** (Art. 18) | Pause processing while any complaint is investigated |

---

## 10. Implementation Checklist

### Currently Implemented

- [x] `cold_prospects` table with contact data storage
- [x] Quality scoring and filtering
- [x] `cold_prospect_unsubscribes` table exists
- [x] Email campaign integration
- [x] Engagement tracking (sent, opened, clicked)
- [x] Exclusion filtering (is_excluded, exclusion_reason)
- [x] Batch processing by date

### TODO — Required for Compliance

- [x] **Enforce unsubscribe check before every send** — `cold_prospect_unsubscribes` checked in `queueOutreachBatch()` query
- [x] **Auto-delete after 6 months** — `purgeStaleProspects()` runs daily via worker (migration 088)
- [x] **Enforce 1 email per domain** — Follow-up system removed; `queueFollowups()` deleted from outreach service and worker
- [x] **Enforce generic-address-only filter** — `isGenericBusinessEmail()` filter in outreach service rejects personal emails
- [x] **First email template compliance** — Template updated (migration 088) with data source disclosure, single-contact notice, unsubscribe link
- [ ] **Add business address to email footer** — PECR requirement. Set `BUSINESS_ADDRESS` env var. Template placeholder added.
- [ ] **Complaint rate monitoring** — Dashboard or alert when complaint rate exceeds 0.1%
- [x] **Privacy policy update** — Section 9 added to Privacy.tsx covering cold outreach data collection
- [ ] **This LIA signed off** — Requires sign-off by designated person

### Recommended Enhancements

- [ ] Country-based outreach rules (stricter for DE, AT, etc.)
- [ ] Suppress list import capability (industry-wide opt-out lists)
- [ ] Prospect data access request handling workflow
- [ ] Regular audit of extraction accuracy (are we getting the right contact?)

---

## 11. Review Schedule

| Date | Action |
|------|--------|
| 14 March 2026 | Initial LIA created |
| 14 September 2026 | First scheduled review |
| On any material change | Ad-hoc review triggered |
| On complaint/inquiry | Immediate review |

---

## 12. Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Data Controller / Founder | | | |
| Legal Advisor (if applicable) | | | |

---

*This document should be stored securely and made available to any supervisory authority upon request. It demonstrates that Kritano has considered and balanced the rights of data subjects against its legitimate business interests, in accordance with GDPR Article 6(1)(f) and Recital 47.*
