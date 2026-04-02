# Cold Prospect Pipeline

The prospect pipeline discovers newly registered domains, checks if they have live websites with contact emails, and saves only the qualified ones to the database for outreach.

## How It Works

The pipeline runs entirely in-memory — only qualified prospects (live site + contact email) are stored in the database.

1. **Download** — Fetches yesterday's NRD (Newly Registered Domain) feed from WhoisDS
2. **DNS Filter** — Kills domains without A/AAAA records (no website possible)
3. **HTTP Check** — Visits each domain, checks if it's live and not parked/placeholder
4. **Email Extraction** — Scrapes homepage footer + /contact, /contact-us, /about pages for emails
5. **Save** — Only domains with a valid contact email are inserted into the database as `qualified`

Checkpoints are saved between steps so the pipeline can resume if interrupted.

---

## Commands

### Run the full pipeline

```bash
npm run prospects
```

Runs all steps. Resumes from the last checkpoint if interrupted.

### View pipeline settings

```bash
npm run prospects -- settings
```

### Update a setting

```bash
npm run prospects -- set <key> <value>
```

Available settings:

| Key | Description | Default |
|-----|-------------|---------|
| `daily_limit` | Max domains to process per run | `2500` |
| `email_limit` | Max outreach emails per day | `50` |
| `min_score` | Minimum quality score to qualify | `30` |
| `tlds` | Comma-separated TLDs to include | `com,co.uk,org.uk,uk,io,co,net` |
| `excluded` | Comma-separated keywords to exclude | `casino,poker,xxx,...` |
| `auto_outreach` | Auto-send outreach emails (true/false) | `false` |

Examples:

```bash
npm run prospects -- set daily_limit 2500
npm run prospects -- set min_score 40
npm run prospects -- set tlds com,co.uk,io
```

### View stats

```bash
npm run prospects -- stats
```

Shows total qualified prospects, email/name counts, quality scores, and conversion rates.

### Export qualified prospects

```bash
npm run prospects -- export
```

Exports all qualified/contacted/converted prospects to `qualified-prospects-YYYY-MM-DD.json`.

### Import from CSV

```bash
npm run prospects -- import <file.csv>
```

Imports domains from a CSV file and runs them through the full pipeline (DNS → HTTP → Extract → Save). The CSV should have one domain per line or a `domain` column.

### Purge old data

```bash
npm run prospects -- purge
```

Deletes all non-qualified rows from the database (pending, dead, checking, etc.). Use this to clean up if old pipeline runs left junk in the DB.

### Reset checkpoints

```bash
npm run prospects -- reset
```

Clears all pipeline checkpoints so the next run starts fresh. Use this if you want to re-run the pipeline from scratch (e.g. after changing settings or updating the scraping logic).

---

## Pipeline Funnel (typical numbers)

```
Feed domains:       ~70,000  (raw NRD feed)
After TLD filter:    ~5,000  (matched target TLDs)
After daily limit:    2,500  (capped by daily_limit setting)
After DNS filter:    ~2,000  (80% have DNS records)
Live websites:         ~800  (40% are live, not parked)
Qualified (email):    ~200   (25% of live sites have contact emails)
```

---

## Database

Only qualified prospects are stored in the `cold_prospects` table. Status progresses:

- `qualified` — Live site with contact email, ready for outreach
- `contacted` — Outreach email sent
- `converted` — Signed up as a Kritano user
