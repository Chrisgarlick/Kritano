# Content Audit

**Overall Assessment:** STRONG
**Score:** 8/10

## What's Working Well

1. **Blog content quality is exceptionally high.** The 20 blog posts are well-researched, data-backed, and genuinely useful. Posts like "The Business Case for Web Accessibility" and "The State of Web Accessibility in 2026" contain specific statistics, real-world cost comparisons, and actionable checklists. They go far beyond surface-level SEO filler.

2. **Brand voice is consistent across blog content.** The blog posts faithfully follow the brand voice guide -- conversational openers with relatable questions, honest personal opinions ("in my honest opinion"), plain-English explanations of technical concepts, and soft CTAs. The tone matches the "Friendly Expert" archetype defined in `docs/marketing/brand_voice.md`.

3. **SEO metadata is thorough.** Every blog post has frontmatter with title, slug, description, keyword, category, tags, post_type, and reading_time. Public pages use `PageSeo` components with structured data (Schema.org JSON-LD). The Pricing page includes FAQPage schema, and the Services page uses ItemList schema -- both strong for rich results.

4. **Legal pages are comprehensive and well-structured.** The Privacy Policy covers GDPR rights, cookie inventory, sub-processors, data retention by tier, consent logging, and international transfers. The Terms of Service includes proper scanning liability provisions referencing the Computer Misuse Act 1990. Both are clearly written and use appropriate legal language without being impenetrable.

5. **Public page copy is clean, confident, and conversion-oriented.** The homepage hero ("The clarity your website deserves"), About page ("From frustration to solution"), and Services page ("Four pillars of website health") all use the editorial brand voice effectively. CTAs are present on every page without being aggressive.

## Issues Found

### American English Spelling Inconsistency
**Severity:** MEDIUM
**Location:** `client/src/pages/public/Services.tsx` (lines 91, 93, 96), `client/src/pages/Home.tsx` (line 253), `client/src/pages/public/Services.tsx` (line 88)
**Finding:** The brand voice guide explicitly mandates British English spelling ("optimise" not "optimize"). The Services page uses "optimization" three times (lines 91, 93, 96). The Home page uses "prioritized" (line 253) while the Terms page uses the correct "prioritised". The Services page also uses "prioritized" (line 88).
**Impact:** Inconsistent spelling undermines the brand's British identity and attention to detail -- the very qualities the brand voice guide emphasises.
**Recommendation:** Change all instances of "optimization" to "optimisation" and "prioritized" to "prioritised" in the public-facing pages. Run a project-wide search for American English variants (optimize, analyze, color as a word in copy, center in copy, favor) and standardise.

### Blog Internal Links Not Implemented
**Severity:** HIGH
**Location:** All 20 files in `docs/blog/`
**Finding:** Every single blog post contains an HTML comment block at the bottom titled "Internal linking suggestions" with 4-6 specific cross-linking recommendations. None of these have been implemented as actual hyperlinks in the post content. For example, the launch post suggests linking "accessibility" to the web accessibility 2026 post, "Core Web Vitals" to the CWV guide, and "alt text" to the alt text guide -- but all remain plain text.
**Impact:** Internal linking is a significant SEO ranking factor. With 20 high-quality posts that naturally reference each other's topics, the absence of cross-links means the blog is missing substantial link equity distribution, reduced crawl depth for search engines, and lower user engagement (readers cannot easily discover related content). This is one of the highest-impact SEO improvements available.
**Recommendation:** Implement all internal linking suggestions across the 20 blog posts. This is already planned (the suggestions are written) -- it just needs execution. Prioritise the launch post and the 5 featured/high-traffic posts first.

### Services Page Missing Content and AI Readiness Categories
**Severity:** MEDIUM
**Location:** `client/src/pages/public/Services.tsx`
**Finding:** The Services page describes "Four pillars of website health" (SEO, Accessibility, Security, Performance), but the actual product audits six categories. The launch blog post and the homepage score card both show Content Analysis and AI Readiness as distinct audit dimensions. The Services page does not mention either.
**Impact:** Prospective customers reading the Services page get an incomplete picture of what PagePulser offers. Content Analysis and AI Readiness are differentiators that competitors do not typically offer -- omitting them from the Services page is a missed selling point.
**Recommendation:** Either add Content Analysis and AI Readiness as two additional service sections on the Services page (updating the hero to "Six pillars of website health"), or create separate detail pages for them. At minimum, reference them in the "Beyond Auditing" section.

