#!/bin/bash
# publish-to-notion.sh — Push local business prospects to Notion
#
# Usage: ./publish-to-notion.sh <prospects.json> <sector> <location> [total_discovered]
# Example: ./publish-to-notion.sh prospects.json solicitors newcastle 18
#
# Structure: Local Business Prospects > Solicitors > Solicitors - Newcastle - 2026-04-08

set -euo pipefail

LOCAL_PAGE_ID="33c0a555-e5a3-81e3-b677-dc5e149fd085"
NOTION_VERSION="2022-06-28"
PROSPECTS_FILE="${1:?Usage: publish-to-notion.sh <prospects.json> <sector> <location> [total]}"
SECTOR="${2:?Usage: publish-to-notion.sh <prospects.json> <sector> <location> [total]}"
LOCATION="${3:?Usage: publish-to-notion.sh <prospects.json> <sector> <location> [total]}"
TOTAL_DISCOVERED="${4:-0}"

TODAY=$(date +%Y-%m-%d)
# Capitalise sector and location for display
SECTOR_DISPLAY=$(echo "$SECTOR" | sed 's/\b\(.\)/\u\1/g')
LOCATION_DISPLAY=$(echo "$LOCATION" | sed 's/\b\(.\)/\u\1/g')
PAGE_TITLE="$SECTOR_DISPLAY - $LOCATION_DISPLAY - $TODAY"

# Source API key
if [ -z "${NOTION_API:-}" ]; then
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
  if [ -f "$PROJECT_ROOT/server/.env" ]; then
    export $(grep '^NOTION_API=' "$PROJECT_ROOT/server/.env" | xargs)
  fi
  if [ -z "${NOTION_API:-}" ] && [ -f "./server/.env" ]; then
    export $(grep '^NOTION_API=' "./server/.env" | xargs)
  fi
fi

if [ -z "${NOTION_API:-}" ]; then
  echo "ERROR: NOTION_API not set"
  exit 1
fi

if [ ! -f "$PROSPECTS_FILE" ]; then
  echo "ERROR: Prospects file not found: $PROSPECTS_FILE"
  exit 1
fi

notion_api() {
  local endpoint="$1"
  local data="$2"
  curl -s "https://api.notion.com/v1${endpoint}" \
    -H "Authorization: Bearer $NOTION_API" \
    -H "Notion-Version: $NOTION_VERSION" \
    -H "Content-Type: application/json" \
    -d "$data"
}

echo "Publishing: $PAGE_TITLE"

# Step 1: Find or create the sector sub-page under Local Business Prospects
echo "  Looking for '$SECTOR_DISPLAY' sector page..."

