Here's what I'd recommend for a blog-writing skill that takes a prompt and outputs a polished `.md` file:

**Core skill files to include:**

1. **SKILL.md** — The main instruction file Claude Code reads. This should define the workflow: accept a topic/prompt → research/outline → write → output `.md` file. It should reference all other files.

2. **tone-of-voice.md** *(you have this)* — Personality, vocabulary, do's/don'ts, brand voice.

3. **blog-structure-templates.md** — Multiple structural patterns (how-to, listicle, thought leadership, case study, narrative). Claude picks the right one based on the prompt.

4. **seo-guidelines.md** — Heading hierarchy rules, keyword placement, meta description format, internal linking conventions, ideal word counts by post type.

5. **examples/** — A folder with 2–3 exemplary finished blogs. These are *gold* for few-shot learning — Claude will mirror their quality and style far better than instructions alone.

6. **audience-personas.md** — Who the reader is, their knowledge level, pain points, what they want to walk away knowing. This shapes complexity and framing.

**Optional but high-value:**

7. **cta-and-endings.md** — Standard calls to action, sign-off styles, how posts typically end.

8. **frontmatter-schema.md** — If your CMS or publishing pipeline needs YAML frontmatter (title, date, tags, author, description), define the exact schema here so every output is publish-ready.

**The SKILL.md should wire it all together** with a clear workflow like:

- Read the user's prompt
- Identify post type → select matching structure template
- Apply tone of voice + audience persona
- Write the draft
- Apply SEO guidelines
- Output a single `.md` file with correct frontmatter

The **examples folder** is the single biggest creativity multiplier — even two or three good posts teach Claude more about your specific voice and quality bar than any amount of written rules.