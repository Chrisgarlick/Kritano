
---

# kritano: Project Blueprint

**Goal:** Turn £50 into £5,000 in 6 months using "World-Class" engineering and automated sales.

---

## 1. Product Concept

**kritano** is an automated B2B "Trust Auditor." It scans websites for three critical pillars that business owners are often unaware of but legally or financially penalized for:

1. **SEO & Performance:** Core Web Vitals, broken links, and metadata.
2. **Accessibility (WCAG 2.2):** Legal compliance for screen readers and keyboard navigation.
3. **Security & Privacy:** Exposed sensitive files (`.env`, `.git`), mixed content (HTTP/HTTPS), and GDPR cookie compliance.

---

## 2. Technical Stack (The "All-in-One" Server)

We use a single-server architecture to keep costs under **£10/month** and ensure high security by keeping the database off the public internet.

* **Environment:** Node.js (Asynchronous, non-blocking for high-concurrency scraping).
* **Database:** PostgreSQL (The "Vault" for lead data and audit results).
* **Crawler Engine:** Playwright / Puppeteer (Native JS headless browsers).
* **Frontend:** React + Tailwind CSS (Fast, responsive dashboard).
* **Intelligence APIs:** * **Google PageSpeed Insights API** (Free tier for performance data).
* **Axe-core** (Open-source accessibility engine).


* **Auth:** Custom-built Node.js session/JWT auth using **Lucia** or **Passport.js**.

---

## 2.1 CLI Commands

| Command | Description |
|---------|-------------|
| `./kt start` | Start database and seed user |
| `./kt stop` | Stop database |
| `./kt reset` | Stop and delete all data |
| `./kt logs` | Follow database logs |
| `./kt db` | Open psql shell |

After starting, run `npm run dev:all --prefix server` to start the dev servers.

---

## 3. Database Schema (PostgreSQL)

```sql
-- Leads: Businesses found by the bot
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_url TEXT UNIQUE NOT NULL,
    contact_email TEXT,
    discovery_source TEXT, -- e.g., 'Yelp', 'New Domain'
    status TEXT DEFAULT 'discovered', -- discovered, emailed, converted
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audits: Summary of a scan
CREATE TABLE audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    seo_score INT,
    accessibility_score INT,
    security_score INT,
    report_json JSONB, -- Stores full raw findings
    created_at TIMESTAMP DEFAULT NOW()
);

```

---

## 4. The "Growth Engine" Workflow

The differentiator: **We don't wait for users. We find them.**

1. **Discovery:** A script monitors "New Business" directories (like Yelp or recently registered domains).
2. **Auto-Scan:** Node.js triggers a "Mini-Audit" using the PageSpeed API and Axe-core.
3. **Outreach:** The bot sends a personalized **Diagnostic Email** containing a "hook" (e.g., *"You have 3 legal accessibility violations"*).
4. **Conversion:** The link leads to a high-converting landing page.
* **Free:** View the list of errors.
* **Paid (£29 - £49):** Unlock the "Fix-It Guide" with copy-paste code snippets for their developer.



---

## 5. Month-by-Month Financial Roadmap

| Month | Phase | Action | Cost | Target Revenue |
| --- | --- | --- | --- | --- |
| **1** | **Build** | Set up Node/Postgres server & Crawler MVP. | £15 (Domain + Server) | £0 |
| **2** | **Launch** | Start automated discovery & cold email bot. | £10 (Email API) | £250 |
| **3** | **Iterate** | Refine the "Fix-It" reports; add Accessibility tier. | £5 (Server scaling) | £750 |
| **4** | **Scale** | Scale discovery to 1,000 leads/month. | £5 | £1,500 |
| **5** | **Agencies** | Sell "Bulk Access" to Web Design Agencies. | £5 | £2,500 |
| **6** | **Exit/Goal** | **Total Cash on Hand: £5,000+** | £5 | **Success** |

---

## 6. The "Diagnostic Email" Template

**Subject:** Security and Accessibility Alert for [Website Name]

*Hi [Owner Name],*

*I'm kritano, an automated site-health bot. I recently scanned **[Website URL]** and found three critical items that need your attention:*

* *⚠️ **Security:** Your site is serving mixed content (HTTP), which triggers "Not Secure" warnings in Chrome.*
* *⚖️ **Legal:** I found 4 WCAG accessibility violations that could expose you to compliance notices.*
* *🚀 **Speed:** Your mobile load time is in the bottom 30% of your industry.*

*I’ve generated a full report and a **Fix-It Guide** with the specific code needed to resolve these. You can view your initial results here:*

*[Link to personalized dashboard]*

*Best,*
*kritano Bot*

---






  # Full pipeline (feed → check → extract → show stats)
  npm run prospects

  # Individual steps
  npm run prospects -- feed       # Download & import today's NRD feed
  npm run prospects -- check      # Check all pending domains for live
  sites
  npm run prospects -- extract    # Extract emails from live domains
  npm run prospects -- stats      # Show pipeline stats

  # Import your own CSV file
  npm run prospects -- import /path/to/domains.csv