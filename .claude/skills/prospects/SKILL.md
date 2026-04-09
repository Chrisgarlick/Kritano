---
name: prospects
description: Find web agencies, digital marketing agencies, and SEO agencies in a specific location. Checks each domain for liveness, extracts contact details, and publishes qualified prospects to Notion. Use when you want to build a cold outreach list for a given city or region.
user-invocable: true
argument-hint: location e.g. manchester or shopify agencies leeds
---

# Prospects Skill - Location-Based Agency Discovery

Find web/digital/SEO agencies in a specific location, check their websites, extract contact details, and publish a qualified prospect list to Notion.

## Input

The user's prompt: $ARGUMENTS

Examples:
- `/prospects manchester` - find all types of agencies in Manchester
- `/prospects SEO agencies london` - find SEO-specific agencies in London
- `/prospects shopify agencies leeds` - find Shopify specialists in Leeds
- `/prospects web design birmingham` - find web design agencies in Birmingham

## Workflow

### 1. Parse the input

Extract:
- **Location** (required): city, region, or country
- **Specialisation** (optional): SEO, web design, Shopify, WordPress, ecommerce, etc.
- If no specialisation given, search broadly across web design, digital marketing, and SEO

### 2. Search for agencies

Read `search-strategy.md` for the full query playbook.

Run **6-8 WebSearches** using the templates from `search-strategy.md`, replacing `{location}` and `{specialisation}` with the parsed values.

For each search result:
- Extract agency names and website domains from the results
- Use **WebFetch** on promising directory pages (Clutch, DesignRush, Manifest listings) to extract additional agency domains from the page content

Focus on:
- Agency directories (Clutch, The Manifest, DesignRush, GoodFirms, Agency Spotter)
- Google search results for `"agency" + {location}`
- Review/listing sites that aggregate agencies by location

### 3. Compile and deduplicate domains

- Build a unique list of agency domains (strip www, normalise to root domain)
- Remove obvious non-agencies (social media URLs, directory pages themselves, generic platforms)
- Save to `docs/prospects/{location}-{YYYY-MM-DD}/raw-domains.txt`

Present the count to the user:
```
Found 38 potential agency domains in Manchester. Checking them now...
```

### 4. Check domains and extract contacts

Run the check-and-extract script:

```bash
bash .claude/skills/prospects/check-and-extract.sh docs/prospects/{location}-{date}/raw-domains.txt docs/prospects/{location}-{date}/prospects.json
```

This processes each domain:
1. HTTP liveness check (HTTPS first, then HTTP fallback)
2. HTML parsing for title, meta description, tech stack
3. Agency signal detection (keywords: "agency", "digital", "web design", "marketing", "creative", "studio", "development company")
4. Email extraction from homepage + /contact + /about pages
5. Social media link extraction (LinkedIn, Twitter, etc.)
6. Quality scoring (0-100)
7. Filtering: only agencies with email or contact form, score >= 40

For ~40 domains this takes about 2-3 minutes. Report progress as the script runs.

If the script fails partway through, it can be re-run - it will skip domains already processed.

### 5. Present results and publish to Notion

Show a summary table of qualified prospects, then **immediately publish to Notion** (no confirmation needed).

```
## Qualified Prospects: Manchester (22/38)

| Agency | Domain | Email | Score | Tech |
|--------|--------|-------|-------|------|
| Acme Digital | acme.digital | hello@acme.digital | 85 | WordPress |
| ... | ... | ... | ... | ... |

16 domains filtered out (8 parked, 4 no contact info, 3 not agencies, 1 dead)
```

### 6. Publish to Notion

Run:
```bash
bash .claude/skills/prospects/publish-to-notion.sh docs/prospects/{location}-{date}/prospects.json "Agency Prospects - {Location} - {date}"
```

This creates a single Notion page under Kritano with:
- A callout summarising the search (location, date, stats)
- Each prospect as a heading + detail block:
  - Agency name (heading)
  - Domain, email, tech stack, quality score
  - Social links (LinkedIn, Twitter, etc.)
  - Whether they have a contact form
  - Any notable details (e.g. "WordPress agency", "Shopify partner")

All prospects on ONE scrollable page for easy browsing.

### 7. Output summary

Report:
- Number of prospects found and qualified
- File paths (raw-domains.txt, prospects.json)
- Notion page link
- Reminder: outreach is done manually via external mailbox

## Deduplication

The skill maintains a `docs/prospects/known-domains.txt` file that tracks every domain ever processed. When you run `/prospects` for the same location (or overlapping locations), already-known domains are automatically skipped. After each run, all processed domains (qualified or not) are appended to the known list.

This means running `/prospects newcastle` twice will only check new domains the second time.

## Output Files

All output goes to `docs/prospects/{location}-{YYYY-MM-DD}/`:

- `raw-domains.txt` - All discovered domains (one per line, after dedup filtering)
- `prospects.json` - Qualified prospects with full extracted data

## Content Rules

- **Generic emails only** - never store or display personal emails (john@, j.smith@). Only info@, hello@, contact@, team@, sales@, etc.
- **No automated outreach** - this skill produces a list. Emails are sent manually.
- **British English** throughout
- **No competitor promotion** - never recommend competing audit tools

## Compliance

- Generic/role-based business emails only (per GDPR Legitimate Interest Assessment)
- Personal emails are filtered out and never displayed
- Data stored locally as JSON + Notion only (no database changes)
- The skill does NOT send emails - it produces a list for manual, personalised outreach

## Reference Files

| File | Purpose |
|------|---------|
| `search-strategy.md` | WebSearch query templates per location and specialisation |
| `check-and-extract.sh` | Domain checking + email extraction script |
| `publish-to-notion.sh` | Publish prospect list to Notion |
