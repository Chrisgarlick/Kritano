# AI Visibility — Feature Specification
**PagePulser (Kritano)**
**Status:** Planned
**Available on:** Pro, Agency, Enterprise

---

## Overview

AI Visibility is an on-demand feature that checks whether a business appears in AI-generated responses for their target keywords. As AI-powered search (Claude, ChatGPT, Perplexity) becomes a primary discovery channel, traditional SEO rankings alone no longer tell the full story. This feature gives users a confidence score for how visible their brand is when people ask AI about their product category.

---

## How It Works

1. The user navigates to a specific site in their PagePulser dashboard
2. They click **"Check AI Visibility"**
3. They select or confirm the keywords they want to probe (pulled from their existing SEO data, or entered manually)
4. PagePulser sends probe queries to multiple AI models and analyses the responses
5. Results are returned as a per-keyword visibility score with supporting detail

---

## Keyword Selection

- Keywords are pre-populated from the site's existing SEO/ranking data within PagePulser
- Users can add, remove, or replace keywords before running a check
- Recommended limit: **10 keywords per check** (balances cost, speed, and relevance)
- Each keyword generates multiple query variants automatically, e.g.:
  - `"best [keyword]"`
  - `"recommend a [keyword]"`
  - `"what [keyword] should I use?"`
  - `"does [brand] work for [keyword]?"`

---

## Models Queried

Each probe is run against the following models:

| Model | Provider | Purpose |
|---|---|---|
| Claude Haiku | Anthropic | Primary — cost efficient |
| GPT-4o mini | OpenAI | Broad coverage |
| Perplexity (Sonar) | Perplexity AI | Web-grounded AI search |

Each keyword variant is run **5 times per model** to account for response non-determinism. Results are aggregated into a single score per keyword per model.

---

## Confidence Score

Each keyword receives a visibility score per model:

| Score | Criteria |
|---|---|
| **High** | Brand/domain mentioned in top 3 results or named explicitly |
| **Medium** | Brand mentioned but not prominently, or mentioned inconsistently across runs |
| **Low** | Brand rarely appears across runs |
| **Not Visible** | Brand not mentioned in any response |
| **⚠ Flagged** | Brand mentioned negatively or in a misleading context |

An overall **AI Visibility Score** is calculated as a weighted average across all keywords and models.

---

## Caching

To avoid unnecessary API costs and ensure a smooth experience:

- Results are **cached for 48 hours** per keyword set per site
- If a user reruns a check with the **same keywords within 48 hours**, the cached result is shown instantly with a timestamp indicating when it was last run
- A **"Force refresh"** option is available to bypass the cache if needed (consumes a new check)
- Changing the keyword selection (adding/removing keywords) triggers a fresh check for the new/changed keywords only; unchanged keywords use cached data if still within the 48-hour window

---

## Plan Availability

| Feature | Starter | Pro | Agency | Enterprise |
|---|---|---|---|---|
| AI Visibility Check | ❌ | ✅ | ✅ | ✅ |
| Checks per month | — | Unlimited* | Unlimited* | Unlimited* |
| Keyword limit per check | — | 10 | 10 | 10 |
| Multi-model (3 models) | — | ✅ | ✅ | ✅ |
| Historical trend view | — | ✅ | ✅ | ✅ |
| Export results | — | ❌ | ✅ | ✅ |
| Multi-site batch check | — | ❌ | ✅ | ✅ |

*Unlimited subject to 48-hour cache — same keyword set won't re-run within that window.

---

## UX Notes

- The check is **manually triggered** — it does not run automatically as part of the standard audit
- Results should be displayed in a dedicated **"AI Visibility"** tab within the site dashboard
- Each keyword shows an expandable detail view with:
  - Sample AI responses that mention (or don't mention) the brand
  - Per-model breakdown
  - Trend chart if historical data exists
- A plain-language **recommendation** is generated per keyword, e.g.:
  - *"You don't appear for 'SEO auditor' on any model. Consider adding FAQ schema and authoritative content targeting this query."*

---

## Technical Notes

- Probes are queued via **BullMQ** as a distinct job type (`ai-visibility-check`)
- Jobs are rate-limited per model to respect API quotas
- Cache keys are stored in **Redis** as `ai-visibility:{siteId}:{keywordHash}`
- TTL on cache keys: **172800 seconds (48 hours)**
- Results stored in the PagePulser database against the site record for historical trending
- Total estimated cost per check: **$0.10–$0.80** depending on keyword count and models used

---

## Future Considerations

- Scheduled recurring checks (weekly/monthly) for Agency and Enterprise
- Aggregate trend data across the PagePulser user base (anonymised) — which industries are least visible in AI responses
- Competitor comparison: check how a rival domain appears for the same keywords
- Alerts when visibility score drops significantly between checks