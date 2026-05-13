# The AEO Optimisation Guide

How to structure your content so AI models cite your pages instead of your competitors'.

AI Engine Optimisation (AEO) is the practice of getting your content surfaced and cited by large language models like ChatGPT, Claude, Perplexity, and Gemini. The signals that drive AI citation overlap with classical SEO but are not identical. This guide is the framework Kritano uses internally and the one we audit against in our AEO scan.

This is not a list of hacks. AI engines reward structure, citability, and demonstrable expertise. The work translates directly into stronger classical SEO as a side effect.

### Contents

1. The fundamental shift
2. The five pillars of AEO
3. The AEO audit framework
4. Common AEO mistakes
5. A six-week AEO programme
6. What AEO is not
7. How Kritano helps

## 1. The fundamental shift

Classical SEO optimises for **ranking on a query**. AEO optimises for **being quoted in an answer**.

These reward different patterns. A page that ranks #1 for "how to fix Core Web Vitals" can be invisible to ChatGPT if the content is buried behind a long intro, hidden in a video, or scattered across multiple sub-pages.

The mental model that works:

```
SEO answer = your link in the results
AEO answer = your sentence in the response, with your URL as the citation
```

Both matter. AEO is currently the higher-leverage of the two because:

- AI search volume is growing 30x year-over-year while classical search volume is flat.
- AI answers cite a small number of sources (typically 3-8), creating a more concentrated winner-takes-most market.
- Most sites have not optimised for it yet. Easy wins are still on the table.

## 2. The five pillars of AEO

Kritano's AEO audit scores against five pillars. Each is a discrete capability you can improve independently.

### 2.1 Content frontloading

AI models index and quote the **first 100-200 words** of a page more heavily than the rest. If your answer lives in paragraph 6, you are not being quoted.

The fix is structural:

- State the answer to the page's core question in the first paragraph.
- Define key terms in the first 100 words.
- Save the journalistic intro for after the answer.

**Before:**
> "There has been a lot of discussion lately about Core Web Vitals. In this post, we will explore what they are and how to improve them. First, a little history. Google introduced Core Web Vitals in 2020..."

**After:**
> "Core Web Vitals are three metrics Google uses to score real-user experience on a page: Largest Contentful Paint (loading), Interaction to Next Paint (responsiveness), and Cumulative Layout Shift (visual stability). To pass, 75% of mobile page loads must hit the targets: LCP under 2.5s, INP under 200ms, CLS under 0.1."

The second opens with the answer. AI models will quote the second; the first never gets to be useful.

### 2.2 Citation-friendly structure

AI engines prefer pages that are easy to attribute. The patterns they reward:

- **Definitive single-sentence facts.** "X is Y" sentences. Avoid hedging unless the hedge is the point.
- **Numbered lists.** Steps, options, criteria. Each item self-contained.
- **Comparison tables.** Side-by-side rows with clear column headers.
- **Stats with sources.** Inline citations or a Sources section, with the source domain on the same page.
- **Glossaries.** Term-definition pairs are quoted heavily.

Avoid:

- Long anecdotal openings before facts.
- Pronoun-heavy sentences ("It does this when they..."). The model loses the antecedent and either skips the line or quotes it weirdly.
- Facts wrapped in marketing copy. "Our amazing system delivers blistering performance" is not a fact. "Our average crawl time is 2.4 seconds for a 100-page site" is.

### 2.3 Structured data and metadata

AI crawlers parse the same JSON-LD humans do, but more aggressively. The schema types that matter most:

- **`Article`** with `headline`, `datePublished`, `dateModified`, `author`, and `image`. The author block should be a real `Person` with a `sameAs` link to a verifiable profile.
- **`FAQPage`** for pages structured as Q&A. Answers must match visible content exactly.
- **`HowTo`** for procedural content. Each step has a name and a description.
- **`Organization`** on the homepage, with a `logo` URL and `sameAs` links to social profiles.
- **`Person`** for author pages, with `jobTitle`, `worksFor`, and verifiable `sameAs` links.

