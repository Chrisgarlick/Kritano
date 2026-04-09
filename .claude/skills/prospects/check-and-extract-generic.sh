#!/bin/bash
# check-and-extract-generic.sh - Check domains for liveness, extract contacts
#
# Usage: ./check-and-extract-generic.sh <domains-file> <output-json> <mode>
# Modes: agency | local | ecommerce
#
# - agency: requires agency keyword signals (original behaviour)
# - local: no keyword filter, any live business qualifies
# - ecommerce: looks for ecommerce signals (cart, shop, product pages, Shopify/WooCommerce)

set -euo pipefail

DOMAINS_FILE="${1:?Usage: check-and-extract-generic.sh <domains-file> <output-json> <mode>}"
OUTPUT_FILE="${2:?Usage: check-and-extract-generic.sh <domains-file> <output-json> <mode>}"
MODE="${3:-local}"

if [ ! -f "$DOMAINS_FILE" ]; then
  echo "ERROR: Domains file not found: $DOMAINS_FILE"
  exit 1
fi

# Filter out known domains
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
KNOWN_FILE="$PROJECT_ROOT/docs/prospects/known-domains.txt"

if [ -f "$KNOWN_FILE" ]; then
  BEFORE=$(wc -l < "$DOMAINS_FILE" | tr -d ' ')
  TEMP_FILE=$(mktemp)
  grep -vxFf "$KNOWN_FILE" "$DOMAINS_FILE" > "$TEMP_FILE" 2>/dev/null || true
  AFTER=$(wc -l < "$TEMP_FILE" | tr -d ' ')
  SKIPPED=$((BEFORE - AFTER))
  if [ "$SKIPPED" -gt 0 ]; then
    echo "Filtered $SKIPPED already-known domains ($BEFORE -> $AFTER new)"
  fi
  cp "$TEMP_FILE" "$DOMAINS_FILE"
  rm "$TEMP_FILE"
fi

TOTAL=$(wc -l < "$DOMAINS_FILE" | tr -d ' ')

if [ "$TOTAL" -eq 0 ]; then
  echo "No new domains to process (all already known)."
  echo "[]" > "$OUTPUT_FILE"
  exit 0
fi

echo "Processing $TOTAL new domains (mode: $MODE)..."

python3 -c "
import urllib.request
import urllib.error
import ssl
import re
import json
import sys
import time
import socket
from html.parser import HTMLParser

MODE = sys.argv[3]

