---
name: prospects-ecommerce
description: Find ecommerce stores (Shopify, WooCommerce, etc.) by niche and region. Extracts contact details and publishes to Notion. Use for cold outreach to online shops that could benefit from website auditing.
user-invocable: true
argument-hint: location or niche + location e.g. manchester or fashion stores manchester
---

# Ecommerce Prospects

Find ecommerce stores by niche and region, extract contact details, and publish to Notion.

## Input

The user's prompt: $ARGUMENTS

If the user passes "help" as the argument, show the niche list below and stop. Do not run any searches.

### Help / Niche List

If prompted with `/prospects-ecommerce help`, display this and stop:

```
Ecommerce Prospect Niches:

  Fashion & Apparel:
    fashion             - clothing, streetwear, designer brands
    shoes               - footwear, trainers, boots
    jewellery           - jewellery, watches, accessories
    activewear          - sportswear, gym clothing, outdoor gear

  Home & Living:
    homeware            - home decor, furniture, kitchenware
    garden              - garden supplies, outdoor furniture, plants
    lighting            - lighting stores, lamp specialists
    interiors           - interior design shops, soft furnishings

  Food & Drink:
    food-and-drink      - specialty food, hampers, artisan goods
    coffee              - coffee roasters, tea merchants
    alcohol             - craft beer, wine, spirits
    supplements         - vitamins, protein, health supplements

  Health & Beauty:
    beauty              - skincare, cosmetics, haircare
    wellness            - candles, aromatherapy, self-care
    pet-supplies        - pet food, accessories, grooming

  Specialist:
    gifts               - gift shops, personalised gifts
    kids                - children's clothing, toys, baby products
    tech-accessories    - phone cases, cables, gadgets
    crafts              - art supplies, craft kits, hobby stores
    automotive          - car parts, accessories, detailing

  By Platform:
    shopify             - any Shopify store (all niches)
    woocommerce         - any WooCommerce store (all niches)

Usage: /prospects-ecommerce <location>
       /prospects-ecommerce <niche> <location>
Example: /prospects-ecommerce newcastle
         /prospects-ecommerce fashion stores manchester
```

### Standard Examples

- `/prospects-ecommerce newcastle` - find any ecommerce stores in Newcastle
- `/prospects-ecommerce manchester` - find any ecommerce stores in Manchester
- `/prospects-ecommerce fashion stores manchester` - find fashion ecommerce in Manchester
- `/prospects-ecommerce food and drink north east` - find F&B ecommerce in the North East
- `/prospects-ecommerce Shopify stores leeds` - find Shopify-specific stores in Leeds

## Workflow

### 1. Parse the input

Extract:
- **Location** (required): city, region, or "UK" for national
- **Niche** (optional): fashion, food, homeware, beauty, pet supplies, etc. If not specified, search broadly for all ecommerce stores
- **Platform** (optional): Shopify, WooCommerce, etc.

### 2. Search for ecommerce stores

Run **6-8 WebSearches** targeting:
- `"{niche}" online shop {location}`
- `"{niche}" ecommerce store {location}`
- `buy {niche} online {location}`
- `"{niche}" Shopify store {location}` (if platform specified)
- `site:shopify.com/collections {niche} {location}` (for Shopify discovery)
- `independent {niche} shop {location} online`
- `best {niche} stores {location} 2026`
- `"{niche}" WooCommerce {location}` (for WooCommerce discovery)

Use **WebFetch** on directory/listing pages to extract store domains.

### 3. Compile and deduplicate domains

- Build unique domain list
- Remove marketplaces (amazon.co.uk, ebay.co.uk, etsy.com, etc.)
- Remove social media profiles
- Save to `docs/prospects/ecom-{niche}-{location}-{date}/raw-domains.txt`

### 4. Check domains and extract contacts

Run the shared generic check script in **ecommerce** mode (looks for cart/shop/product signals):

```bash
bash .claude/skills/prospects/check-and-extract-generic.sh docs/prospects/ecom-{niche}-{location}-{date}/raw-domains.txt docs/prospects/ecom-{niche}-{location}-{date}/prospects.json ecommerce
```

Ecommerce mode detects: "add to cart", "add to basket", "shop now", "checkout", "/products", "/collections", "/shop", Shopify, WooCommerce, BigCommerce, Magento signals.

### 5. Present results and publish to Notion

Show a summary table, then immediately publish:

```bash
bash .claude/skills/prospects-ecommerce/publish-to-notion.sh docs/prospects/ecom-{niche}-{location}-{date}/prospects.json "Ecommerce: {Niche} - {Location} - {date}" {total_discovered}
```

Published to Kritano > Ecommerce Prospects in Notion.

### 6. Output summary

Report: prospect count, file paths, Notion link.

## Deduplication

Uses the shared `docs/prospects/known-domains.txt` - same dedup list across all prospect types (agencies, local, ecommerce). No duplicates across any runs.

## Output Files

`docs/prospects/ecom-{niche}-{location}-{YYYY-MM-DD}/`:
- `raw-domains.txt` - discovered domains
- `prospects.json` - qualified prospects

## Compliance

- Generic/role-based business emails only
- No unsolicited auditing - only publicly visible information is collected
- No automated outreach - list is for manual use
