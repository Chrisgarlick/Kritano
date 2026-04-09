#!/bin/bash
# publish-to-notion.sh — Push agency prospect list to Notion under Kritano
#
# Usage: ./publish-to-notion.sh <prospects.json> <page-title>
# Example: ./publish-to-notion.sh prospects.json "Agency Prospects - Manchester - 2026-04-08"

set -euo pipefail

PROSPECTS_PAGE_ID="33c0a555-e5a3-80e7-bef1-c6a540228296"
NOTION_VERSION="2022-06-28"
PROSPECTS_FILE="${1:?Usage: publish-to-notion.sh <prospects.json> <page-title>}"
PAGE_TITLE="${2:?Usage: publish-to-notion.sh <prospects.json> <page-title>}"

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

echo "Publishing prospects to Notion: $PAGE_TITLE"

# Build all blocks from prospects JSON
ALL_BLOCKS=$(python3 -c "
import json, sys

with open(sys.argv[1]) as f:
    prospects = json.load(f)

total = int(sys.argv[2]) if len(sys.argv) > 2 else len(prospects)

blocks = []

# Stats callout
blocks.append({
    'object': 'block',
    'type': 'callout',
    'callout': {
        'icon': {'type': 'emoji', 'emoji': '\U0001f4ca'},
        'rich_text': [{'type': 'text', 'text': {'content': f'{len(prospects)} qualified agencies from {total} discovered'}}]
    }
})

blocks.append({
    'object': 'block',
    'type': 'divider',
    'divider': {}
})

# Each prospect
for p in prospects:
    name = p.get('title') or p['domain']
    # Clean up title (remove trailing ' | ...' or ' - ...')
    for sep in [' | ', ' - ', ' – ', ' — ']:
        if sep in name:
            name = name.split(sep)[0]
    name = name.strip()[:100]

    # Heading with agency name
    blocks.append({
        'object': 'block',
        'type': 'heading_3',
        'heading_3': {
            'rich_text': [{'type': 'text', 'text': {'content': name}}]
        }
    })

    # Details as bulleted list
    details = []

    # Domain
    details.append(f'Domain: {p[\"domain\"]}')

    # Email
    email = p.get('contact_email')
    if email:
        details.append(f'Email: {email}')
    elif p.get('has_contact_form'):
        contact_url = p.get('contact_page_url', '/contact')
        scheme = 'https' if p.get('has_ssl') else 'http'
        details.append(f'Contact form: {scheme}://{p[\"domain\"]}{contact_url}')

    # Score
    details.append(f'Quality score: {p.get(\"quality_score\", 0)}/100')

    # Tech stack
    tech = p.get('technology_stack', [])
    if tech:
        tech_str = ', '.join(tech[:5])
        details.append(f'Tech: {tech_str}')

    # Agency signals
    signals = p.get('agency_signals', [])
    if signals:
        type_str = ', '.join(list(set(signals))[:3])
        details.append(f'Type: {type_str}')

    # Social links
    social = p.get('social_links', {})
    social_parts = []
    if social.get('linkedin'):
        social_parts.append(f'LinkedIn: {social[\"linkedin\"]}')
    if social.get('twitter'):
        social_parts.append(f'X: {social[\"twitter\"]}')
    if social.get('instagram'):
        social_parts.append(f'IG: {social[\"instagram\"]}')
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

    # Spacer
    blocks.append({
        'object': 'block',
        'type': 'paragraph',
        'paragraph': {'rich_text': []}
    })

print(json.dumps(blocks))
" "$PROSPECTS_FILE" "${3:-0}")

# Count total blocks
BLOCK_COUNT=$(echo "$ALL_BLOCKS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
echo "  $BLOCK_COUNT blocks to publish"

# Create parent page with first batch of blocks (max 100)
FIRST_BATCH=$(echo "$ALL_BLOCKS" | python3 -c "
import sys, json
blocks = json.load(sys.stdin)
print(json.dumps(blocks[:100]))
")

PAGE_RESPONSE=$(notion_api "/pages" "$(python3 -c "
import json, sys
blocks = json.loads(sys.argv[1])
print(json.dumps({
    'parent': {'page_id': '$PROSPECTS_PAGE_ID'},
    'icon': {'type': 'emoji', 'emoji': '\U0001f3af'},
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
# Split into batches of 100
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
