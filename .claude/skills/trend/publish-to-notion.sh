#!/bin/bash
# publish-to-notion.sh — Push trend content to Notion under the Kritano page
#
# Usage: ./publish-to-notion.sh <trend-date-folder>
# Example: ./publish-to-notion.sh /Users/chris/Herd/pagepulser/docs/trend/2026-04-07
#
# Requires: NOTION_API env var (sourced from server/.env if not set)
# Creates: A parent page titled with the trend name + date, with sub-pages for each platform

set -euo pipefail

TRENDS_PAGE_ID="33c0a555-e5a3-8020-9296-c0d519429ee4"
NOTION_VERSION="2022-06-28"
TREND_DIR="${1:?Usage: publish-to-notion.sh <trend-date-folder>}"

# Source API key if not already set
if [ -z "${NOTION_API:-}" ]; then
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  # Try relative to script location (inside .claude/skills/trend/)
  PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
  if [ -f "$PROJECT_ROOT/server/.env" ]; then
    export $(grep '^NOTION_API=' "$PROJECT_ROOT/server/.env" | xargs)
  fi
  # Also try current working directory
  if [ -z "${NOTION_API:-}" ] && [ -f "./server/.env" ]; then
    export $(grep '^NOTION_API=' "./server/.env" | xargs)
  fi
fi

if [ -z "${NOTION_API:-}" ]; then
  echo "ERROR: NOTION_API not set and not found in server/.env"
  exit 1
fi

# Extract date from folder name
TREND_DATE=$(basename "$TREND_DIR")

# Read brief to get trend title
BRIEF_FILE="$TREND_DIR/brief.md"
if [ ! -f "$BRIEF_FILE" ]; then
  echo "ERROR: No brief.md found in $TREND_DIR"
  exit 1
fi

# Extract the trend topic name from "### Selected Trend: ..." line, falling back to first heading
TREND_TITLE=$(grep -m1 '### Selected Trend:' "$BRIEF_FILE" | sed 's/### Selected Trend: *//' | head -c 100)
if [ -z "$TREND_TITLE" ]; then
  # Fallback: try "## " heading that isn't "Pillar:"
  TREND_TITLE=$(grep -m1 '^## ' "$BRIEF_FILE" | grep -v 'Pillar:' | sed 's/^## //' | head -c 100)
fi
if [ -z "$TREND_TITLE" ]; then
  TREND_TITLE="Trend Report"
fi

PAGE_TITLE="$TREND_TITLE - $TREND_DATE"

notion_api() {
  local endpoint="$1"
  local data="$2"
  curl -s "https://api.notion.com/v1${endpoint}" \
    -H "Authorization: Bearer $NOTION_API" \
    -H "Notion-Version: $NOTION_VERSION" \
    -H "Content-Type: application/json" \
    -d "$data"
}

# Helper: convert plain text to Notion rich_text blocks (splits on 2000 char limit)
text_to_rich_text_json() {
  local text="$1"
  python3 -c "
import json, sys

text = sys.stdin.read()
blocks = []
# Split into chunks of 2000 chars (Notion limit per rich_text element)
while text:
    chunk = text[:2000]
    text = text[2000:]
    blocks.append({
        'type': 'text',
        'text': {'content': chunk}
    })
print(json.dumps(blocks))
" <<< "$text"
}

# Helper: convert file content into Notion paragraph blocks
file_to_notion_blocks() {
  local file="$1"
  python3 -c "
import json, sys

content = open(sys.argv[1], 'r').read().strip()
blocks = []

# Split by double newlines into paragraphs
paragraphs = content.split('\n\n')

for para in paragraphs:
    para = para.strip()
    if not para:
        continue

    # Check if it's a heading
    if para.startswith('# '):
        blocks.append({
            'object': 'block',
            'type': 'heading_1',
            'heading_1': {
                'rich_text': [{'type': 'text', 'text': {'content': para[2:].strip()[:2000]}}]
            }
        })
    elif para.startswith('## '):
        blocks.append({
            'object': 'block',
            'type': 'heading_2',
            'heading_2': {
                'rich_text': [{'type': 'text', 'text': {'content': para[3:].strip()[:2000]}}]
            }
        })
    elif para.startswith('### '):
        blocks.append({
            'object': 'block',
            'type': 'heading_3',
            'heading_3': {
                'rich_text': [{'type': 'text', 'text': {'content': para[4:].strip()[:2000]}}]
            }
        })
    elif para.startswith('---'):
        blocks.append({
            'object': 'block',
            'type': 'divider',
            'divider': {}
        })
    else:
        # Split long paragraphs into chunks for rich_text
        rich_text = []
        remaining = para
        while remaining:
            chunk = remaining[:2000]
            remaining = remaining[2000:]
            rich_text.append({'type': 'text', 'text': {'content': chunk}})

        blocks.append({
            'object': 'block',
            'type': 'paragraph',
            'paragraph': {
                'rich_text': rich_text
            }
        })

# Notion API limits to 100 blocks per request
blocks = blocks[:100]
print(json.dumps(blocks))
" "$file"
}

