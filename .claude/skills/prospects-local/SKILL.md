---
name: prospects-local
description: Find local businesses with websites in a specific location and industry. Extracts contact details and publishes to Notion. Use for cold outreach to solicitors, dentists, restaurants, tradespeople, etc.
user-invocable: true
argument-hint: industry + location e.g. solicitors newcastle or dentists manchester
---

# Local Business Prospects

Find local businesses with websites by industry and location, extract contact details, and publish to Notion.

## Input

The user's prompt: $ARGUMENTS

If the user passes "help" as the argument, show the sector list below and stop. Do not run any searches.

### Help / Sector List

If prompted with `/prospects-local help`, display this and stop:

```
Local Business Prospect Sectors:

  Professional Services:
    solicitors          - law firms, legal practices
    accountants         - accountancy firms, bookkeepers
    architects          - architecture practices, planning consultants
    financial-advisors  - IFAs, wealth management, mortgage brokers
    consultants         - management, IT, HR consultants

  Healthcare:
    dentists            - dental practices, orthodontists
    vets                - veterinary practices, animal hospitals
    opticians           - optometrists, eye care
    physiotherapists    - physio clinics, sports therapy
    private-clinics     - private healthcare, cosmetic clinics

  Property & Construction:
    estate-agents       - estate agents, lettings agents
    builders            - construction companies, building firms
    electricians        - electrical contractors
    plumbers            - plumbing & heating firms
    roofers             - roofing companies

  Hospitality & Leisure:
    restaurants         - restaurants, cafes, bistros
    hotels              - hotels, B&Bs, guest houses
    gyms                - gyms, fitness studios, personal trainers
    salons              - hair salons, barbers, beauty salons
    wedding-venues      - wedding venues, event spaces

  Other:
    recruitment         - recruitment agencies, staffing firms
    nurseries           - nurseries, childcare, preschools
    driving-schools     - driving instructors, driving schools
    car-dealerships     - used car dealers, garages, MOT centres

Usage: /prospects-local <sector> <location>
Example: /prospects-local solicitors newcastle
```

### Standard Examples

- `/prospects-local solicitors newcastle` - find solicitors in Newcastle
- `/prospects-local dentists manchester` - find dental practices in Manchester
- `/prospects-local restaurants leeds` - find restaurants in Leeds
- `/prospects-local accountants birmingham` - find accountancy firms in Birmingham
- `/prospects-local estate agents north east` - find estate agents across the North East

## Workflow

### 1. Parse the input

Extract:
- **Industry** (required): solicitors, dentists, restaurants, accountants, estate agents, plumbers, etc.
- **Location** (required): city, region, or area

### 2. Search for businesses

Run **6-8 WebSearches** targeting:
- `"{industry}" {location}` (e.g. `"solicitors" Newcastle upon Tyne`)
- `"{industry}" near {location} website`
- `best {industry} {location} reviews`
- `site:yell.com {industry} {location}`
- `{industry} {location} site:google.com/maps`
- `"{industry} firm" {location}` or `"{industry} practice" {location}` (for professional services)
- `top {industry} {location} 2026`

Use **WebFetch** on directory listing pages (Yell, Google results, Thomson Local, industry-specific directories) to extract business names and website URLs.

### 3. Compile and deduplicate domains

- Build unique domain list (strip www, normalise)
- Remove directory sites themselves (yell.com, google.com, yelp.com, etc.)
- Remove social media profiles
- Save to `docs/prospects/local-{industry}-{location}-{date}/raw-domains.txt`

### 4. Check domains and extract contacts

Run the shared generic check script in **local** mode (no keyword filter - any live business qualifies):

```bash
bash .claude/skills/prospects/check-and-extract-generic.sh docs/prospects/local-{industry}-{location}-{date}/raw-domains.txt docs/prospects/local-{industry}-{location}-{date}/prospects.json local
```

### 5. Present results and publish to Notion

Show a summary table, then immediately publish. Pass sector and location as separate arguments:

```bash
bash .claude/skills/prospects-local/publish-to-notion.sh docs/prospects/local-{industry}-{location}-{date}/prospects.json {industry} {location} {total_discovered}
```

This auto-creates a sector page if it doesn't exist, then nests the location run under it:
```
Kritano > Local Business Prospects > Solicitors > Solicitors - Newcastle - 2026-04-08
```

Running `/prospects-local solicitors manchester` later will add Manchester under the same Solicitors page.

### 6. Output summary

Report: prospect count, file paths, Notion link.

## Deduplication

Uses the shared `docs/prospects/known-domains.txt` - same dedup list across all prospect types (agencies, local, ecommerce). No duplicates across any runs.

## Output Files

`docs/prospects/local-{industry}-{location}-{YYYY-MM-DD}/`:
- `raw-domains.txt` - discovered domains
- `prospects.json` - qualified prospects

## Compliance

- Generic/role-based business emails only
- No unsolicited auditing - only publicly visible information is collected
- No automated outreach - list is for manual use