TIMEOUT = 10
ALLOWED_EMAIL_PREFIXES = [
    'info', 'hello', 'support', 'contact', 'admin', 'enquiries', 'team',
    'sales', 'help', 'office', 'general', 'mail', 'web', 'website',
    'hi', 'hey', 'business', 'reception', 'feedback', 'press', 'media',
    'partnerships', 'marketing', 'studio', 'digital', 'projects', 'work',
    'newbusiness', 'enquiry', 'bookings', 'appointments', 'orders', 'shop'
]
GENERIC_PROVIDERS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'protonmail.com', 'proton.me', 'zoho.com', 'yandex.com',
    'mail.com', 'live.com', 'msn.com', 'btinternet.com', 'sky.com',
    'virginmedia.com', 'talktalk.net'
]
AGENCY_KEYWORDS = [
    'agency', 'agencies', 'digital', 'web design', 'web development',
    'marketing agency', 'creative agency', 'design studio', 'studio',
    'development company', 'seo agency', 'seo company', 'media agency',
    'branding agency', 'creative studio', 'digital studio', 'consultancy',
    'web agency', 'dev shop', 'shopify partner', 'wordpress agency',
    'ecommerce agency', 'ux agency', 'ui/ux'
]
ECOMMERCE_SIGNALS = [
    'add to cart', 'add to basket', 'shop now', 'buy now', 'checkout',
    'shopping cart', 'our products', 'product range', 'online store',
    'free delivery', 'free shipping', '/products', '/shop', '/store',
    '/collections', 'shopify', 'woocommerce', 'bigcommerce', 'magento',
    'ecommerce', 'e-commerce'
]
TECH_PATTERNS = {
    'WordPress': [r'wp-content', r'wp-includes', r'wordpress'],
    'Shopify': [r'cdn\.shopify\.com', r'shopify'],
    'Wix': [r'wix\.com', r'wixsite\.com'],
    'Squarespace': [r'squarespace\.com', r'sqsp\.com'],
    'Webflow': [r'webflow\.com', r'assets\.website-files\.com'],
    'React': [r'react', r'_next/', r'__next'],
    'Next.js': [r'_next/', r'__next'],
    'Vue': [r'vue\.js', r'nuxt'],
    'Angular': [r'ng-version', r'angular'],
    'Laravel': [r'laravel', r'csrf-token'],
    'Drupal': [r'drupal\.js', r'/sites/default/'],
    'HubSpot': [r'hubspot', r'hs-scripts'],
    'Bootstrap': [r'bootstrap'],
    'Tailwind': [r'tailwind'],
    'jQuery': [r'jquery'],
    'Google Analytics': [r'google-analytics\.com', r'gtag', r'googletagmanager'],
    'WooCommerce': [r'woocommerce', r'wc-'],
    'Gatsby': [r'gatsby'],
    'Ghost': [r'ghost\.org', r'ghost\.io'],
    'BigCommerce': [r'bigcommerce'],
    'Magento': [r'magento', r'mage'],
    'PrestaShop': [r'prestashop'],
}
CONTACT_PATHS = ['/contact', '/contact-us', '/about', '/about-us', '/get-in-touch']
PARKED_SIGNALS = [
    'domain for sale', 'this domain is for sale', 'buy this domain',
    'parked domain', 'godaddy', 'sedo.com', 'afternic',
    'coming soon', 'under construction', 'future home of',
    'this page is not yet available', 'website coming soon',
    'apache2 default page', 'it works!', 'welcome to nginx',
    'default web site page', 'iis windows server',
    'index of /', 'directory listing'
]

class MetaParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ''
        self.in_title = False
        self.meta_desc = ''
        self.emails = set()
        self.links = []
        self.social = {}
        self.has_form = False
        self.body_text = ''
        self.in_body = False
        self.internal_links = 0

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == 'title':
            self.in_title = True
        elif tag == 'meta':
            name = d.get('name', '').lower()
            content = d.get('content', '')
            if name == 'description' and content:
                self.meta_desc = content[:500]
        elif tag == 'a':
            href = d.get('href', '')
            if href.startswith('mailto:'):
                email = href.replace('mailto:', '').split('?')[0].strip().lower()
                if '@' in email:
                    self.emails.add(email)
            elif 'linkedin.com' in href:
                self.social['linkedin'] = href
            elif 'twitter.com' in href or 'x.com' in href:
                self.social['twitter'] = href
            elif 'facebook.com' in href:
                self.social['facebook'] = href
            elif 'instagram.com' in href:
                self.social['instagram'] = href
            if not href.startswith(('http', 'mailto:', 'tel:', '#', 'javascript')):
                self.internal_links += 1
            self.links.append(href)
        elif tag == 'form':
            self.has_form = True
        elif tag == 'body':
            self.in_body = True

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False
        elif tag == 'body':
            self.in_body = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        if self.in_body:
            self.body_text += data + ' '

def fetch_url(url, timeout=TIMEOUT):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (compatible; Kritano/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-GB,en;q=0.9',
    })
    try:
        resp = urllib.request.urlopen(req, timeout=timeout, context=ctx)
        content_type = resp.headers.get('Content-Type', '')
        if 'text/html' not in content_type and 'application/xhtml' not in content_type:
            return None, resp.status
        body = resp.read(500000).decode('utf-8', errors='replace')
        return body, resp.status
    except Exception:
        return None, None

