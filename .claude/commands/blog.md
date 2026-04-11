Write a polished, publish-ready blog post in Kritano's brand voice based on the following prompt:

$ARGUMENTS

## Instructions

Before writing, read ALL of these reference files to load the full skill context:

1. `.claude/skills/blog/tone-of-voice.md` — Brand voice rules, do's/don'ts, linguistic fingerprint
2. `.claude/skills/blog/blog-structure-templates.md` — Structural patterns for each post type
3. `.claude/skills/blog/seo-guidelines.md` — Heading hierarchy, keyword placement, meta descriptions
4. `.claude/skills/blog/examples.md` — Reference blogs for each style — quality bar and voice calibration
5. `.claude/skills/blog/audience-personas.md` — Who the reader is, their knowledge level, pain points
6. `.claude/skills/blog/cta-and-endings.md` — Standard calls to action, sign-off styles
7. `.claude/skills/blog/frontmatter-schema.md` — YAML frontmatter schema for publish-ready output

## Workflow

1. Read the reference files above
2. Identify the best post type (how-to, thought-leadership, listicle, comparison, case-study, explainer)
3. Write the blog post following the matching structure template
4. Apply tone of voice, audience persona, SEO guidelines, and CTA patterns
5. Add YAML frontmatter per the schema
6. Output a single `.md` file to `docs/blog/` (use the slug from frontmatter as filename)
7. Generate a featured image using the `/draw` skill in **wide** format (1920x1080, 16:9) — 1 variation. The image should display the post title, category label, and Kritano branding. Save to `/docs/draw/blog-<slug>/1.html` and convert to PNG.
8. Publish to Notion by running: `.claude/skills/blog/publish-to-notion.sh <path-to-blog-post.md>`

## Quality Checklist

Before outputting, verify:
- Opens with a relatable question or shared experience
- Technical terms are explained in plain English
- Uses British English spelling throughout (optimise, colour, favour)
- Contains at least one honest trade-off or balanced take
- Names specific tools, platforms, or technologies
- Includes actionable, practical advice
- Ends with a soft CTA (never pushy)
- Heading hierarchy is correct (H1 > H2 > H3)
- Frontmatter is complete and valid
- Word count is appropriate for post type
- Tone matches the brand voice — conversational expert, not corporate
- Featured image has been generated
- Post has been published to Notion
