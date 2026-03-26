# Legal Audit

> **DISCLAIMER:** This audit is not legal advice and does not constitute a legal opinion. It is a technical review of compliance-related code and documentation. All findings should be reviewed by a qualified solicitor or data protection specialist before being relied upon for regulatory compliance.

**Overall Assessment:** STRONG
**Score:** 8/10

## What's Working Well

1. **Comprehensive consent logging infrastructure.** The `consent.service.ts` records ToS acceptance, privacy policy acceptance, and unverified domain scan consent with full provenance (IP, user agent, timestamp, consent text hash, version). Consent text hashing provides integrity proof that the text accepted was the text displayed -- this is excellent for evidential purposes.

2. **Full GDPR data subject rights implementation.** The `gdpr.service.ts` implements the core rights: data export (Right to Portability, Art. 20) via ZIP download with 24-hour expiry, account deletion (Right to Erasure, Art. 17) with 30-day grace period, consent archival before deletion, and cascading data removal across 16+ tables. The GDPR worker runs retention cleanup daily.

3. **Robust liability protection for website scanning.** The system enforces domain verification (DNS TXT or file), limits unverified scans to 3 pages with reduced crawl speed (2.5s delay, sequential only, robots.txt respected), requires explicit consent with three specific acknowledgments, and logs every consent event. The consent modal text includes clear warnings about the Computer Misuse Act. This is a well-designed system for the core business risk.

4. **Privacy policy is thorough and mostly accurate.** The Privacy.tsx page covers data categories, cookies (with a table), sub-processors by name and country, international transfers with SCCs reference, GDPR rights with self-service links, automated decision-making disclosure, data retention periods per category, and ICO complaint rights. The password hashing description has been corrected to "industry-standard algorithms." Email tracking is disclosed. Device fingerprinting is disclosed.

5. **Cold prospect system has appropriate safeguards.** The outreach service checks an unsubscribe table (`cold_prospect_unsubscribes`) before sending, includes List-Unsubscribe headers, limits contacts to one per domain, and the worker auto-purges prospects with no engagement after 6 months. The email extractor prioritises generic/role-based addresses (info@, hello@) over personal emails.

## Issues Found

### 1. No Formal Legitimate Interest Assessment (LIA) Document for Cold Prospects
**Severity:** HIGH
**Location:** `/Users/chris/Herd/pagepulser/server/src/services/cold-prospect/email-extractor.service.ts`, `/Users/chris/Herd/pagepulser/docs/privacy_policy.md` (Section 2.13)
**Finding:** The cold prospect system scrapes contact emails from live websites and stores contact names and roles. While the privacy policy (Section 9) states "We do not collect personal or named email addresses for this purpose," the `email-extractor.service.ts` actively extracts personal names (`extractNameNearEmail`) and roles (`Director`, `CEO`, etc.) and stores them in `contact_name` and `contact_role` fields. The code also captures personal emails found on pages, though it deprioritises them for outreach. There is no formal LIA document to support the Art. 6(1)(f) basis relied upon.
**Impact:** Under UK-GDPR, relying on legitimate interest without a documented LIA is a compliance gap. If a complaint reaches the ICO, the absence of a balancing test is a material weakness. The privacy policy's claim of not collecting personal/named emails is contradicted by the code, which could be viewed as misleading.
**Recommendation:** (a) Create a formal LIA document at `/docs/legitimate-interest-assessment-cold-prospects.md` covering purpose, necessity, and balancing test. (b) Align the privacy policy Section 9 with what the code actually does -- either update the policy to disclose name/role collection, or modify the extractor to genuinely skip personal data. (c) Consider adding a right-to-object mechanism beyond just unsubscribe (Art. 21 requires processing to stop on objection unless compelling grounds exist).

### 2. Privacy Policy Claims Self-Service Data Export and Deletion Exist -- Verify They Are Live
**Severity:** MEDIUM
**Location:** `/Users/chris/Herd/pagepulser/client/src/pages/public/Privacy.tsx` (Sections 10, 12)
**Finding:** The privacy policy states users can "download a complete export of your data at any time from your account settings" and "delete your account from your account settings." The GDPR service code exists, but the privacy policy should only promise what is actually deployed and accessible to users in production.
**Impact:** If these features are not yet live in the UI, the privacy policy makes a false promise, which is a compliance issue and a potential ICO concern.
**Recommendation:** Verify that the Profile/Settings page actually exposes the "Download My Data" and "Delete My Account" buttons. If not yet live, either deploy them or soften the policy language to "contact us to exercise these rights."

### 3. Cookie Consent Re-prompt on Version Change Not Fully Enforced
**Severity:** MEDIUM
**Location:** `/Users/chris/Herd/pagepulser/client/src/contexts/CookieConsentContext.tsx`
**Finding:** The context checks `parsed.version !== CONSENT_VERSION` and returns `null` if they differ, which does re-show the banner. However, the privacy audit document notes this logic may not be fully tested. Additionally, the version is hardcoded as `'1.0'` on both client and server -- when it is eventually bumped, all users will need re-consent, which could be disruptive if not planned.
**Impact:** If the version check fails silently for any reason (localStorage corruption, SSR mismatch), users could operate under stale consent, which undermines the consent mechanism.
**Recommendation:** Add integration tests for the version bump scenario. Consider adding a server-side consent version check that returns a re-consent-required flag on API responses as a belt-and-suspenders approach.