def check_domain(domain):
    result = {
        'domain': domain,
        'is_live': False,
        'has_ssl': False,
        'http_status': None,
        'title': None,
        'meta_description': None,
        'technology_stack': [],
        'page_count_estimate': 0,
        'is_parked': False,
        'signals': [],
    }

    html = None
    for scheme in ['https', 'http']:
        url = f'{scheme}://{domain}'
        html, status = fetch_url(url)
        if html:
            result['is_live'] = True
            result['has_ssl'] = (scheme == 'https')
            result['http_status'] = status
            break

    if not html:
        return result, None

    parser = MetaParser()
    try:
        parser.feed(html)
    except Exception:
        pass

    result['title'] = parser.title.strip()[:200] if parser.title.strip() else None
    result['meta_description'] = parser.meta_desc[:500] if parser.meta_desc else None
    result['page_count_estimate'] = min(parser.internal_links, 200)

    html_lower = html.lower()
    for tech, patterns in TECH_PATTERNS.items():
        for pat in patterns:
            if re.search(pat, html_lower):
                result['technology_stack'].append(tech)
                break

    combined = (result['title'] or '').lower() + ' ' + (result['meta_description'] or '').lower() + ' ' + html_lower[:5000]
    for signal in PARKED_SIGNALS:
        if signal in combined:
            result['is_parked'] = True
            break

    # Mode-specific signal detection
    if MODE == 'agency':
        for kw in AGENCY_KEYWORDS:
            if kw in combined[:10000]:
                result['signals'].append(kw)
    elif MODE == 'ecommerce':
        for kw in ECOMMERCE_SIGNALS:
            if kw in combined[:10000]:
                result['signals'].append(kw)

    return result, parser

def extract_emails(domain, has_ssl, homepage_parser):
    scheme = 'https' if has_ssl else 'http'
    all_emails = set(homepage_parser.emails)
    social = dict(homepage_parser.social)
    has_form = homepage_parser.has_form
    contact_page_url = None

    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    found = re.findall(email_pattern, homepage_parser.body_text)
    for e in found:
        e = e.lower().strip('.')
        if '@' in e and '.' in e.split('@')[1]:
            all_emails.add(e)

    for path in CONTACT_PATHS:
        url = f'{scheme}://{domain}{path}'
        html, status = fetch_url(url, timeout=8)
        if not html:
            continue
        contact_page_url = path
        cp = MetaParser()
        try:
            cp.feed(html)
        except Exception:
            pass
        all_emails.update(cp.emails)
        if cp.has_form:
            has_form = True
        for k, v in cp.social.items():
            if k not in social:
                social[k] = v
        found = re.findall(email_pattern, cp.body_text)
        for e in found:
            e = e.lower().strip('.')
            if '@' in e and '.' in e.split('@')[1]:
                all_emails.add(e)
        time.sleep(0.5)
        break

    qualified_emails = []
    for email in all_emails:
        local = email.split('@')[0].lower()
        email_domain = email.split('@')[1].lower()
        if email_domain in GENERIC_PROVIDERS:
            continue
        if local in ['noreply', 'no-reply', 'postmaster', 'webmaster', 'abuse']:
            continue
        if email_domain.endswith(('.png', '.jpg', '.gif', '.svg', '.css', '.js')):
            continue
        if local in ALLOWED_EMAIL_PREFIXES:
            qualified_emails.append({
                'email': email,
                'source': 'page_scrape',
                'confidence': 'high',
            })

    primary_email = None
    for e in qualified_emails:
        if domain in e['email']:
            primary_email = e['email']
            break
    if not primary_email and qualified_emails:
        primary_email = qualified_emails[0]['email']

    return {
        'emails': qualified_emails,
        'primary_email': primary_email,
        'social_links': social,
        'has_contact_form': has_form,
        'contact_page_url': contact_page_url,
    }

def score_prospect(check, extract):
    score = 0
    if check['has_ssl']:
        score += 15
    if check['title'] and len(check['title']) > 5:
        score += 10
    if check['meta_description'] and len(check['meta_description']) > 20:
        score += 10
    if check['page_count_estimate'] >= 5:
        score += 10
    if check['technology_stack']:
        score += 10
    if extract['primary_email']:
        score += 15
    if extract['has_contact_form']:
        score += 5
    if extract['social_links'].get('linkedin'):
        score += 5
    if len(extract['social_links']) >= 2:
        score += 5
    tld = check['domain'].split('.')[-1]
    if tld in ['com', 'co.uk', 'org.uk', 'io', 'shop', 'store', 'co']:
        score += 5

    # Mode-specific scoring
    if MODE == 'agency' and check['signals']:
        score += 15
        if len(check['signals']) >= 2:
            score += 5
    elif MODE == 'ecommerce' and check['signals']:
        score += 15
        if len(check['signals']) >= 3:
            score += 5
    elif MODE == 'local':
        # Local businesses get a baseline bonus for just being a real site
        if check['page_count_estimate'] >= 3:
            score += 10

    return min(score, 100)