echo "Creating trend page: $PAGE_TITLE"

# Step 1: Create the parent trend page under Kritano
PARENT_RESPONSE=$(notion_api "/pages" "$(python3 -c "
import json
print(json.dumps({
    'parent': {'page_id': '$TRENDS_PAGE_ID'},
    'icon': {'type': 'emoji', 'emoji': '\U0001f4f0'},
    'properties': {
        'title': {
            'title': [{'text': {'content': '''$PAGE_TITLE'''}}]
        }
    },
    'children': [
        {
            'object': 'block',
            'type': 'callout',
            'callout': {
                'icon': {'type': 'emoji', 'emoji': '\U0001f4c5'},
                'rich_text': [{'type': 'text', 'text': {'content': 'Generated by Kritano Trend Engine on $TREND_DATE'}}]
            }
        }
    ]
}))
")")

PARENT_PAGE_ID=$(echo "$PARENT_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

if [ -z "$PARENT_PAGE_ID" ] || [ "$PARENT_PAGE_ID" = "None" ]; then
  echo "ERROR: Failed to create parent page"
  echo "$PARENT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$PARENT_RESPONSE"
  exit 1
fi

echo "Created parent page: $PARENT_PAGE_ID"

# Step 2: Create sub-pages for each platform
create_subpage() {
  local title="$1"
  local emoji="$2"
  local file="$3"

  if [ ! -f "$file" ]; then
    echo "  Skipping $title - no file found at $file"
    return
  fi

  local blocks
  blocks=$(file_to_notion_blocks "$file")

  local response
  response=$(notion_api "/pages" "$(python3 -c "
import json, sys
blocks = json.loads(sys.argv[1])
print(json.dumps({
    'parent': {'page_id': '$PARENT_PAGE_ID'},
    'icon': {'type': 'emoji', 'emoji': sys.argv[2]},
    'properties': {
        'title': {
            'title': [{'text': {'content': sys.argv[3]}}]
        }
    },
    'children': blocks
}))
" "$blocks" "$emoji" "$title")")

  local page_id
  page_id=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id','FAILED'))" 2>/dev/null)
  echo "  Created: $title ($page_id)"
}

# Brief (internal reference)
create_subpage "Brief" "📋" "$TREND_DIR/brief.md"

# X Threads
create_subpage "X (Twitter) Thread" "🐦" "$TREND_DIR/x-threads.txt"

# Instagram Captions
create_subpage "Instagram Captions" "📸" "$TREND_DIR/captions.txt"

# LinkedIn Post
create_subpage "LinkedIn Post" "💼" "$TREND_DIR/linkedin.txt"

# Reddit Post
create_subpage "Reddit Post" "🤖" "$TREND_DIR/reddit.txt"

# Blog Post
create_subpage "Blog Post" "📝" "$TREND_DIR/blog.md"

# Video (just the file path reference since it's HTML/MP4)
if [ -f "$TREND_DIR/video.html" ] || [ -f "$TREND_DIR/video.mp4" ]; then
  VIDEO_FILE="$TREND_DIR/video.html"
  [ -f "$TREND_DIR/video.mp4" ] && VIDEO_FILE="$TREND_DIR/video.mp4"

  VIDEO_BLOCKS=$(python3 -c "
import json, sys
video_path = sys.argv[1]
blocks = [
    {
        'object': 'block',
        'type': 'callout',
        'callout': {
            'icon': {'type': 'emoji', 'emoji': '\U0001f4c2'},
            'rich_text': [{'type': 'text', 'text': {'content': 'Local file: ' + video_path}}]
        }
    },
    {
        'object': 'block',
        'type': 'paragraph',
        'paragraph': {
            'rich_text': [{'type': 'text', 'text': {'content': 'Open video.html in a browser to preview. Convert to MP4 with: npx puppeteer-screen-recorder video.html video.mp4'}}]
        }
    }
]
print(json.dumps(blocks))
" "$VIDEO_FILE")

  VIDEO_RESPONSE=$(notion_api "/pages" "$(python3 -c "
import json, sys
blocks = json.loads(sys.argv[1])
print(json.dumps({
    'parent': {'page_id': '$PARENT_PAGE_ID'},
    'icon': {'type': 'emoji', 'emoji': '\U0001f3ac'},
    'properties': {
        'title': {
            'title': [{'text': {'content': 'Video'}}]
        }
    },
    'children': blocks
}))
" "$VIDEO_BLOCKS")")

  VIDEO_PAGE_ID=$(echo "$VIDEO_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id','FAILED'))" 2>/dev/null)
  echo "  Created: Video ($VIDEO_PAGE_ID)"
fi

# Instagram Visuals — check for visuals subfolder (new location) or legacy draw folder
DRAW_DIR="$TREND_DIR/visuals"
if [ ! -d "$DRAW_DIR" ]; then
  DRAW_DIR=$(find "$(dirname "$TREND_DIR")/../draw" -maxdepth 1 -type d -name "trend-${TREND_DATE}*" 2>/dev/null | head -1)
fi
if [ -n "$DRAW_DIR" ] && [ -d "$DRAW_DIR" ]; then
  # Build a list of PNG files
  PNG_FILES=$(find "$DRAW_DIR" -name "*.png" -type f | sort)
  if [ -n "$PNG_FILES" ]; then
    # Create blocks: a callout with the folder path, then each image as a numbered entry
    VISUAL_BLOCKS=$(python3 -c "
import json, os, sys

draw_dir = sys.argv[1]
png_files = [f.strip() for f in sys.stdin.read().strip().split('\n') if f.strip()]

blocks = [
    {
        'object': 'block',
        'type': 'callout',
        'callout': {
            'icon': {'type': 'emoji', 'emoji': '\U0001f4c2'},
            'rich_text': [{'type': 'text', 'text': {'content': 'Local folder: ' + draw_dir}}]
        }
    },
    {
        'object': 'block',
        'type': 'paragraph',
        'paragraph': {
            'rich_text': [{'type': 'text', 'text': {'content': str(len(png_files)) + ' visual(s) generated. Open the HTML files in a browser to preview, or use the PNGs directly.'}}]
        }
    },
    {
        'object': 'block',
        'type': 'divider',
        'divider': {}
    }
]

for i, png in enumerate(png_files, 1):
    filename = os.path.basename(png)
    html_file = os.path.splitext(png)[0] + '.html'
    has_html = os.path.exists(html_file)
    label = f'Visual {i}: {filename}'
    if has_html:
        label += f' (+ {os.path.basename(html_file)})'
    blocks.append({
        'object': 'block',
        'type': 'to_do',
        'to_do': {
            'rich_text': [{'type': 'text', 'text': {'content': label}}],
            'checked': False
        }
    })

print(json.dumps(blocks))
" "$DRAW_DIR" <<< "$PNG_FILES")

    VISUAL_RESPONSE=$(notion_api "/pages" "$(python3 -c "
import json, sys
blocks = json.loads(sys.argv[1])
print(json.dumps({
    'parent': {'page_id': '$PARENT_PAGE_ID'},
    'icon': {'type': 'emoji', 'emoji': '\U0001f3a8'},
    'properties': {
        'title': {
            'title': [{'text': {'content': 'Instagram Visuals'}}]
        }
    },
    'children': blocks
}))
" "$VISUAL_BLOCKS")")

    VISUAL_PAGE_ID=$(echo "$VISUAL_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id','FAILED'))" 2>/dev/null)
    echo "  Created: Instagram Visuals ($VISUAL_PAGE_ID)"
  fi
else
  echo "  Skipping Instagram Visuals - no draw assets found for $TREND_DATE"
fi

echo ""
echo "Done! View in Notion: https://www.notion.so/$(echo $PARENT_PAGE_ID | tr -d '-')"
