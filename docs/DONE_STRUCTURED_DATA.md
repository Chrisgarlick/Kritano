In 2026, **Structured Data (Schema.org)** is no longer "optional"—it is the language your website uses to talk directly to AI search engines (like Google Search Generative Experience and Perplexity).

If a website has great content but no structured data, it’s like having a great book with no table of contents and no index. Google has to "guess" what the page is about, which is a massive ranking risk.

### Why it is critical for kritano.co:

1. **Rich Snippets:** It’s how sites get stars, prices, and FAQ dropdowns in search results. These increase clicks by up to **30%**.
2. **AI Visibility:** Modern AI crawlers use Schema to "verify" facts. No Schema = No AI visibility.
3. **Entity Linking:** It tells Google "This 'Apple' is the fruit, not the tech company."

**Should we mark people up/down?** * **Up:** If they have valid, error-free Schema that matches their content.

* **Down:** If they have **Zero** Schema (Critical Error) or **Malformed** Schema (Technical Warning).

---

# AI Agent Instruction: kritano Schema & Structured Data Audit

## **1. Role**

You are the **Technical SEO Validator**. Your job is to extract JSON-LD, Microdata, or RDFa from the page and verify if it is present, valid, and strategically optimized.

---

## **2. Detection Logic (The Scraper)**

The scraper must look for three specific things:

1. **JSON-LD:** `<script type="application/ld+json">` (The Gold Standard).
2. **Microdata:** `itemscope`, `itemtype` attributes within HTML tags.
3. **Open Graph:** `og:title`, `og:image` (For social sharing/rich previews).

---

## **3. The Scoring Rubric (Weighted)**

| Metric | Impact | Logic |
| --- | --- | --- |
| **Presence** | **Critical** | Does the page have *any* Schema? (No = -40 points). |
| **Syntax Validity** | **High** | Does the JSON-LD parse correctly? (Syntax error = -20 points). |
| **Contextual Match** | **High** | Does the Schema type match the page? (e.g., An E-commerce page should have `Product` schema). |
| **Completeness** | **Medium** | Are "Recommended" fields missing? (e.g., `Product` missing `price` or `review`). |

---

## **4. Strategic "Schema Match" Matrix**

The agent should expect specific Schema types based on the page content:

* **Homepage:** Expects `Organization` or `WebSite`.
* **Article/Blog:** Expects `Article`, `BreadcrumbList`, and `Author`.
* **Product Page:** Expects `Product`, `Offer`, and `AggregateRating`.
* **Local Business:** Expects `LocalBusiness`, `PostalAddress`, and `OpeningHours`.

---

## **5. Actionable Advice Patterns (The "Sift")**

* **[Critical]:** "No Structured Data found. You are missing out on Rich Snippets (stars/prices) in search results."
* **[Warning]:** "You are using `Product` schema, but the `priceValidUntil` field is missing. Google may stop showing your price in search."
* **[Optimization]:** "We detected an FAQ section on your page. Add `FAQPage` schema to dominate more space on the search results page."

---

## **6. Technical Output Schema (JSON)**

```json
{
  "structured_data": {
    "total_score": 75,
    "detected_types": ["Organization", "BreadcrumbList"],
    "is_valid_json": true,
    "missing_critical_types": ["Product"],
    "validation_errors": [
      {
        "type": "Missing Field",
        "field": "logo",
        "severity": "warning",
        "msg": "Organization schema is missing a logo URL."
      }
    ],
    "open_graph_present": true
  }
}

```

---

## **7. Senior Developer Instruction: Implementation**

1. **Extraction:** Use Playwright's `page.evaluate()` to grab all `application/ld+json` scripts.
2. **Validation:** Pass the extracted strings through a `JSON.parse()` check.
3. **Schema Dictionary:** Keep a reference file of "Required vs. Recommended" fields for the top 5 types (`Organization`, `Product`, `Article`, `LocalBusiness`, `FAQ`).
4. **UI:** Display a **"Rich Snippet Preview"** on the dashboard to show the user what their site *could* look like if they fixed their schema.

---

**Next Step:** Now that we have **Content**, **EEAT**, and **Schema** audits, kritano.co is becoming a powerhouse.

**Would you like me to create the "Audit Summary PDF" layout that your users can download to show off all these new data points to their clients?**