If your page is about a person, an organisation, or a product, AI engines will try to identify which one. Make it easy: ship the schema.

### 2.4 Authority signals

AI engines have started to weigh source reputation heavily. The signals that move the needle:

- **Authored, not anonymous.** Pages without a named author or organisation rank lower in AI answer citations. Add an author byline. Link to a real author page.
- **Author has a public footprint.** Verifiable expertise in the topic. LinkedIn profile, conference talks, papers, prior writing. The model can usually find this. If they cannot, you look unauthored.
- **Cited elsewhere.** Pages cited by Wikipedia, .gov, .edu, or industry trade publications carry weight. Less so by quantity, more so by source quality.
- **Direct, factual content style.** Hedging language ("might", "could", "in some cases") suggests uncertainty. Models prefer confident sources for confident answers. (Within reason. Hedging where genuinely warranted is fine; hedging by default is not.)

### 2.5 Crawler accessibility

AI engines use their own crawlers. They are not Googlebot.

| Engine | Crawler user-agent | Notes |
|--------|-------------------|-------|
| OpenAI (ChatGPT) | `GPTBot` for training; `OAI-SearchBot` for live answers | Honour `robots.txt`. Block `GPTBot` if you don't want training; keep `OAI-SearchBot` allowed |
| Anthropic (Claude) | `ClaudeBot` for training; `Claude-User` for inference | Same split as OpenAI |
| Perplexity | `PerplexityBot` | Mostly inference-time |
| Google Gemini | `Google-Extended` user-agent for AI training | Blocked separately from regular Googlebot via `robots.txt` |

To be cited in answers, the inference-time bots must be allowed. Many sites have inadvertently blocked all AI crawlers in `robots.txt` and then wonder why they aren't being cited.

Sample `robots.txt` allowing inference, blocking training:

```
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /
```

Confirm the configuration with `curl -A "OAI-SearchBot" https://yourdomain.com/important-page`. The page should return 200 and complete HTML.

## 3. The AEO audit framework

Run this audit against any page you want to be cited. Each item is binary or three-state (yes / partial / no).

### Frontloading (12 points)

- [ ] The page's main question is answered in the first 100 words.
- [ ] Key terms used in the title are defined on this page (not just linked out).
- [ ] The first heading after the H1 sets up the body, not an unrelated tangent.
- [ ] The first sentence does not start with "In this post" or similar meta-framing.

### Citability (12 points)

- [ ] Page contains at least one definitive single-sentence fact suitable for direct quoting.
- [ ] Numbered lists are used for procedural content (steps, criteria).
- [ ] Statistics include their source on the same page.
- [ ] Pronouns are tight. Most sentences could be quoted standalone.

### Structure (16 points)

- [ ] `Article` JSON-LD with named author and dates.
- [ ] Author block links via `sameAs` to a verifiable profile.
- [ ] FAQ-style sections use `FAQPage` schema with exact-match answers.
- [ ] HowTo content uses `HowTo` schema with `step` objects.

### Authority (12 points)

- [ ] Named author with a public footprint (LinkedIn, GitHub, paper, conference).
- [ ] Author page exists at a stable URL.
- [ ] Organisation schema on the homepage with `sameAs` social links.
- [ ] Page is cited by at least one third-party source (search "site title" + "your name").

### Accessibility to crawlers (8 points)

- [ ] `robots.txt` does not block `OAI-SearchBot`, `Claude-User`, `PerplexityBot`.
- [ ] Page content is in the initial HTML (not client-rendered after JavaScript).

Total: 60 points. Above 45 puts you in citable territory. Below 30 and you are essentially invisible to AI answer engines.

## 4. Common AEO mistakes

These are the failures we see most often in Kritano AEO scans.

### Hiding the answer in a long intro

The single most common mistake. Site owners write a journalistic lede because they were trained on op-ed style. The model never gets to the answer because the model never quotes the lede.