# --- Main ---
domains_file = sys.argv[1]
output_file = sys.argv[2]

with open(domains_file) as f:
    domains = [line.strip() for line in f if line.strip()]

total = len(domains)
prospects = []
stats = {'total': total, 'live': 0, 'matched': 0, 'qualified': 0, 'parked': 0, 'dead': 0, 'no_contact': 0, 'no_match': 0}

for i, domain in enumerate(domains):
    num = i + 1
    sys.stdout.write(f'\r  [{num}/{total}] Checking {domain}...' + ' ' * 20)
    sys.stdout.flush()

    try:
        result, parser = check_domain(domain)
    except Exception:
        stats['dead'] += 1
        continue

    if not result['is_live'] or parser is None:
        stats['dead'] += 1
        time.sleep(0.5)
        continue

    stats['live'] += 1

    if result['is_parked']:
        stats['parked'] += 1
        time.sleep(0.5)
        continue

    # Mode-specific filtering
    if MODE == 'agency' and not result['signals']:
        stats['no_match'] += 1
        time.sleep(0.5)
        continue
    elif MODE == 'ecommerce' and not result['signals']:
        stats['no_match'] += 1
        time.sleep(0.5)
        continue
    # local mode: no keyword filter - any live non-parked site qualifies

    stats['matched'] += 1

    try:
        extract = extract_emails(domain, result['has_ssl'], parser)
    except Exception:
        extract = {'emails': [], 'primary_email': None, 'social_links': {}, 'has_contact_form': False, 'contact_page_url': None}

    if not extract['primary_email'] and not extract['has_contact_form']:
        stats['no_contact'] += 1
        time.sleep(1)
        continue

    quality = score_prospect(result, extract)
    if quality < 40:
        time.sleep(1)
        continue

    stats['qualified'] += 1
    prospects.append({
        'domain': domain,
        'title': result['title'],
        'meta_description': result['meta_description'],
        'technology_stack': result['technology_stack'],
        'has_ssl': result['has_ssl'],
        'page_count_estimate': result['page_count_estimate'],
        'signals': result['signals'],
        'quality_score': quality,
        'contact_email': extract['primary_email'],
        'emails': extract['emails'],
        'social_links': extract['social_links'],
        'has_contact_form': extract['has_contact_form'],
        'contact_page_url': extract['contact_page_url'],
    })

    time.sleep(1)

with open(output_file, 'w') as f:
    json.dump(prospects, f, indent=2)

label = 'Agencies' if MODE == 'agency' else 'Ecommerce' if MODE == 'ecommerce' else 'Businesses'
print()
print()
print(f'Results: {stats[\"qualified\"]} qualified / {total} checked')
print(f'  Live: {stats[\"live\"]} | {label}: {stats[\"matched\"]} | Qualified: {stats[\"qualified\"]}')
print(f'  Filtered: {stats[\"dead\"]} dead, {stats[\"parked\"]} parked, {stats[\"no_match\"]} no match, {stats[\"no_contact\"]} no contact')
print(f'Output: {output_file}')
" "$DOMAINS_FILE" "$OUTPUT_FILE" "$MODE"

# Append all processed domains to known-domains.txt
if [ -f "$KNOWN_FILE" ]; then
  cat "$DOMAINS_FILE" >> "$KNOWN_FILE"
  sort -u "$KNOWN_FILE" -o "$KNOWN_FILE"
  echo "Updated known-domains.txt ($(wc -l < "$KNOWN_FILE" | tr -d ' ') total)"
fi
