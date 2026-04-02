---
name: blog
description: Write a polished, publish-ready blog post in the Kritano brand voice. Use when the user wants to create a blog post or article.
user-invocable: true
argument-hint: [topic or prompt]
---

# Blog Writing Skill

Write polished, publish-ready blog posts in Kritano's brand voice. Accepts a topic or prompt and outputs a complete `.md` file.

## Input

The user's prompt: $ARGUMENTS

## Workflow

### 1. Read the user's prompt
Identify:
- The core topic or question to answer
- Any specific angle, audience, or goal mentioned
- Whether a post type was specified (how-to, listicle, thought leadership, etc.)

### 2. Select the post type
Based on the prompt, choose the best structure from `blog-structure-templates.md`:
- **How-to** — step-by-step guides, tutorials, practical walkthroughs
- **Thought leadership** — opinion pieces, industry takes, forward-looking analysis
- **Listicle** — numbered lists of tips, tools, mistakes, examples
- **Comparison** — X vs Y, pros/cons, honest assessments
- **Case study narrative** — story-driven posts around a real project or result
- **Explainer** — breaking down a concept, technology, or trend for non-technical readers

If unclear, default to **how-to** or **explainer** — these match the brand voice best.

### 3. Apply tone of voice
Read and follow `tone-of-voice.md` (sourced from the brand voice analysis). Key principles:
- Conversational, relatable, like explaining to a smart friend
- First person singular ("I") for editorial content
- British English spelling throughout (optimise, colour, favour)
- Open with a relatable question or shared experience
- Explain technical terms in plain English immediately after using them
- Be honest about trade-offs — never purely promotional
- Use contractions naturally
- Name specific tools and technologies
- Em dashes for asides and personality

### 4. Apply audience persona
Reference `audience-personas.md` to shape complexity, framing, and examples.

### 5. Write the draft
Using the selected structure template:
1. Write the hook/opening
2. Build out each section following the template
3. Weave in practical examples, named tools, and honest opinions
4. Close with a personal recommendation and soft CTA

### 6. Apply SEO guidelines
Reference `seo-guidelines.md`:
- Ensure heading hierarchy (single H1, logical H2/H3 nesting)
- Front-load the target keyword in the title and first paragraph
- Include the keyword naturally 3-5 times
- Write a compelling meta description (150-160 chars)
- Add internal linking suggestions where relevant

### 7. Reference examples
Check `examples.md` to ensure the output matches the quality bar and style of existing published content for the chosen post type.

### 8. Apply frontmatter
Add YAML frontmatter following `frontmatter-schema.md`.

### 9. Output
Output a single `.md` file with:
- Correct YAML frontmatter
- The full blog post
- Suggested meta description in the frontmatter
- Any notes on internal linking opportunities (as an HTML comment at the bottom)

## Reference Files

| File | Purpose |
|------|---------|
| `tone-of-voice.md` | Brand voice rules, do's/don'ts, linguistic fingerprint |
| `blog-structure-templates.md` | Structural patterns for each post type |
| `seo-guidelines.md` | Heading hierarchy, keyword placement, meta descriptions |
| `examples.md` | Reference blog posts for each style — quality bar and voice calibration |
| `audience-personas.md` | Who the reader is, their knowledge level, pain points |
| `cta-and-endings.md` | Standard calls to action, sign-off styles |
| `frontmatter-schema.md` | YAML frontmatter schema for publish-ready output |

## Quality Checklist

Before outputting, verify:
- [ ] Opens with a relatable question or shared experience
- [ ] Technical terms are explained in plain English
- [ ] Uses British English spelling throughout
- [ ] Contains at least one honest trade-off or balanced take
- [ ] Names specific tools, platforms, or technologies
- [ ] Includes actionable, practical advice
- [ ] Ends with a soft CTA (never pushy)
- [ ] Heading hierarchy is correct (H1 > H2 > H3)
- [ ] Frontmatter is complete and valid
- [ ] Word count is appropriate for post type
- [ ] Tone matches the brand voice — conversational expert, not corporate