### Heavy JavaScript rendering with no SSR

If the page is empty in the initial HTML and a JS bundle populates it, only some AI crawlers will see the content. `GPTBot` does run JavaScript; `Claude-User` does not (as of 2025-11). Pages should ship the answer in the initial HTML regardless.

### Brand-first rather than question-first headlines

"How Acme's New Platform Is Changing Accessibility" gets quoted less than "Five common WCAG failures (and how to fix them)". The model rewards content that answers the user's question; the user did not ask about Acme.

### Author blocks that say "By the team"

Anonymous-ish authorship reads as low-trust to both AI and human readers. A real name with a profile link materially shifts citation rates.

### `FAQPage` schema that doesn't match the visible content

AI engines penalise schema-content mismatch (and Google's Rich Results Test will flag it). The answer in the schema must match the answer on the page. Don't write rich-results-bait that doesn't appear.

### Missing or stale `dateModified`

When two pages cover the same topic, AI engines often prefer the more recently updated one. A `dateModified` from three years ago signals stale content. Update it when the content materially changes.

### Hedging by default

Confident sources get quoted; hedging sources get summarised. "X may sometimes lead to Y in some cases" is not a quotable sentence. Where the hedge is genuine, keep it; where it's habitual, cut it.

## 5. A six-week AEO programme

A practical roadmap that produces measurable citation improvements within two months.

### Week 1: Audit and baseline

- Run a Kritano AEO scan against every published article on the site.
- Identify the bottom-quartile pages: which ones are not citable today?
- Identify the top-quartile pages: which ones are already strong?
- Search for your site title plus relevant queries in ChatGPT, Claude, Perplexity. Note which pages get cited and which do not.

### Week 2: Crawler audit

- Check `robots.txt` for inadvertent blocks.
- Curl as each major AI crawler against your top 10 pages. Confirm 200 + content.
- Fix any blocks or rendering issues.

### Week 3-4: Frontloading sweep

- For each bottom-quartile page, rewrite the first 200 words to answer the page's core question definitively in the first paragraph.
- Move the journalistic intro down, or cut it.
- Re-run the AEO scan. Score should jump 10-20 points per rewritten page.

### Week 5: Schema and author signals

- Add or strengthen `Article` schema on every article.
- Ensure every article has a named author with a public footprint.
- Build out the author pages with `Person` schema, `sameAs` profiles, and a short bio.

### Week 6: Measurement

- Re-search your target queries in each major AI engine.
- Note which pages now get cited.
- Track over the next 90 days; AI engine indexes catch up to changes on roughly that timescale.

Expect to see measurable citation uplift on 30-50% of rewritten pages within 90 days. The pattern is uneven: some pages flip immediately, others take 6+ months as the model's index updates.

## 6. What AEO is not

A few useful clarifications:

- **It is not gaming the system.** Models are tuned to reward the same things human readers reward: clarity, accuracy, authority. The work translates.
- **It is not a substitute for classical SEO.** It is additive. The same site can be #1 on Google and unreadable to ChatGPT, or vice versa. You need both.
- **It is not stable.** Model behaviour changes. The patterns in this guide reflect 2025-late observed behaviour. Re-audit annually.
- **It is not free of overlap with E-E-A-T.** Experience, Expertise, Authoritativeness, Trustworthiness — Google's framework. AI engines weight similar signals. A strong E-E-A-T page is usually a strong AEO page.

## 7. How Kritano helps

Kritano's AEO audit runs every check in this guide automatically. The output is:

- A per-page AEO score against the five pillars.
- A list of specific frontloading rewrites needed.
- Schema completeness and validity.
- Crawler accessibility check (curl as each major AI bot).
- An "AI visibility" feature that periodically queries ChatGPT, Claude, Perplexity, and Gemini for your target topics and records which pages get cited.

The combination produces a feedback loop: scan, fix, re-search, see the citation move.

[Start a free scan at kritano.com](https://kritano.com).
