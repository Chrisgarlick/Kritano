# Competitor Analysis V2 - Implementation Plan

## Executive Summary

Enhanced competitor analysis system that provides deep insights into what competitors are doing better, including keyword extraction, content tracking, and advanced visualizations.

---

## Current State

### What Exists
- Competitor profiles with domain tracking
- Basic score comparisons (SEO, Accessibility, Security, Performance)
- Finding diffs (issues only in mine, only in competitor, shared)
- Simple recommendations based on score gaps
- Custom SVG line charts (no charting library)

### What's Missing
- Keyword extraction and analysis
- Blog/news content tracking
- Keyword gap analysis
- Advanced graphical comparisons
- Content strategy insights

---

## New Features

### 1. Keyword Extraction System

Extract keywords during crawl from multiple sources with weighted importance:

| Source | Weight | Description |
|--------|--------|-------------|
| Title | 10x | Page title tag |
| H1 | 8x | Main heading |
| Meta Description | 5x | Meta description |
| H2-H6 | 3x | Subheadings |
| Anchor Text | 2.5x | Link text |
| Alt Text | 2x | Image alt attributes |
| Body | 1x | Main content |

**Algorithm:**
- TF-IDF scoring with position-based weighting
- Stop word removal (English)
- Porter stemming for normalization
- N-gram extraction (2-3 word phrases)
- Store top 50 keywords per page

**Dependencies:**
```json
{
  "natural": "^6.10.0",    // NLP: tokenization, stemming, TF-IDF
  "stopword": "^2.0.8"     // Stop word lists
}
```

### 2. Blog/News Detection

Identify and track competitor content updates:

**Detection Methods:**
- URL patterns: `/blog/`, `/news/`, `/articles/`, `/2024/01/`
- Structured data: JSON-LD Article types
- Meta tags: `article:published_time`, `article:author`

**Stored Data:**
- URL, title, excerpt (first 300 chars)
- Publication date, author
- Content type (blog, news, case study, etc.)
- Top keywords extracted

### 3. Keyword Gap Analysis

Compare keywords between your audit and competitor:

| Gap Category | Description |
|--------------|-------------|
| Missing | They use, you don't |
| Underutilized | You use less effectively |
| Competitive | Both use similarly |
| Advantage | You use more effectively |
| Shared | Both use equally |

Each keyword gets an **opportunity score** (-100 to +100) indicating action priority.

### 4. Enhanced Visualizations

**New Charts (using Recharts):**
- **Radar Chart**: 4-category score comparison overlay
- **Keyword Gap Chart**: Horizontal bars showing opportunities
- **Content Timeline**: Publishing frequency over time
- **Keyword Venn Diagram**: Overlap visualization

**Dependency:**
```json
{
  "recharts": "^2.12.0"    // ~200KB, React-native charts
}
```

### 5. Keyword Discovery from Page Metadata

Extract keywords from existing page metadata (no external APIs initially):

**Sources to scan:**
- `<meta name="keywords">` tag
- JSON-LD structured data (keywords, about fields)
- Open Graph tags
- Schema.org Product/Article keywords
- `<meta name="news_keywords">`

**Future Phase:** External API integrations (Google Search Console, SEMrush, Ahrefs)

---

## Database Schema

### New Tables

#### `page_keywords`
```sql
CREATE TABLE page_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_page_id UUID NOT NULL REFERENCES audit_pages(id) ON DELETE CASCADE,
  audit_job_id UUID NOT NULL REFERENCES audit_jobs(id) ON DELETE CASCADE,
  keyword VARCHAR(255) NOT NULL,
  keyword_normalized VARCHAR(255) NOT NULL,
  term_frequency DECIMAL(10, 6) NOT NULL,
  inverse_doc_frequency DECIMAL(10, 6),
  tf_idf_score DECIMAL(10, 6),
  source VARCHAR(50) NOT NULL,  -- 'title', 'h1', 'meta_description', 'headings', 'body', 'alt_text', 'anchor_text'
  occurrence_count INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(audit_page_id, keyword_normalized, source)
);
```

#### `audit_keywords`
```sql
CREATE TABLE audit_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_job_id UUID NOT NULL REFERENCES audit_jobs(id) ON DELETE CASCADE,
  keyword VARCHAR(255) NOT NULL,
  keyword_normalized VARCHAR(255) NOT NULL,
  total_occurrences INT NOT NULL DEFAULT 0,
  pages_containing INT NOT NULL DEFAULT 0,
  avg_tf_idf_score DECIMAL(10, 6),
  max_tf_idf_score DECIMAL(10, 6),
  source_breakdown JSONB DEFAULT '{}',
  importance_rank INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(audit_job_id, keyword_normalized)
);
```

#### `competitor_content_updates`
```sql
CREATE TABLE competitor_content_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_profile_id UUID NOT NULL REFERENCES competitor_profiles(id) ON DELETE CASCADE,
  audit_job_id UUID REFERENCES audit_jobs(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  url_hash VARCHAR(64) NOT NULL,
  title TEXT,
  excerpt TEXT,
  author TEXT,
  published_at TIMESTAMPTZ,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  content_type VARCHAR(50) DEFAULT 'article',
  keywords JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(competitor_profile_id, url_hash)
);
```

#### `keyword_comparisons`
```sql
CREATE TABLE keyword_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comparison_id UUID NOT NULL REFERENCES audit_comparisons(id) ON DELETE CASCADE,
  keyword VARCHAR(255) NOT NULL,
  keyword_normalized VARCHAR(255) NOT NULL,
  my_occurrences INT DEFAULT 0,
  my_pages INT DEFAULT 0,
  my_avg_tfidf DECIMAL(10, 6),
  competitor_occurrences INT DEFAULT 0,
  competitor_pages INT DEFAULT 0,
  competitor_avg_tfidf DECIMAL(10, 6),
  gap_category VARCHAR(50),  -- 'missing', 'underutilized', 'competitive', 'advantage', 'shared'
  opportunity_score DECIMAL(5, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comparison_id, keyword_normalized)
);
```

