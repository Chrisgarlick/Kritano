#!/usr/bin/env python3
"""
Publish prospect JSON files to Notion.

Structure: Prospect Domains -> Month (e.g. "March 2026") -> Day page (e.g. "2026-03-01 (300)")

Usage:
  python3 publish-prospects-to-notion.py                    # process all JSON files + March.zip
  python3 publish-prospects-to-notion.py --file 2026-04-01  # process a single date
  python3 publish-prospects-to-notion.py --month 2026-03    # process a specific month only
  python3 publish-prospects-to-notion.py --dry-run           # show what would be created
"""

import json
import os
import sys
import time
import glob
import zipfile
import tempfile
import shutil
import argparse
import urllib.request
from datetime import datetime
from collections import defaultdict

# --- Config ---
PROSPECT_OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prospect-output')
NOTION_VERSION = '2022-06-28'

# Parent page ID - same parent as Agency Prospects
AGENCY_PROSPECTS_PAGE_ID = '33c0a555-e5a3-80e7-bef1-c6a540228296'
# Will be set after finding/creating the Prospect Domains page
PROSPECT_DOMAINS_PAGE_ID = None
PROSPECT_DOMAINS_PAGE_ID_FILE = os.path.join(PROSPECT_OUTPUT_DIR, '.notion-prospect-domains-page-id')


def get_notion_api_key():
    """Get Notion API key from environment or .env file."""
    key = os.environ.get('NOTION_API')
    if key:
        return key

    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith('NOTION_API='):
                    return line.strip().split('=', 1)[1]

    print('ERROR: NOTION_API not set. Set it in server/.env or as an environment variable.')
    sys.exit(1)


NOTION_API = None  # Set in main()


