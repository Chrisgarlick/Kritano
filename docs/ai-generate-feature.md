# AI Generate Feature — Implementation Plan

## Overview

A dedicated "Generate" page where Pro+ users can send their audit results to an LLM and receive AI-generated SEO and content improvements. The LLM receives a lean payload (~1-2KB) extracted from audit data and returns structured suggestions.

## Tier Gating

- **Pro, Agency, Enterprise** — Full access
- **Starter** — Locked with upgrade prompt
- **Free** — Locked with upgrade prompt

## LLM Backend

### Infrastructure
- **Model:** gemma3:2b (via Ollama)
- **Current:** Ollama running locally on dev machine
- **Production:** Dedicated server running Ollama with gemma3:2b
- **API:** `POST http://<ollama-host>:11434/api/generate`

### Why gemma3:2b
- Fast inference (~1-3s per generation)
- Small memory footprint (~2GB VRAM)
- Good enough for structured text generation with tight prompts
- Self-hosted = no per-token costs, no rate limits, full data privacy

### Key Constraint
gemma3:2b has a small context window and limited reasoning. The payload MUST be lean (<500 tokens input). Pre-digest all audit data before sending — the LLM receives findings and scores, not raw HTML metrics.

---

## Payload Design

### What gets sent to the LLM (see `sample-ai-generate-payload.json`)

~1-2KB JSON with:
- URL, title, meta description, word count, content type
- Scores (SEO + content + subscores)
- Current keyword data (keyword, density, placements, variations)
- H1 + H2 headings (content topic signals)
- Findings (serious + moderate only, id + severity + message)

### What does NOT get sent
- Raw HTML metrics (boilerplate ratio, syllable counts, etc.)
- Info/minor findings (noise for the LLM)
- Image/link inventories
- Structured data details
- Full audit metadata (id, timestamps, status)

---

## Generation Types

The Generate page offers multiple generation types. Each uses a different system prompt but the same lean payload.

### 1. SEO Keywords
**Prompt strategy:** Given the current keyword, headings, and content type, suggest 10-15 new target keywords — a mix of primary, secondary, and long-tail.

**Output:**
```json
{
  "primary": ["core web vitals optimisation", "website speed optimisation"],
  "secondary": ["page load time improvement", "image compression for web"],
  "longTail": ["how to improve largest contentful paint", "best caching strategy for wordpress"]
}
```

### 2. Meta Description Rewrite
**Prompt strategy:** Given the current meta description, title, keyword, and findings, write 3 improved meta descriptions (120-155 chars each).

**Output:**
```json
{
  "options": [
    "Improve your website performance with proven techniques for Core Web Vitals, image optimisation, and caching. Practical guide with real results.",
    "Website running slow? This guide covers LCP, INP, CLS fixes plus image and caching strategies that cut load times by 50%.",
    "A hands-on guide to website performance — Core Web Vitals explained, image optimisation tips, and caching strategies that actually work."
  ]
}
```

### 3. Title Tag Suggestions
**Prompt strategy:** Given the current title and keyword data, suggest 3 improved title tags (<60 chars, keyword-forward).

**Output:**
```json
{
  "options": [
    "Website Performance Guide: Core Web Vitals & Speed Tips",
    "How to Speed Up Your Website (2026 Performance Guide)",
    "Improve Website Performance: LCP, INP & CLS Explained"
  ]
}
```

### 4. Content Improvement Plan
**Prompt strategy:** Given the scores, subscores, and findings, produce a prioritised action plan.

**Output:**
```json
{
  "priority": "high",
  "actions": [
    {
      "action": "Add an author bio section",
      "reason": "E-E-A-T score is 38/100 — no author bio detected",
      "impact": "high",
      "effort": "low"
    },
    {
      "action": "Rewrite the opening paragraph with a hook",
      "reason": "Engagement score 45/100, generic opener detected",
      "impact": "high",
      "effort": "low"
    },
    {
      "action": "Break the long section into 2-3 subsections",
      "reason": "Wall of text detected (500+ words without heading)",
      "impact": "medium",
      "effort": "low"
    }
  ]
}
```

### 5. Opening Hook Rewrites
**Prompt strategy:** Given the title, keyword, and content type, write 3 compelling opening paragraphs.

**Output:**
```json
{
  "options": [
    "53% of mobile visitors leave if a page takes longer than 3 seconds to load. If your website is slow, you're not just frustrating users — you're losing them before they see a single word of your content.",
    "Your website's performance score just dropped to 62. Before you panic, here's the good news: the five fixes in this guide will get you above 80 in a weekend.",
    "What if I told you that compressing your images and adding two caching headers could cut your load time in half? I tested it on 50 sites. Here's exactly what happened."
  ]
}
```

### 6. Alt Text Suggestions
**Prompt strategy:** Given the page URL, title, and images missing alt text, generate descriptive alt text for each.

**Note:** This requires sending the image `src` paths (not the images themselves). The LLM infers context from the filename and page topic.

**Output:**
```json
{
  "suggestions": [
    { "src": "/images/inp-chart.svg", "alt": "Chart showing Interaction to Next Paint measurement timeline" },
    { "src": "/images/cls-example.gif", "alt": "Animated example of Cumulative Layout Shift causing content to jump" }
  ]
}
```

