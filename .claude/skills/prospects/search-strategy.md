# Search Strategy - Agency Discovery

Query templates for finding web/digital/SEO agencies by location. Replace `{location}` with the target city/region and `{specialisation}` with any niche focus.

## Core Queries (always run these)

### 1. Broad agency search
```
"web design agency" {location}
```
Picks up most web agencies. High volume, broad coverage.

### 2. Digital marketing agencies
```
"digital marketing agency" {location}
```
Catches marketing-focused agencies that also do web work.

### 3. SEO agencies
```
"SEO agency" {location}
```
SEO specialists - high-value targets as they understand audit tools.

### 4. Development companies
```
"web development company" {location}
```
Catches dev shops that may not call themselves "agencies".

## Directory Queries (run 2-3 of these)

### 5. Clutch
```
site:clutch.co web development {location}
```
Clutch is the largest agency directory. Results include agency profiles with links to their websites.

### 6. The Manifest
```
site:themanifest.com web agency {location}
```
Sister site to Clutch, similar directory format.

### 7. DesignRush
```
site:designrush.com digital agency {location}
```
Good for design-focused agencies.

### 8. GoodFirms
```
site:goodfirms.co web development {location}
```
Another major agency directory.

## Specialisation Queries (run if user specified a niche)

### Shopify agencies
```
"shopify agency" {location}
"shopify partner" {location}
```

### WordPress agencies
```
"wordpress agency" {location}
"wordpress development" {location}
```

### Ecommerce agencies
```
"ecommerce agency" {location}
"ecommerce development" {location}
```

### Accessibility specialists
```
"accessibility agency" {location}
"WCAG compliance" agency {location}
```

## Review/Ranking Queries (bonus, run if core queries yield < 20 domains)

### 9. Top/best lists
```
top digital agencies {location} 2026
best web design agencies {location}
```
Blog posts and ranking articles that list agencies with links.

### 10. Google Business
```
web design agency {location} reviews
```
Surfaces Google Business profiles which link to agency websites.

## WebFetch Targets

When search results include directory listing pages, use WebFetch to extract additional agency domains:

- **Clutch listing pages**: Extract agency names and "Visit Website" links
- **The Manifest listing pages**: Same pattern as Clutch
- **DesignRush listing pages**: Agency cards with website links
- **"Top agencies" blog posts**: Usually contain bulleted lists with agency names and URLs
- **Google Maps results**: Business names with website links

### What to extract from directory pages
- Agency name
- Website URL (the agency's own domain, not the directory profile URL)
- Any noted specialisation (WordPress, Shopify, etc.)

### What to skip
- The directory site's own pages (clutch.co, designrush.com, etc.)
- Social media profiles (linkedin.com, twitter.com, facebook.com)
- Generic platform URLs (wordpress.com, wix.com, squarespace.com)
- Review sites (trustpilot.com, google.com/maps)

## Expected Yield

| Location Size | Domains Found | After Filtering |
|---------------|---------------|-----------------|
| Large city (London, Manchester) | 40-80 | 20-40 |
| Medium city (Leeds, Bristol) | 20-40 | 10-25 |
| Small city/town | 10-20 | 5-15 |
