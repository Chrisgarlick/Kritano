# SEO Technical Audit & Action Plan: Kritano.com

This document outlines the technical issues identified from your Google Search Console (GSC) and PageSpeed Insights data. It provides specific, actionable steps to move your pages from "Discovered" to "Indexed" and fix the URL display issues in search results.

---

## 1. The "URL Identity Crisis" (Consolidation)
**The Problem:** Google is indexing your content but displaying the homepage URL (`kritano.com`) in search results instead of the specific blog path.

### Root Causes
* **JavaScript Hydration Lag:** Because you are using a custom React app, Googlebot likely sees the "blank" shell or homepage metadata in the raw HTML before your JavaScript updates the canonical tags.
* **Sitemap Hierarchy:** Your sitemap currently gives the Homepage a Priority of **1.0** and Blogs **0.6**. This tells Google the blog posts are secondary "sub-content" of the home page.

### Actionable Steps
1. **Move Meta to Server-Side:** Ensure the `<link rel="canonical">` and `<title>` tags are present in the **initial server response**. If you use a tool like `react-helmet`, ensure you are using it with Server-Side Rendering (SSR) or Static Site Generation (SSG).
2. **Rebalance Sitemap Priorities:** * Change Blog Post Priority to **0.8**.
   * Change Homepage Priority to **0.9**.
3. **Internal Linking:** Ensure your homepage links to blogs using standard `<a href="/blog/...">` tags rather than JavaScript-only `onClick` events.

---

## 2. Mobile Performance Optimization
**The Problem:** Your Desktop score is **97**, but your Mobile score is **70**. Since Google uses **Mobile-First Indexing**, it judges your site's "crawlability" based on the 70 score.

### Actionable Steps
1. **Image Optimization:** * Serve images in **WebP** or **AVIF** formats.
   * Use the `srcset` attribute so mobile devices download smaller versions of your blog headers.
2. **Font Loading:** Add `font-display: swap;` to your `@font-face` CSS rules. This prevents "flash of invisible text" which penalizes performance scores.
3. **Reduce Main Thread Work:** Code-split your React bundle. Ensure that a user (or bot) landing on a blog post doesn't have to download the JavaScript logic for the entire site's features.

---

## 3. Sitemap & Crawl Health
**The Problem:** GSC shows a "Temporary processing error" and your blog posts are set to "Monthly" frequency.

### Actionable Steps
1. **Set Correct Headers:** Ensure your API returns the header `Content-Type: application/xml`.
2. **Update Frequency:** Change `<changefreq>` for blog posts from `monthly` to `daily` or `weekly`. This signals to Google that it should check back more often.
3. **Add Global lastmod:** Add a `<lastmod>` date to every URL in the sitemap, not just the blogs. This creates a "heartbeat" for the whole domain.

---

## 4. Current Status Checklist
| Metric | Status | Note |
| :--- | :--- | :--- |
| **Indexing** | Partial | 19 pages "Discovered" but pending. |
| **Crawl Response** | 255ms | **Good.** Server speed is not the bottleneck. |
| **Host Status** | Green | **Excellent.** No DNS or robots.txt issues. |
| **Canonical** | Inspected URL | **Good.** Google recognizes your intent, just needs to update the display. |

---

## 5. Timeline of Recovery
1. **Implement Changes:** Complete the technical fixes above.
2. **Request Validation:** In Search Console, click "Validate Fix" on the "Discovered - currently not indexed" report.
3. **Wait 7-10 Days:** Googlebot typically re-crawls in cycles. Watch for the "Discovery" spike in your **Crawl Stats** report.
4. **Result:** The individual URLs should begin replacing the homepage domain in search results.

---
*Audit generated for Kritano.com - May 2026*