---

## System Prompts

Each generation type uses a specific system prompt. Prompts must be SHORT for gemma3:2b — under 100 tokens of instruction.

### Keywords Prompt
```
You are an SEO keyword researcher. Given a webpage's title, current keyword, headings, and content type, suggest new target keywords. Return valid JSON with keys: primary (2-3), secondary (3-5), longTail (5-7). No explanation, just JSON.
```

### Meta Description Prompt
```
You are an SEO copywriter. Write 3 meta descriptions for the given page. Each must be 120-155 characters, include the main keyword, and end with a reason to click. Return valid JSON with key: options (array of 3 strings). No explanation.
```

### Title Prompt
```
You are an SEO copywriter. Write 3 title tags for the given page. Each must be under 60 characters, include the main keyword near the start, and be compelling. Return valid JSON with key: options (array of 3 strings). No explanation.
```

### Content Plan Prompt
```
You are a content strategist. Given the page scores and issues, create a prioritised improvement plan. Return valid JSON with key: actions (array of objects with: action, reason, impact, effort). Max 5 actions, ordered by impact. No explanation.
```

### Hook Prompt
```
You are a content writer. Write 3 opening paragraphs for the given article. Each must hook the reader in the first sentence using a stat, question, or bold claim. 2-3 sentences each. Return valid JSON with key: options (array of 3 strings). No explanation.
```

### Alt Text Prompt
```
You are an accessibility expert. Given image filenames and the page topic, write descriptive alt text for each image. Alt text should describe what the image shows, under 125 characters. Return valid JSON with key: suggestions (array of objects with: src, alt). No explanation.
```

---

## Architecture

### Backend

```
POST /api/audits/:auditId/pages/:pageId/generate
Body: { "type": "keywords" | "meta" | "title" | "content-plan" | "hook" | "alt-text" }

Response: { "result": <LLM JSON output>, "generatedAt": "...", "model": "gemma3:2b" }
```

**Flow:**
1. Validate user is Pro+ tier
2. Fetch audit page data from DB
3. Build lean payload (extract only what's needed for the generation type)
4. Construct prompt = system prompt + JSON payload
5. Call Ollama API (`POST /api/generate` with `model: "gemma3:2b"`, `prompt`, `format: "json"`, `stream: false`)
6. Parse JSON response
7. Validate output shape (retry once if malformed)
8. Return to frontend

**Ollama call:**
```typescript
const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gemma3:2b',
    prompt: `${systemPrompt}\n\nPage data:\n${JSON.stringify(leanPayload)}`,
    format: 'json',
    stream: false,
    options: {
      temperature: 0.7,
      num_predict: 512
    }
  })
});
```

**Config:**
```env
OLLAMA_HOST=http://localhost:11434   # dev
OLLAMA_HOST=http://ollama:11434      # production (Docker network)
OLLAMA_MODEL=gemma3:2b
```

### Frontend

**Route:** `/audits/:id/pages/:pageId/generate`

**Page structure:**
- Header: page URL, scores summary
- Generation type selector (tabs or cards)
- "Generate" button per type
- Loading state with spinner
- Results panel with copy-to-clipboard buttons
- History of previous generations (optional, store in DB)

---

## Rate Limiting

| Tier | Generations/day | Generations/month |
|------|----------------|-------------------|
| Pro | 20 | 200 |
| Agency | 50 | 500 |
| Enterprise | Unlimited | Unlimited |

---

## Database (Optional — for generation history)

```sql
CREATE TABLE ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audit_jobs(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES audit_pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,  -- 'keywords', 'meta', 'title', 'content-plan', 'hook', 'alt-text'
  input_payload JSONB NOT NULL,
  output JSONB NOT NULL,
  model TEXT NOT NULL DEFAULT 'gemma3:2b',
  duration_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_generations_audit ON ai_generations(audit_id);
CREATE INDEX idx_ai_generations_user ON ai_generations(user_id);
```

---

## Implementation Order

1. **Backend: Ollama service** — generic service that calls Ollama with a prompt and returns parsed JSON
2. **Backend: Payload builder** — extracts lean payload from audit page data per generation type
3. **Backend: API route** — `POST /api/audits/:id/pages/:pageId/generate` with tier check
4. **Backend: Rate limiter** — per-user daily/monthly limits
5. **Frontend: Generate page** — UI with type selector, generate button, results display
6. **Frontend: API integration** — call the endpoint, handle loading/error states
7. **Database: Migration** — ai_generations table for history (optional)
8. **Tiers update** — add AI Generate row to TIERS.md

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| gemma3:2b returns malformed JSON | Retry once, fallback to error message |
| Model hallucinates irrelevant keywords | System prompt constrains output tightly; user reviews before applying |
| Ollama server goes down | Health check endpoint; graceful degradation with "AI unavailable" message |
| Users abuse generation limits | Per-user rate limiting with clear tier limits |
| Latency on cold start | Keep model loaded in Ollama (`keep_alive: -1`); first request may be slow |
| Output quality varies | Temperature 0.7 balances creativity/consistency; user gets 3 options to pick from |
