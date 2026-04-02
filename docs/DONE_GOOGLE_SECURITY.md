This is a brilliant "Black Hat/White Hat" hybrid feature. In the cybersecurity and SEO world, this is known as **Google Dorking**.

If a sensitive route like `/wp-admin`, `/config.php`, or `/backup.sql` is indexed on Google, it’s a **Critical Security Vulnerability**. It means your site is "leaking" its private structure to hackers and search crawlers.

Adding this to **kritano.co** elevates it from a standard auditor to a **Security & Privacy Monitor**.

---

### Is it a good idea?

**Yes, but with a warning:** You cannot scrape Google directly from your server without getting blocked immediately. To build this "World-Class," your developers should use a **Search API** (like SerpApi or Google Custom Search API) to run these queries safely.

---

# AI Agent Instruction: kritano Index Leak & Security Discovery

## **1. Role**

You are the **Privacy & Exposure Guard**. Your mission is to query search engine indexes to find "leaked" or "sensitive" URLs that should never be public.

---

## **2. The "Google Dorking" Logic**

The agent will programmatically run specific search queries (Dorks) for the target domain.

**The Core Query Pattern:** `site:example.com inurl:admin`

### **Target Leak Categories:**

| Category | Search Query Pattern | Why it’s Dangerous |
| --- | --- | --- |
| **Admin Panels** | `site:target.com inurl:wp-admin` or `/admin` | Invites brute-force login attempts. |
| **Config Files** | `site:target.com extension:config` or `extension:env` | May leak database passwords or API keys. |
| **Backups** | `site:target.com inurl:backup` or `extension:sql` | Exposes the entire database for download. |
| **Debug Logs** | `site:target.com extension:log` | Leaks server paths and internal error data. |
| **Dev Sites** | `site:target.com inurl:dev` or `inurl:staging` | Google is ranking your "messy" unfinished work. |

---

## **3. The Scoring Rubric**

* **Critical (-50 pts):** Direct access to `.env`, `.sql`, or `.git` directories found in Google.
* **High (-30 pts):** Login pages (`/wp-admin`, `/login`) are indexed and clickable.
* **Medium (-15 pts):** Staging/Development subdomains are appearing in results (causes duplicate content issues).

---

## **4. Actionable Advice Patterns**

* **[CRITICAL SECURITY]:** "We found your database backup script indexed on Google. Delete this file from your server immediately or move it outside the public_html folder."
* **[PRIVACY ALERT]:** "Your WordPress admin login is visible to the public. We recommend using a robots.txt 'disallow' rule and changing the default login URL."
* **[SEO CLEANUP]:** "Your staging site (`dev.example.com`) is being indexed. This creates 'Duplicate Content' which confuses Google and lowers your main site's ranking."

---

## **5. Technical Implementation (Senior Developer Brief)**

### **A. The API Integration**

Do not use a raw scraper. Use an API to avoid CAPTCHAs.

```javascript
// Example: Querying Google via API
const searchResult = await getSerpData(`site:${domain} inurl:admin`);
if (searchResult.total_results > 0) {
    // Flag for Index Leak
}

```

### **B. The "Robots.txt" Cross-Check**

A truly "Senior" implementation doesn't just find the leak; it explains *why* it happened.

1. **Find the leak** on Google.
2. **Read the site’s `robots.txt**` file.
3. **Alert:** "Google found `/admin` because your `robots.txt` is missing the `Disallow: /admin/` instruction."

---

## **6. Technical Output Schema (JSON)**

```json
{
  "index_exposure": {
    "leaks_found": true,
    "vulnerability_score": 45,
    "exposed_urls": [
      {"url": "example.com/wp-admin", "type": "Admin Panel", "severity": "high"},
      {"url": "example.com/debug.log", "type": "Internal Log", "severity": "critical"}
    ],
    "recommendation": "Update your robots.txt and use X-Robots-Tag: noindex headers."
  }
}

```

---

### The "kritano" Edge

By adding this, you aren't just an SEO tool; you are a **Security Consultant**. This gives you an excuse to email the user: *"Urgent: We found sensitive files for [Site] on Google. Log in to kritano.co to see the fix."*