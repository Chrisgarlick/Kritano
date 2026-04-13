---
name: prospects-freelance
description: Find freelance web developers and SEO freelancers in a specific location. Checks each domain for liveness, extracts contact details, and publishes qualified prospects to Notion. Use when you want to build a cold outreach list of freelancers for a given city or region.
user-invocable: true
argument-hint: location e.g. manchester or SEO freelancer leeds
---

# Prospects Skill - Freelance Web Developer & SEO Discovery

Find freelance web developers and SEO specialists in a specific location, check their websites, extract contact details, and publish a qualified prospect list to Notion.

## Input

The user's prompt: $ARGUMENTS

Examples:
- `/prospects-freelance manchester` - find all types of freelancers in Manchester
- `/prospects-freelance SEO freelancer london` - find SEO freelancers in London
- `/prospects-freelance wordpress developer leeds` - find WordPress freelancer developers in Leeds
- `/prospects-freelance web developer birmingham` - find freelance web devs in Birmingham

## Workflow

### 1. Parse the input

Extract:
- **Location** (required): city, region, or country
- **Specialisation** (optional): SEO, web development, WordPress, Shopify, frontend, etc.
- If no specialisation given, search broadly across freelance web developers, freelance SEO, and freelance web designers

### 2. Search for freelancers

Read `search-strategy.md` for the full query playbook.

Run **6-8 WebSearches** using the templates from `search-strategy.md`, replacing `{location}` and `{specialisation}` with the parsed values.

For each search result:
- Extract freelancer names and website domains from the results
- Use **WebFetch** on promising directory pages (Clutch, PeoplePerHour, Bark, Sortlist listings) to extract additional freelancer domains from the page content

Focus on:
- Personal portfolio sites (the primary target)
- Freelancer directories and profiles that link to personal websites
- Google search results for `"freelance" + "web developer" + {location}`
- Blog posts and lists that aggregate freelancers by location

### 3. Compile and deduplicate domains

- Build a unique list of freelancer domains (strip www, normalise to root domain)
- Remove obvious non-freelancers (agency sites with 10+ staff, social media URLs, directory pages themselves, generic platforms)
- Save to `docs/prospects/{location}-freelance-{YYYY-MM-DD}/raw-domains.txt`

Present the count to the user:
```
Found 32 potential freelancer domains in Manchester. Checking them now...
```

### 4. Check domains and extract contacts

Run the check-and-extract script:

```bash
bash .claude/skills/prospects-freelance/check-and-extract.sh docs/prospects/{location}-freelance-{date}/raw-domains.txt docs/prospects/{location}-freelance-{date}/prospects.json
```

This processes each domain:
1. HTTP liveness check (HTTPS first, then HTTP fallback)
2. HTML parsing for title, meta description, tech stack
3. Freelancer signal detection (keywords: "freelance", "independent", "consultant", "portfolio", "available for hire", etc.)
4. Email extraction from homepage + /contact + /about pages
5. Social media link extraction (LinkedIn, Twitter, GitHub, etc.)
6. Quality scoring (0-100)
7. Filtering: only freelancers with email or contact form, score >= 40

For ~30 domains this takes about 2-3 minutes. Report progress as the script runs.

If the script fails partway through, it can be re-run - it will skip domains already processed.

### 5. Present results and publish to Notion

Show a summary table of qualified prospects, then **immediately publish to Notion** (no confirmation needed).

```
## Qualified Prospects: Manchester Freelancers (18/32)

| Name | Domain | Email | Score | Speciality |
|------|--------|-------|-------|------------|
| Jane Smith | janesmith.dev | hello@janesmith.dev | 82 | Frontend, React |
| ... | ... | ... | ... | ... |

14 domains filtered out (5 parked, 4 no contact info, 3 not freelancers, 2 dead)
```

### 6. Publish to Notion

Run:
```bash
bash .claude/skills/prospects-freelance/publish-to-notion.sh docs/prospects/{location}-freelance-{date}/prospects.json "Freelance Prospects - {Location} - {date}"
```

This creates a single Notion page under Kritano with:
- A callout summarising the search (location, date, stats)
- Each prospect as a heading + detail block:
  - Freelancer name (heading)
  - Domain, email, tech stack, quality score
  - Social links (LinkedIn, Twitter, GitHub, etc.)
  - Whether they have a contact form
  - Any notable details (e.g. "React specialist", "SEO consultant", "WordPress developer")

All prospects on ONE scrollable page for easy browsing.

### 7. Output summary

Report:
- Number of prospects found and qualified
- File paths (raw-domains.txt, prospects.json)
- Notion page link
- Reminder: outreach is done manually via external mailbox

## Deduplication

The skill shares the `docs/prospects/known-domains.txt` file that tracks every domain ever processed across all prospect skills. When you run `/prospects-freelance` for the same location (or overlapping locations), already-known domains are automatically skipped. After each run, all processed domains (qualified or not) are appended to the known list.

This means running `/prospects-freelance newcastle` twice will only check new domains the second time.

## Output Files

All output goes to `docs/prospects/{location}-freelance-{YYYY-MM-DD}/`:

- `raw-domains.txt` - All discovered domains (one per line, after dedup filtering)
- `prospects.json` - Qualified prospects with full extracted data

## Content Rules

- **Generic emails only** - never store or display personal emails (john@, j.smith@). Only info@, hello@, contact@, team@, etc.
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
