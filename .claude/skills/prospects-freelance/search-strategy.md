# Search Strategy - Freelance Web Developer & SEO Discovery

Query templates for finding freelance web developers and SEO specialists by location. Replace `{location}` with the target city/region and `{specialisation}` with any niche focus.

## Core Queries (always run these)

### 1. Freelance web developer
```
"freelance web developer" {location}
```
Primary query for independent web developers. High volume.

### 2. Freelance web designer
```
"freelance web designer" {location}
```
Catches design-focused freelancers who also build sites.

### 3. Freelance SEO
```
"freelance SEO" {location}
```
SEO specialists working independently - high-value targets as they understand audit tools.

### 4. Freelance SEO consultant
```
"SEO consultant" {location} freelance OR independent
```
Catches consultants who may not use the word "freelance" but work independently.

### 5. Independent web developer
```
"independent web developer" OR "freelance developer" {location} portfolio
```
Catches devs who use "independent" rather than "freelance", plus portfolio sites.

## Directory Queries (run 2-3 of these)

### 6. Clutch freelancers
```
site:clutch.co freelance web developer {location}
```
Clutch lists individual freelancers as well as agencies.

### 7. Bark
```
site:bark.com web developer {location}
```
UK-focused freelancer marketplace with profiles linking to personal sites.

### 8. Sortlist
```
site:sortlist.co.uk freelance web {location}
```
European freelancer/agency directory.

### 9. PeoplePerHour
```
site:peopleperhour.com web developer {location}
```
UK freelancer marketplace - profiles often link to personal sites.

### 10. LinkedIn (for discovery, not scraping)
```
"freelance web developer" {location} site:linkedin.com
```
Use LinkedIn results to find names, then search for their personal portfolio sites separately. Do NOT scrape LinkedIn directly.

## Specialisation Queries (run if user specified a niche)

### WordPress freelancers
```
"freelance wordpress developer" {location}
"wordpress freelancer" {location}
```

### Shopify freelancers
```
"freelance shopify developer" {location}
"shopify expert" {location} freelance
```

### Frontend / React / JS freelancers
```
"freelance frontend developer" {location}
"freelance react developer" {location}
```

### SEO specialist
```
"freelance SEO specialist" {location}
"SEO freelancer" {location}
"technical SEO" freelance {location}
```

### Full-stack freelancers
```
"freelance full stack developer" {location}
"full stack freelancer" {location}
```

## Review/Ranking Queries (bonus, run if core queries yield < 15 domains)

### 11. Top/best lists
```
best freelance web developers {location} 2026
top freelance SEO {location}
```
Blog posts and ranking articles that list freelancers with links.

### 12. Portfolio discovery
```
"web developer" {location} "available for hire" OR "hire me"
"web developer" {location} portfolio site
```
Surfaces personal portfolio sites directly.

### 13. Local tech communities
```
"web developer" {location} meetup OR community
```
Community pages often list local freelancers with links.

## WebFetch Targets

When search results include directory listing pages, use WebFetch to extract additional freelancer domains:

- **Clutch listing pages**: Extract freelancer names and "Visit Website" links
- **Bark listing pages**: Freelancer profiles with website links
- **"Top freelancers" blog posts**: Usually contain lists with names and URLs
- **Local tech community pages**: Member lists with website links
- **Sortlist/PeoplePerHour profiles**: Links to personal websites

### What to extract from directory pages
- Freelancer name
- Website URL (their personal domain, not the directory profile URL)
- Any noted specialisation (WordPress, SEO, React, etc.)

### What to skip
- The directory site's own pages (clutch.co, bark.com, peopleperhour.com, etc.)
- Social media profiles (linkedin.com, twitter.com, facebook.com)
- Generic platform URLs (wordpress.com, wix.com, squarespace.com)
- Agency sites (look for signals like "our team", "meet the team" with 5+ people)
- Marketplace profiles without personal websites

## Expected Yield

| Location Size | Domains Found | After Filtering |
|---------------|---------------|-----------------|
| Large city (London, Manchester) | 25-50 | 12-25 |
| Medium city (Leeds, Bristol) | 15-30 | 8-18 |
| Small city/town | 5-15 | 3-10 |