### 4. No Data Processing Agreement (DPA) Registry
**Severity:** MEDIUM
**Location:** Documentation gap
**Finding:** The privacy audit document (`privacy_policy.md`) lists sub-processors (Stripe, Resend, Sentry, Google CSE, hosting provider) but there is no formal DPA registry tracking the status of each agreement, last review date, or data transfer mechanisms.
**Impact:** Under GDPR Art. 28, controllers must have DPAs with all processors. Without a registry, it is difficult to demonstrate compliance during an ICO audit.
**Recommendation:** Create `/docs/dpa-registry.md` documenting each sub-processor, DPA status (signed/pending), data shared, transfer mechanism (SCCs, adequacy decision), and next review date.

### 5. No Record of Processing Activities (ROPA)
**Severity:** MEDIUM
**Location:** Documentation gap
**Finding:** GDPR Art. 30 requires controllers to maintain a record of processing activities. The `privacy_policy.md` data inventory is a strong foundation but is not structured as a formal ROPA.
**Impact:** A ROPA is one of the first documents an ICO auditor would request. Its absence is a compliance gap, though the data inventory partially mitigates this.
**Recommendation:** Convert the data inventory into a formal ROPA, adding: lawful basis per activity, categories of data subjects, data transfers, and retention periods in the Art. 30 format.

### 6. No Documented Breach Notification Procedure
**Severity:** LOW
**Location:** Documentation gap
**Finding:** There is no documented data breach response plan covering internal escalation, ICO notification within 72 hours (Art. 33), and user notification (Art. 34).
**Impact:** In a breach scenario, the absence of a pre-defined process increases the risk of missing the 72-hour notification window.
**Recommendation:** Create a breach response procedure document. At minimum, define who decides on notification, the ICO submission process, and user communication templates.

### 7. Terms of Service Missing Data Processing Clause
**Severity:** LOW
**Location:** `/Users/chris/Herd/pagepulser/client/src/pages/public/Terms.tsx`
**Finding:** The Terms of Service is well-drafted for liability protection but does not include a data processing clause or reference the privacy policy for data handling terms. Standard SaaS terms typically include a section stating that data processing is governed by the privacy policy.
**Impact:** Minor gap -- the privacy policy exists and is linked at registration, but contractual completeness would benefit from an explicit cross-reference.
**Recommendation:** Add a short section: "Your use of the Service is also governed by our Privacy Policy at [link], which is incorporated into these Terms by reference."

### 8. Unsubscribe Token Does Not Expire
**Severity:** LOW
**Location:** `/Users/chris/Herd/pagepulser/server/src/services/email-preference.service.ts` (line 128)
**Finding:** The `generateUnsubscribeToken` function creates a JWT with no expiry (`jwt.sign({ userId, purpose: 'unsubscribe' }, JWT_SECRET)`). While this is common practice for unsubscribe links (they should always work), it means these tokens are valid indefinitely and could theoretically be used to unsubscribe a user at any future time if intercepted.
**Impact:** Low risk in practice since the token only performs an unsubscribe action (not a destructive or privileged operation). However, if the JWT_SECRET is compromised, tokens for any user could be forged.
**Recommendation:** This is acceptable as-is. Optionally, consider HMAC-based tokens tied to the user ID rather than JWTs, which would be simpler and avoid the theoretical JWT key compromise vector.

## Opportunities

1. **Formalise the LIA for cold prospects into a standalone document.** This is the single highest-value compliance action. The technical safeguards (auto-deletion, unsubscribe, one-contact-per-domain) are good, but the legal justification needs documentation.

2. **Add a "Privacy Centre" page.** Consolidate the cookie preferences, email preferences, data export, and account deletion into a single user-facing page. This improves transparency and makes GDPR rights more discoverable.

3. **Implement consent receipt emails.** When a user accepts ToS or gives cookie consent, send a confirmation email with what was consented to. This is not required but is a strong trust signal.

4. **Add data retention enforcement for cold prospects to the GDPR cleanup worker.** The 6-month auto-purge exists in the cold prospect worker, but it should also be referenced in the GDPR retention cleanup for belt-and-suspenders coverage.

5. **Consider adding a DPO or privacy point of contact to the privacy policy.** Even if a DPO is not legally required, naming a specific contact (email address rather than just "/contact" link) shows maturity and makes ICO correspondence easier.

## Summary

PagePulser demonstrates a strong compliance posture for an early-stage SaaS. The consent logging infrastructure is genuinely impressive -- consent text hashing, version tracking, IP/UA provenance, and separate tables for different consent types put it ahead of most competitors. The liability protection system for website scanning is well-engineered and addresses the core business risk effectively. The GDPR service implements the critical data subject rights (export, deletion, retention cleanup) with a proper worker process. The privacy policy is comprehensive and largely accurate. The main gaps are documentation-level: a formal LIA for cold prospects, a DPA registry, a ROPA, and a breach notification procedure. The cold prospect email extractor's collection of personal names and roles contradicts the privacy policy's claim of only collecting generic emails -- this is the most actionable finding. Overall, the technical implementation is strong; the documentation and process layer needs to catch up.
