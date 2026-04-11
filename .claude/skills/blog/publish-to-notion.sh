#!/bin/bash
# publish-to-notion.sh — Push a blog post to the Kritano Blogs page in Notion
#
# Usage: ./publish-to-notion.sh <blog-post.md>
# Example: ./publish-to-notion.sh /Users/chris/Herd/pagepulser/docs/blog/speed-up-your-website.md
#
# Requires: NOTION_API env var (sourced from server/.env if not set)
# Creates: A page under the Blogs parent page with the full blog post content

set -euo pipefail

BLOGS_PAGE_ID="33e0a555-e5a3-80f4-adab-e8204e515702"
NOTION_VERSION="2022-06-28"
BLOG_FILE="${1:?Usage: publish-to-notion.sh <blog-post.md>}"

if [ ! -f "$BLOG_FILE" ]; then
  echo "ERROR: File not found: $BLOG_FILE"
  exit 1
fi

# Source API key if not already set
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
  echo "ERROR: NOTION_API not set and not found in server/.env"
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

# Parse frontmatter and content, convert to Notion blocks
PARSED=$(python3 -c "
import json, sys, re

content = open(sys.argv[1], 'r').read().strip()

# Parse YAML frontmatter
title = 'Untitled Blog Post'
category = ''
description = ''
keyword = ''
tags = []
post_type = ''
reading_time = ''
date = ''

fm_match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
body = content
if fm_match:
    fm_text = fm_match.group(1)
    body = content[fm_match.end():]

    for line in fm_text.split('\n'):
        line = line.strip()
        if line.startswith('title:'):
            title = line.split(':', 1)[1].strip().strip('\"').strip(\"'\")
        elif line.startswith('category:'):
            category = line.split(':', 1)[1].strip().strip('\"').strip(\"'\")
        elif line.startswith('description:'):
            description = line.split(':', 1)[1].strip().strip('\"').strip(\"'\")
        elif line.startswith('keyword:'):
            keyword = line.split(':', 1)[1].strip().strip('\"').strip(\"'\")
        elif line.startswith('post_type:'):
            post_type = line.split(':', 1)[1].strip().strip('\"').strip(\"'\")
        elif line.startswith('reading_time:'):
            reading_time = line.split(':', 1)[1].strip().strip('\"').strip(\"'\")
        elif line.startswith('date:'):
            date = line.split(':', 1)[1].strip().strip('\"').strip(\"'\")
        elif line.startswith('  - '):
            tags.append(line.strip('  - ').strip().strip('\"').strip(\"'\"))

# Build metadata callout
meta_parts = []
if category: meta_parts.append(f'Category: {category}')
if post_type: meta_parts.append(f'Type: {post_type}')
if keyword: meta_parts.append(f'Keyword: {keyword}')
if reading_time: meta_parts.append(f'Reading time: {reading_time}')
if date: meta_parts.append(f'Date: {date}')
if tags: meta_parts.append('Tags: ' + ', '.join(tags))
meta_text = ' | '.join(meta_parts) if meta_parts else 'No metadata'

# Build Notion blocks from markdown body
blocks = []

# Metadata callout
blocks.append({
    'object': 'block',
    'type': 'callout',
    'callout': {
        'icon': {'type': 'emoji', 'emoji': '\U0001f4dd'},
        'rich_text': [{'type': 'text', 'text': {'content': meta_text[:2000]}}]
    }
})

# Meta description
if description:
    blocks.append({
        'object': 'block',
        'type': 'quote',
        'quote': {
            'rich_text': [{'type': 'text', 'text': {'content': f'Meta: {description[:2000]}'}}]
        }
    })

blocks.append({
    'object': 'block',
    'type': 'divider',
    'divider': {}
})

# Parse markdown body into blocks
lines = body.split('\n')
i = 0
current_para = []

def flush_para():
    if current_para:
        text = '\n'.join(current_para).strip()
        if text:
            rich_text = []
            while text:
                chunk = text[:2000]
                text = text[2000:]
                rich_text.append({'type': 'text', 'text': {'content': chunk}})
            blocks.append({
                'object': 'block',
                'type': 'paragraph',
                'paragraph': {'rich_text': rich_text}
            })
        current_para.clear()

while i < len(lines):
    line = lines[i]
    stripped = line.strip()

    if stripped.startswith('# ') and not stripped.startswith('## '):
        flush_para()
        blocks.append({
            'object': 'block',
            'type': 'heading_1',
            'heading_1': {'rich_text': [{'type': 'text', 'text': {'content': stripped[2:].strip()[:2000]}}]}
        })
    elif stripped.startswith('## '):
        flush_para()
        blocks.append({
            'object': 'block',
            'type': 'heading_2',
            'heading_2': {'rich_text': [{'type': 'text', 'text': {'content': stripped[3:].strip()[:2000]}}]}
        })
    elif stripped.startswith('### '):
        flush_para()
        blocks.append({
            'object': 'block',
            'type': 'heading_3',
            'heading_3': {'rich_text': [{'type': 'text', 'text': {'content': stripped[4:].strip()[:2000]}}]}
        })
    elif stripped.startswith('---'):
        flush_para()
        blocks.append({
            'object': 'block',
            'type': 'divider',
            'divider': {}
        })
    elif stripped.startswith('- ') or stripped.startswith('* '):
        flush_para()
        bullet_text = stripped[2:].strip()
        blocks.append({
            'object': 'block',
            'type': 'bulleted_list_item',
            'bulleted_list_item': {'rich_text': [{'type': 'text', 'text': {'content': bullet_text[:2000]}}]}
        })
    elif re.match(r'^\d+\. ', stripped):
        flush_para()
        num_text = re.sub(r'^\d+\. ', '', stripped).strip()
        blocks.append({
            'object': 'block',
            'type': 'numbered_list_item',
            'numbered_list_item': {'rich_text': [{'type': 'text', 'text': {'content': num_text[:2000]}}]}
        })
    elif stripped.startswith('> '):
        flush_para()
        quote_text = stripped[2:].strip()
        blocks.append({
            'object': 'block',
            'type': 'quote',
            'quote': {'rich_text': [{'type': 'text', 'text': {'content': quote_text[:2000]}}]}
        })
    elif stripped.startswith('\`\`\`'):
        flush_para()
        # Collect code block
        lang = stripped[3:].strip()
        code_lines = []
        i += 1
        while i < len(lines) and not lines[i].strip().startswith('\`\`\`'):
            code_lines.append(lines[i])
            i += 1
        code_text = '\n'.join(code_lines)
        blocks.append({
            'object': 'block',
            'type': 'code',
            'code': {
                'rich_text': [{'type': 'text', 'text': {'content': code_text[:2000]}}],
                'language': lang if lang else 'plain text'
            }
        })
    elif stripped == '':
        flush_para()
    else:
        current_para.append(line)

    i += 1

flush_para()

# Notion API limits to 100 blocks per request — take first 100
output = {
    'title': title,
    'blocks': blocks[:100],
    'overflow': blocks[100:200] if len(blocks) > 100 else []
}
print(json.dumps(output))
" "$BLOG_FILE")

BLOG_TITLE=$(echo "$PARSED" | python3 -c "import sys,json; print(json.load(sys.stdin)['title'])")
BLOCKS=$(echo "$PARSED" | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)['blocks']))")
OVERFLOW=$(echo "$PARSED" | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)['overflow']))")

echo "Publishing to Notion: $BLOG_TITLE"

# Create the blog post page
RESPONSE=$(notion_api "/pages" "$(python3 -c "
import json, sys
blocks = json.loads(sys.argv[1])
print(json.dumps({
    'parent': {'page_id': '$BLOGS_PAGE_ID'},
    'icon': {'type': 'emoji', 'emoji': '\U0001f4dd'},
    'properties': {
        'title': {
            'title': [{'text': {'content': sys.argv[2]}}]
        }
    },
    'children': blocks
}))
" "$BLOCKS" "$BLOG_TITLE")")

PAGE_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

if [ -z "$PAGE_ID" ] || [ "$PAGE_ID" = "None" ]; then
  echo "ERROR: Failed to create blog page"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
  exit 1
fi

echo "Created page: $PAGE_ID"

# Append overflow blocks if any (blocks 101-200)
OVERFLOW_COUNT=$(echo "$OVERFLOW" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
if [ "$OVERFLOW_COUNT" -gt 0 ]; then
  echo "Appending $OVERFLOW_COUNT overflow blocks..."
  notion_api "/blocks/$PAGE_ID/children" "$(python3 -c "
import json, sys
blocks = json.loads(sys.argv[1])
print(json.dumps({'children': blocks}))
" "$OVERFLOW")" > /dev/null
fi

echo ""
echo "Done! View in Notion: https://www.notion.so/$(echo $PAGE_ID | tr -d '-')"