### Table Modifications

```sql
-- audit_pages additions
ALTER TABLE audit_pages ADD COLUMN keywords_extracted BOOLEAN DEFAULT FALSE;
ALTER TABLE audit_pages ADD COLUMN keyword_count INT DEFAULT 0;
ALTER TABLE audit_pages ADD COLUMN primary_keyword VARCHAR(255);
ALTER TABLE audit_pages ADD COLUMN is_blog_content BOOLEAN DEFAULT FALSE;
ALTER TABLE audit_pages ADD COLUMN published_date TIMESTAMPTZ;

-- audit_comparisons additions
ALTER TABLE audit_comparisons ADD COLUMN keyword_analysis_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE audit_comparisons ADD COLUMN content_gap_summary JSONB;
```

---

## API Endpoints

### New Endpoints

```
# Keywords
GET  /api/audits/:auditId/keywords
GET  /api/audits/:auditId/pages/:pageId/keywords

# Competitor Content
GET  /api/organizations/:orgId/competitors/:competitorId/content-updates

# Enhanced Comparison
GET  /api/organizations/:orgId/comparisons/:comparisonId/keywords
GET  /api/organizations/:orgId/comparisons/:comparisonId/content-gaps
POST /api/organizations/:orgId/comparisons/:comparisonId/analyze
```

---

## UI/UX Design

### Enhanced Comparison Page Tabs

1. **Overview** - Score radar chart + winner badge (enhanced)
2. **Findings** - Existing findings diff
3. **Keywords** (NEW) - Keyword gap analysis
4. **Content** (NEW) - Blog/news activity
5. **Recommendations** - Enhanced with keyword insights

### Keywords Tab Layout

```
+--------------------------------------------------+
| Keyword Analysis                                  |
+--------------------------------------------------+
| [Venn Diagram: Your Keywords | Shared | Theirs]  |
|                                                   |
| Missing Keywords (they have, you don't)          |
| +----------------------------------------------+ |
| | keyword1 ████████████████ 45 occurrences     | |
| | keyword2 ████████████ 32 occurrences         | |
| +----------------------------------------------+ |
|                                                   |
| Your Advantages (you use more)                   |
| +----------------------------------------------+ |
| | keyword3 ████████████████████ 67 occurrences | |
| +----------------------------------------------+ |
+--------------------------------------------------+
```

### Content Tab Layout

```
+--------------------------------------------------+
| Content Activity                                  |
+--------------------------------------------------+
| [Timeline: Posts per month over last 12 months]  |
|                                                   |
| Recent Competitor Posts                          |
| +----------------------------------------------+ |
| | "How to Improve SEO in 2024"                 | |
| | Published: Jan 15, 2024 | Blog Post          | |
| | Keywords: seo, rankings, optimization        | |
| +----------------------------------------------+ |
+--------------------------------------------------+
```

---

## Implementation Phases

### Phase 1: Keyword Extraction (MVP)
- Database migrations for keyword tables
- Keyword extraction service with TF-IDF
- Integration into spider service
- Basic keyword API endpoints
- Simple keyword list in audit detail

### Phase 2: Keyword Gap Analysis
- `keyword_comparisons` table
- Gap analysis service
- Recharts integration
- Keywords tab in comparison view
- Keyword gap visualizations

### Phase 3: Blog/News Tracking
- Blog detection in spider
- `competitor_content_updates` table
- Content extraction
- Content tab in comparison view
- Publishing timeline chart

### Phase 4: Enhanced Visualizations
- Radar chart for scores
- Keyword Venn diagram
- Enhanced recommendations
- Dashboard widgets

### Phase 5: External Rankings (Future)
- Provider abstraction layer
- Google Search Console integration
- Third-party API integrations

---

## Files to Create/Modify

### New Files
- `server/src/services/keywords/keyword-extractor.service.ts`
- `server/src/services/keywords/keyword-aggregator.service.ts`
- `server/src/services/competitor-analysis.service.ts`
- `server/src/types/keyword.types.ts`
- `server/src/db/migrations/024_create_keyword_tables.sql`
- `client/src/components/charts/RadarChart.tsx`
- `client/src/components/charts/KeywordGapChart.tsx`
- `client/src/components/charts/ContentTimeline.tsx`
- `client/src/components/charts/VennDiagram.tsx`
- `client/src/types/keyword.types.ts`

### Modified Files
- `server/src/services/spider/spider.service.ts` - Add keyword extraction
- `server/src/services/queue/audit-worker.service.ts` - Keyword aggregation
- `server/src/services/competitor.service.ts` - Gap analysis
- `server/src/routes/audits/index.ts` - Keyword endpoints
- `server/src/routes/competitors/index.ts` - Content endpoints
- `client/src/pages/competitors/ComparisonDetail.tsx` - New tabs
- `client/src/pages/audits/AuditDetail.tsx` - Keyword section
- `client/src/services/api.ts` - New API methods

---

## Performance Considerations

- Limit to 50 keywords per page
- Async keyword extraction (don't block crawl)
- Batch inserts (100 at a time)
- Calculate IDF after crawl completes
- Paginate all keyword endpoints
- Prune old keywords on re-audit

---

## Verification

### Testing Checklist
1. Run audit and verify keywords extracted
2. Check keyword counts in audit detail
3. Create comparison and verify gap analysis
4. View competitor content updates
5. Test all new chart components
6. Verify performance with large audits (100+ pages)