def notion_api(endpoint, data=None, method='POST', retries=3):
    """Make a Notion API request with timeout and retry."""
    url = f'https://api.notion.com/v1{endpoint}'
    headers = {
        'Authorization': f'Bearer {NOTION_API}',
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
    }

    body = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    for attempt in range(retries):
        try:
            resp = urllib.request.urlopen(req, timeout=30)
            return json.loads(resp.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            if e.code == 429:
                retry_after = int(e.headers.get('Retry-After', 3))
                print(f' [rate limited {retry_after}s]', end='', flush=True)
                time.sleep(retry_after + 1)
                continue
            if e.code >= 500 and attempt < retries - 1:
                print(f' [server error, retry]', end='', flush=True)
                time.sleep(2)
                continue
            print(f'\n  Notion API error {e.code}: {error_body[:300]}')
            raise
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            if attempt < retries - 1:
                print(f' [timeout, retry]', end='', flush=True)
                time.sleep(3)
                continue
            print(f'\n  Network error after {retries} attempts: {e}')
            raise

    raise Exception(f'Failed after {retries} retries')


def find_child_page(parent_id, title):
    """Find a child page by title under a parent page."""
    cursor = None
    while True:
        endpoint = f'/blocks/{parent_id}/children?page_size=100'
        if cursor:
            endpoint += f'&start_cursor={cursor}'

        req = urllib.request.Request(
            f'https://api.notion.com/v1{endpoint}',
            headers={
                'Authorization': f'Bearer {NOTION_API}',
                'Notion-Version': NOTION_VERSION,
            },
            method='GET'
        )
        resp = urllib.request.urlopen(req)
        result = json.loads(resp.read().decode('utf-8'))

        for block in result.get('results', []):
            if block.get('type') == 'child_page':
                page_title = block.get('child_page', {}).get('title', '')
                if page_title == title:
                    return block['id']

        if not result.get('has_more'):
            break
        cursor = result.get('next_cursor')

    return None


def create_page(parent_id, title, icon=None, children=None):
    """Create a Notion page."""
    data = {
        'parent': {'page_id': parent_id},
        'properties': {
            'title': {
                'title': [{'text': {'content': title}}]
            }
        }
    }
    if icon:
        data['icon'] = {'type': 'emoji', 'emoji': icon}
    if children:
        data['children'] = children[:100]

    result = notion_api('/pages', data)
    page_id = result.get('id')

    # Append remaining children in batches
    if children and len(children) > 100:
        remaining = children[100:]
        for i in range(0, len(remaining), 100):
            batch = remaining[i:i+100]
            notion_api(f'/blocks/{page_id}/children', {'children': batch}, method='PATCH')
            time.sleep(1)

    return page_id


def get_or_create_prospect_domains_page():
    """Find or create the top-level 'Prospect Domains' page."""
    global PROSPECT_DOMAINS_PAGE_ID

    # Check cached ID
    if os.path.exists(PROSPECT_DOMAINS_PAGE_ID_FILE):
        with open(PROSPECT_DOMAINS_PAGE_ID_FILE) as f:
            cached_id = f.read().strip()
            if cached_id:
                PROSPECT_DOMAINS_PAGE_ID = cached_id
                print(f'  Using cached Prospect Domains page: {cached_id}')
                return cached_id

    # Find parent of Agency Prospects page to create sibling
    req = urllib.request.Request(
        f'https://api.notion.com/v1/pages/{AGENCY_PROSPECTS_PAGE_ID}',
        headers={
            'Authorization': f'Bearer {NOTION_API}',
            'Notion-Version': NOTION_VERSION,
        },
        method='GET'
    )
    resp = urllib.request.urlopen(req)
    page_data = json.loads(resp.read().decode('utf-8'))
    parent_id = page_data.get('parent', {}).get('page_id')

    if not parent_id:
        print('ERROR: Could not find parent of Agency Prospects page')
        sys.exit(1)

    # Check if "Prospect Domains" already exists
    existing = find_child_page(parent_id, 'Prospect Domains')
    if existing:
        PROSPECT_DOMAINS_PAGE_ID = existing
        print(f'  Found existing Prospect Domains page: {existing}')
    else:
        PROSPECT_DOMAINS_PAGE_ID = create_page(parent_id, 'Prospect Domains', icon='\U0001f310')
        print(f'  Created Prospect Domains page: {PROSPECT_DOMAINS_PAGE_ID}')

    # Cache it
    with open(PROSPECT_DOMAINS_PAGE_ID_FILE, 'w') as f:
        f.write(PROSPECT_DOMAINS_PAGE_ID)

    return PROSPECT_DOMAINS_PAGE_ID


def get_or_create_month_page(month_label):
    """Find or create a month page (e.g. 'March 2026') under Prospect Domains."""
    existing = find_child_page(PROSPECT_DOMAINS_PAGE_ID, month_label)
    if existing:
        print(f'  Found existing month page: {month_label}')
        return existing

    page_id = create_page(PROSPECT_DOMAINS_PAGE_ID, month_label, icon='\U0001f4c5')
    print(f'  Created month page: {month_label} ({page_id})')
    return page_id


def day_page_exists(month_page_id, day_title):
    """Check if a day page already exists under a month."""
    return find_child_page(month_page_id, day_title) is not None


def build_prospect_blocks(prospects):
    """Build Notion blocks for a list of prospects. One toggle per prospect for compact display."""
    blocks = []

    # Stats callout
    tech_counts = defaultdict(int)
    with_email = sum(1 for p in prospects if p.get('contact_email'))
    with_form = sum(1 for p in prospects if p.get('has_contact_form'))
    for p in prospects:
        for t in p.get('technology_stack', []):
            tech_counts[t] += 1

    top_tech = sorted(tech_counts.items(), key=lambda x: -x[1])[:5]
    tech_summary = ', '.join(f'{t} ({c})' for t, c in top_tech)

    blocks.append({
        'object': 'block',
        'type': 'callout',
        'callout': {
            'icon': {'type': 'emoji', 'emoji': '\U0001f4ca'},
            'rich_text': [{'type': 'text', 'text': {
                'content': f'{len(prospects)} prospects | {with_email} with email | {with_form} with contact form\nTop tech: {tech_summary}'
            }}]
        }
    })

    blocks.append({
        'object': 'block',
        'type': 'divider',
        'divider': {}
    })

    # Each prospect as a compact bulleted item
    for p in prospects:
        domain = p.get('domain', '?')
        email = p.get('contact_email', '')
        score = p.get('quality_score', 0)
        tech = ', '.join(p.get('technology_stack', [])[:3])
        title = p.get('title', '')
        lang = p.get('language', '')

        # Clean title
        if title:
            for sep in [' | ', ' - ', ' \u2013 ', ' \u2014 ']:
                if sep in title:
                    title = title.split(sep)[0]
            title = title.strip()[:60]

        # Build compact line
        parts = [domain]
        if email:
            parts.append(f'| {email}')
        elif p.get('has_contact_form'):
            parts.append('| (form)')
        parts.append(f'| {score}pts')
        if tech:
            parts.append(f'| {tech}')
        if lang and lang != 'en':
            parts.append(f'| {lang}')

        line = ' '.join(parts)

        blocks.append({
            'object': 'block',
            'type': 'bulleted_list_item',
            'bulleted_list_item': {
                'rich_text': [{'type': 'text', 'text': {'content': line[:2000]}}]
            }
        })

    return blocks


def publish_day(month_page_id, date_str, prospects, dry_run=False):
    """Publish a single day's prospects to Notion."""
    day_title = f'{date_str} ({len(prospects)})'

    if day_page_exists(month_page_id, day_title):
        print(f'    Skipping {date_str} - already exists')
        return

    if dry_run:
        print(f'    Would create: {day_title}')
        return

    blocks = build_prospect_blocks(prospects)
    print(f'    Publishing {day_title} ({len(blocks)} blocks)...', end='', flush=True)

    page_id = create_page(month_page_id, day_title, icon='\U0001f4cb', children=blocks)
    print(f' done ({page_id})')
    time.sleep(0.5)


def collect_json_files(specific_file=None, specific_month=None):
    """Collect all prospect JSON files, including from March.zip."""
    files = {}  # date_str -> filepath

    # Regular JSON files in prospect-output/
    for filepath in sorted(glob.glob(os.path.join(PROSPECT_OUTPUT_DIR, 'qualified-prospects-*.json'))):
        basename = os.path.basename(filepath)
        # Extract date from "qualified-prospects-2026-04-01.json"
        date_str = basename.replace('qualified-prospects-', '').replace('.json', '')
        files[date_str] = filepath

    # March.zip
    zip_path = os.path.join(PROSPECT_OUTPUT_DIR, 'March.zip')
    temp_dir = None
    if os.path.exists(zip_path):
        temp_dir = tempfile.mkdtemp(prefix='prospects-march-')
        with zipfile.ZipFile(zip_path) as z:
            for name in z.namelist():
                if name.startswith('__MACOSX') or not name.endswith('.json'):
                    continue
                basename = os.path.basename(name)
                date_str = basename.replace('qualified-prospects-', '').replace('.json', '')
                # Skip duplicates like "2026-03-14-1"
                if len(date_str) > 10:
                    continue
                z.extract(name, temp_dir)
                files[date_str] = os.path.join(temp_dir, name)

    # Filter
    if specific_file:
        files = {k: v for k, v in files.items() if specific_file in k}
    elif specific_month:
        files = {k: v for k, v in files.items() if k.startswith(specific_month)}

    return dict(sorted(files.items())), temp_dir


def main():
    global NOTION_API

    parser = argparse.ArgumentParser(description='Publish prospect JSONs to Notion')
    parser.add_argument('--file', help='Process a single date (e.g. 2026-04-01)')
    parser.add_argument('--month', help='Process a specific month (e.g. 2026-03)')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be created')
    args = parser.parse_args()

    NOTION_API = get_notion_api_key()

    print('Collecting JSON files...')
    files, temp_dir = collect_json_files(specific_file=args.file, specific_month=args.month)

    if not files:
        print('No matching JSON files found.')
        return

    # Group by month
    months = defaultdict(dict)
    for date_str, filepath in files.items():
        try:
            dt = datetime.strptime(date_str, '%Y-%m-%d')
            month_label = dt.strftime('%B %Y')  # e.g. "March 2026"
            months[month_label][date_str] = filepath
        except ValueError:
            print(f'  Skipping unrecognised date: {date_str}')

    total_files = sum(len(days) for days in months.values())
    print(f'Found {total_files} files across {len(months)} months')

    if args.dry_run:
        print('\n--- DRY RUN ---')
        for month_label in sorted(months.keys()):
            print(f'\n  {month_label}:')
            for date_str in sorted(months[month_label].keys()):
                filepath = months[month_label][date_str]
                with open(filepath) as f:
                    count = len(json.load(f))
                print(f'    {date_str} ({count} prospects)')
        print('\nNo changes made.')
        return

    # Setup Notion pages
    print('\nSetting up Notion structure...')
    get_or_create_prospect_domains_page()

    # Process each month
    for month_label in sorted(months.keys()):
        days = months[month_label]
        print(f'\n  {month_label} ({len(days)} days)')
        month_page_id = get_or_create_month_page(month_label)

        for date_str in sorted(days.keys()):
            filepath = days[date_str]
            with open(filepath) as f:
                prospects = json.load(f)

            publish_day(month_page_id, date_str, prospects)

    # Cleanup temp dir
    if temp_dir and os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)

    print('\nDone!')


if __name__ == '__main__':
    main()