SECTOR_PAGE_ID=$(curl -s "https://api.notion.com/v1/blocks/$LOCAL_PAGE_ID/children?page_size=100" \
  -H "Authorization: Bearer $NOTION_API" \
  -H "Notion-Version: $NOTION_VERSION" | python3 -c "
import sys, json
data = json.load(sys.stdin)
sector = '$SECTOR_DISPLAY'.lower()
for r in data.get('results', []):
    if r.get('type') == 'child_page':
        title = r['child_page']['title'].lower()
        if title == sector:
            print(r['id'])
            break
" 2>/dev/null)

if [ -z "$SECTOR_PAGE_ID" ]; then
  echo "  Creating '$SECTOR_DISPLAY' sector page..."
  SECTOR_RESPONSE=$(notion_api "/pages" "$(python3 -c "
import json
print(json.dumps({
    'parent': {'page_id': '$LOCAL_PAGE_ID'},
    'icon': {'type': 'emoji', 'emoji': '\U0001f4c1'},
    'properties': {
        'title': {
            'title': [{'text': {'content': '$SECTOR_DISPLAY'}}]
        }
    }
}))
")")
  SECTOR_PAGE_ID=$(echo "$SECTOR_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
  echo "  Created sector page: $SECTOR_PAGE_ID"
else
  echo "  Found existing sector page: $SECTOR_PAGE_ID"
fi

if [ -z "$SECTOR_PAGE_ID" ] || [ "$SECTOR_PAGE_ID" = "None" ]; then
  echo "ERROR: Failed to find or create sector page"
  exit 1
fi

# Step 2: Build blocks from prospects JSON
ALL_BLOCKS=$(python3 -c "
import json, sys

with open(sys.argv[1]) as f:
    prospects = json.load(f)

total = int(sys.argv[2]) if int(sys.argv[2]) > 0 else len(prospects)

blocks = []

blocks.append({
    'object': 'block',
    'type': 'callout',
    'callout': {
        'icon': {'type': 'emoji', 'emoji': '\U0001f4ca'},
        'rich_text': [{'type': 'text', 'text': {'content': f'{len(prospects)} qualified from {total} discovered'}}]
    }
})

blocks.append({
    'object': 'block',
    'type': 'divider',
    'divider': {}
})

for p in prospects:
    name = p.get('title') or p['domain']
    for sep in [' | ', ' - ', ' \u2013 ', ' \u2014 ']:
        if sep in name:
            name = name.split(sep)[0]
    name = name.strip()[:100]

    blocks.append({
        'object': 'block',
        'type': 'heading_3',
        'heading_3': {
            'rich_text': [{'type': 'text', 'text': {'content': name}}]
        }
    })

    details = []
    details.append(f'Domain: {p[\"domain\"]}')

    email = p.get('contact_email')
    if email:
        details.append(f'Email: {email}')
    elif p.get('has_contact_form'):
        contact_url = p.get('contact_page_url', '/contact')
        scheme = 'https' if p.get('has_ssl') else 'http'
        details.append(f'Contact form: {scheme}://{p[\"domain\"]}{contact_url}')

    details.append(f'Quality score: {p.get(\"quality_score\", 0)}/100')

    tech = p.get('technology_stack', [])
    if tech:
        tech_str = ', '.join(tech[:5])
        details.append(f'Tech: {tech_str}')

    social = p.get('social_links', {})
    social_parts = []
    if social.get('linkedin'):
        social_parts.append(f'LinkedIn: {social[\"linkedin\"]}')
    if social.get('twitter'):
        social_parts.append(f'X: {social[\"twitter\"]}')
    if social.get('facebook'):
        social_parts.append(f'FB: {social[\"facebook\"]}')
    if social_parts:
        details.append(' | '.join(social_parts))

    for detail in details:
        blocks.append({
            'object': 'block',
            'type': 'bulleted_list_item',
            'bulleted_list_item': {
                'rich_text': [{'type': 'text', 'text': {'content': detail[:2000]}}]
            }
        })

    blocks.append({
        'object': 'block',
        'type': 'paragraph',
        'paragraph': {'rich_text': []}
    })

print(json.dumps(blocks))
" "$PROSPECTS_FILE" "$TOTAL_DISCOVERED")

BLOCK_COUNT=$(echo "$ALL_BLOCKS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
echo "  $BLOCK_COUNT blocks to publish"

# Step 3: Create location page under the sector page
FIRST_BATCH=$(echo "$ALL_BLOCKS" | python3 -c "
import sys, json
blocks = json.load(sys.stdin)
print(json.dumps(blocks[:100]))
")

PAGE_RESPONSE=$(notion_api "/pages" "$(python3 -c "
import json, sys
blocks = json.loads(sys.argv[1])
print(json.dumps({
    'parent': {'page_id': '$SECTOR_PAGE_ID'},
    'icon': {'type': 'emoji', 'emoji': '\U0001f4cd'},
    'properties': {
        'title': {
            'title': [{'text': {'content': '''$PAGE_TITLE'''}}]
        }
    },
    'children': blocks
}))
" "$FIRST_BATCH")")

PAGE_ID=$(echo "$PAGE_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

if [ -z "$PAGE_ID" ] || [ "$PAGE_ID" = "None" ]; then
  echo "ERROR: Failed to create page"
  echo "$PAGE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$PAGE_RESPONSE"
  exit 1
fi

echo "  Created page: $PAGE_ID"

# Append remaining blocks in batches of 100
if [ "$BLOCK_COUNT" -gt 100 ]; then
  REMAINING=$(echo "$ALL_BLOCKS" | python3 -c "
import sys, json
blocks = json.load(sys.stdin)
remaining = blocks[100:]
batches = [remaining[i:i+100] for i in range(0, len(remaining), 100)]
print(json.dumps(batches))
")

  BATCH_COUNT=$(echo "$REMAINING" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")

  for i in $(seq 0 $((BATCH_COUNT - 1))); do
    BATCH=$(echo "$REMAINING" | python3 -c "
import sys, json
batches = json.load(sys.stdin)
print(json.dumps(batches[$i]))
")
    notion_api "/blocks/$PAGE_ID/children" "$(python3 -c "
import json, sys
blocks = json.loads(sys.argv[1])
print(json.dumps({'children': blocks}))
" "$BATCH")" > /dev/null

    echo "  Appended batch $((i + 1))/$BATCH_COUNT"
  done
fi

echo ""
echo "Done! View in Notion: https://www.notion.so/$(echo $PAGE_ID | tr -d '-')"
