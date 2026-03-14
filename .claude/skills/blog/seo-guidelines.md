# SEO Guidelines for Blog Posts

## Heading Hierarchy

- **H1**: One per post — the title. Include the primary keyword naturally
- **H2**: Major sections. Use 4-8 per post depending on length
- **H3**: Subsections within H2s. Use sparingly — only when a section genuinely needs subdividing
- **Never** skip levels (H1 → H3 without an H2)
- **Never** use headings for visual styling — they must represent content structure

## Keyword Placement

1. **Title (H1)**: Include the primary keyword, ideally near the front
2. **First paragraph**: Use the keyword naturally within the first 100 words
3. **At least one H2**: Include the keyword or a close variant in a subheading
4. **Body text**: Use the keyword 3-5 times across the post — never force it
5. **Meta description**: Include the keyword once
6. **URL slug**: Use the keyword, hyphenated, keeping it under 5-6 words

## Meta Description

- **Length**: 150-160 characters
- **Format**: Benefit-led sentence that makes the reader want to click
- **Include**: Primary keyword + value proposition
- **Tone**: Match the blog voice — conversational, not corporate
- **Example**: "Struggling with slow page loads? Here's how to speed up your website in 5 practical steps — no technical jargon required."

## URL Structure

- Format: `/blog/keyword-phrase-here`
- Keep it short and descriptive
- No stop words unless they aid readability
- Lowercase, hyphens only (no underscores)

## Internal Linking

- Link to 2-3 relevant internal pages or posts where natural
- Use descriptive anchor text (not "click here")
- Suggest links as HTML comments at the bottom if exact URLs aren't known:
  ```
  <!-- Internal linking suggestions:
  - Link "website audit" to the audit/pricing page
  - Link "page speed" to the page speed blog post if it exists
  -->
  ```

## Image Alt Text

- Describe the image content clearly
- Include the keyword if it's naturally relevant
- Keep under 125 characters
- Format: `alt="Description of the image content"`

## Content Length by Post Type

| Post Type | Target Words | Min | Max |
|-----------|-------------|-----|-----|
| How-to | 1,500 | 1,200 | 1,800 |
| Thought leadership | 1,200 | 1,000 | 1,500 |
| Listicle | 1,300 | 1,000 | 1,600 |
| Comparison | 1,700 | 1,400 | 2,000 |
| Case study narrative | 1,500 | 1,200 | 1,800 |
| Explainer | 1,200 | 1,000 | 1,500 |

## Readability

- Aim for a Flesch reading ease score of 60-70 (easily understood)
- Short sentences mixed with longer ones
- Paragraphs of 3-6 sentences
- Use bullet points and numbered lists to break up dense sections
- Bold key phrases for scannability

## Schema / Structured Data Notes

- Blog posts should support `Article` schema (handled by the CMS/site)
- If the post is a how-to, consider `HowTo` schema markup
- If the post is a FAQ-style piece, consider `FAQPage` schema

## Keyword Research Notes

When the user doesn't specify a keyword:
- Infer the most likely target keyword from the topic
- Include it in the frontmatter as `keyword`
- Mention in a comment that keyword research should validate the choice
