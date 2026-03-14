# Frontmatter Schema

Every blog post must include YAML frontmatter at the top of the file. This ensures posts are publish-ready for the CMS.

## Schema

```yaml
---
title: "The Full Blog Post Title"
slug: "keyword-phrase-here"
date: "YYYY-MM-DD"
author: "Chris Garlick"
description: "Meta description — 150-160 characters, benefit-led, includes keyword."
keyword: "primary target keyword"
category: "web-development"
tags:
  - "tag-one"
  - "tag-two"
  - "tag-three"
post_type: "how-to"
reading_time: "6 min read"
featured: false
---
```

## Field Definitions

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | The H1 title. 50-70 characters ideal. Include the primary keyword. |
| `slug` | Yes | URL-friendly version of the title. Lowercase, hyphenated, no stop words. Max 5-6 words. |
| `date` | Yes | Publication date in `YYYY-MM-DD` format. Use today's date unless told otherwise. |
| `author` | Yes | Default to "Chris Garlick" unless specified. |
| `description` | Yes | Meta description. 150-160 characters. Benefit-led, conversational, includes keyword. |
| `keyword` | Yes | The primary SEO keyword the post is targeting. |
| `category` | Yes | One of the categories below. |
| `tags` | Yes | 2-5 relevant tags from the tag list below. |
| `post_type` | Yes | The structural type: `how-to`, `thought-leadership`, `listicle`, `comparison`, `case-study`, `explainer`. |
| `reading_time` | Yes | Estimated reading time. Calculate at ~230 words per minute. Format: "X min read". |
| `featured` | No | Whether this is a featured/pinned post. Default: `false`. |

## Categories

| Slug | Label |
|------|-------|
| `web-development` | Web Development |
| `seo` | SEO |
| `performance` | Performance |
| `accessibility` | Accessibility |
| `design` | Design & UX |
| `cms` | CMS & Platforms |
| `security` | Security |
| `business` | Business & Strategy |
| `tools` | Tools & Resources |
| `industry` | Industry Trends |

## Common Tags

Use lowercase, hyphenated tags. Create new ones if needed, but prefer existing:

`wordpress`, `hubspot`, `shopify`, `laravel`, `react`, `page-speed`, `core-web-vitals`, `seo-basics`, `technical-seo`, `local-seo`, `ux-design`, `ui-design`, `accessibility`, `wcag`, `website-audit`, `cms-comparison`, `website-builders`, `hosting`, `ssl`, `analytics`, `google-analytics`, `conversion-rate`, `mobile-first`, `responsive-design`, `content-strategy`, `e-commerce`, `website-security`, `performance-optimisation`

## Example

```yaml
---
title: "How to Speed Up Your Website — 7 Practical Tips That Actually Work"
slug: "speed-up-your-website"
date: "2026-03-07"
author: "Chris Garlick"
description: "Is your website slow? Here are 7 practical, no-jargon tips to speed up your site and keep visitors from bouncing."
keyword: "speed up your website"
category: "performance"
tags:
  - "page-speed"
  - "core-web-vitals"
  - "performance-optimisation"
post_type: "listicle"
reading_time: "6 min read"
featured: false
---
```