### Performance Service Lists Outdated Metric (FID)
**Severity:** LOW
**Location:** `client/src/pages/public/Services.tsx` (line 90)
**Finding:** The Performance features list includes "Core Web Vitals (LCP, FID, CLS)" -- but FID (First Input Delay) was replaced by INP (Interaction to Next Paint) as a Core Web Vital by Google in March 2024. The launch blog post correctly references "LCP, INP, and CLS".
**Impact:** Mentioning FID instead of INP signals outdated knowledge to technically informed visitors, which conflicts with the "Forward-thinking" brand voice attribute.
**Recommendation:** Change "FID" to "INP" on the Services page.

### About Page Uses "We" Inconsistently with Brand Voice
**Severity:** LOW
**Location:** `client/src/pages/public/About.tsx`
**Finding:** The brand voice guide establishes first-person singular ("I", "my") for editorial content and the homepage, shifting to first-person plural for case studies. The About page uses "we" and "our" throughout ("We believe," "We built," "We're here to change that"), which creates a slight disconnect given PagePulser appears to be a solo-founder product. The Story section references "our founder" in the third person, adding a further inconsistency.
**Impact:** Minor, but it creates ambiguity about whether PagePulser is a team or a solo venture. The blog posts use "I" consistently and the brand voice guide anchors on personal authenticity.
**Recommendation:** Decide on a consistent voice for the About page. If the intent is to present as a company, use "we" consistently and remove "our founder" phrasing. If the intent is personal authenticity (aligned with the blog voice), shift to first-person singular.

### Privacy Page Uses Helmet Instead of PageSeo
**Severity:** LOW
**Location:** `client/src/pages/public/Privacy.tsx`, `client/src/pages/public/Terms.tsx`
**Finding:** The Privacy and Terms pages use `<Helmet>` directly for SEO metadata, while all other public pages use the `<PageSeo>` component which includes structured data support. These pages lack Schema.org structured data.
**Impact:** Minor SEO gap. Adding structured data (e.g., WebPage type) to legal pages would maintain consistency.
**Recommendation:** Migrate Privacy and Terms pages to use the `PageSeo` component for consistency.

## Opportunities

1. **Implement blog internal links immediately.** This is the single highest-ROI content task available. The linking strategy is already written in every post -- it just needs to be executed. This could meaningfully improve search rankings for the entire blog.

2. **Add a Content and AI Readiness service page.** These are genuine differentiators. Most competitors do not audit content quality or AI citation readiness. Dedicating a service page to each (or a combined page) would strengthen the product positioning and give the sales funnel more landing pages to target keywords like "AI readiness audit" and "content quality analysis."

3. **Create case studies or social proof.** The blog content establishes expertise, but there is no customer evidence on the public site. Even anonymised before/after score improvements ("E-commerce site improved accessibility score from 38 to 84 in 2 hours") would strengthen trust, especially on the Pricing and About pages.

4. **Add author schema and byline to blog posts.** The frontmatter includes `author: "Chris Garlick"` but there is no Person schema or visible author bio on published posts. Adding these would strengthen E-E-A-T signals -- which PagePulser itself audits for.

5. **Consider annual pricing toggle on the Pricing page.** The page only shows monthly pricing. An annual pricing option (with a discount) is standard SaaS practice and could improve conversion and reduce churn.

## Summary

PagePulser's content is genuinely strong. The blog library of 20 posts is well above average for an early-stage SaaS -- the writing quality is high, the research is thorough with real statistics and data, and the brand voice is consistent with the documented guidelines. The public pages are clean, well-structured, and conversion-focused with good SEO metadata and structured data throughout. The legal pages are comprehensive and appropriate for a UK-based SaaS handling website scanning. The most impactful gap is the unimplemented internal linking across all 20 blog posts -- the strategy is already written in HTML comments but never executed, which represents a significant missed SEO opportunity. Secondary issues include American English spelling creeping into a few public pages (contradicting the British English brand standard), the Services page being out of date with only four audit categories when the product now offers six, and an outdated Core Web Vital metric (FID instead of INP). None of these issues are critical, and the content foundation is solid enough that addressing them would move the score from strong to excellent.
