#!/bin/bash
# check-and-extract.sh - Check freelancer domains for liveness, extract contacts
#
# Usage: ./check-and-extract.sh <domains-file> <output-json>
# Example: ./check-and-extract.sh raw-domains.txt prospects.json
#
# Processes each domain: HTTP check, freelancer detection, email extraction, scoring.
# Output: JSON array of qualified prospects.

set -euo pipefail

DOMAINS_FILE="${1:?Usage: check-and-extract.sh <domains-file> <output-json>}"
OUTPUT_FILE="${2:?Usage: check-and-extract.sh <domains-file> <output-json>}"

if [ ! -f "$DOMAINS_FILE" ]; then
  echo "ERROR: Domains file not found: $DOMAINS_FILE"
  exit 1
fi

# Filter out known domains (already processed in previous runs)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
KNOWN_FILE="$PROJECT_ROOT/docs/prospects/known-domains.txt"

if [ -f "$KNOWN_FILE" ]; then
  BEFORE=$(wc -l < "$DOMAINS_FILE" | tr -d ' ')
  # Create temp file with only new domains
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

echo "Processing $TOTAL new domains..."

# Process all domains with python3
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

# --- Config ---
TIMEOUT = 10
ALLOWED_EMAIL_PREFIXES = [
    'info', 'hello', 'support', 'contact', 'admin', 'enquiries', 'team',
    'sales', 'help', 'office', 'general', 'mail', 'web', 'website',
    'hi', 'hey', 'business', 'reception', 'feedback', 'press', 'media',
    'partnerships', 'marketing', 'studio', 'digital', 'projects', 'work',
    'newbusiness', 'enquiry', 'me'
]
GENERIC_PROVIDERS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'protonmail.com', 'proton.me', 'zoho.com', 'yandex.com',
    'mail.com', 'live.com', 'msn.com', 'btinternet.com', 'sky.com',
    'virginmedia.com', 'talktalk.net'
]
FREELANCER_KEYWORDS = [
    'freelance', 'freelancer', 'independent', 'consultant', 'contractor',
    'available for hire', 'hire me', 'for hire', 'portfolio',
    'web developer', 'web designer', 'frontend developer', 'front-end',
    'full stack', 'fullstack', 'seo specialist', 'seo consultant',
    'seo expert', 'seo freelancer', 'wordpress developer',
    'shopify developer', 'react developer', 'ui/ux designer',
    'digital consultant', 'web consultant', 'solo developer',
    'personal website', 'my work', 'my projects', 'selected work',
    'case studies', 'client work', 'about me', 'what i do',
    'services i offer', 'let\\'s work together', 'get in touch',
    'self-employed', 'sole trader'
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
    'Astro': [r'astro'],
    'Eleventy': [r'eleventy', r'11ty'],
    'Hugo': [r'hugo'],
}
CONTACT_PATHS = ['/contact', '/contact-us', '/about', '/about-me', '/hire', '/hire-me', '/get-in-touch', '/work-with-me']
PARKED_SIGNALS = [
    'domain for sale', 'this domain is for sale', 'buy this domain',
    'parked domain', 'godaddy', 'sedo.com', 'afternic',
    'coming soon', 'under construction', 'future home of',
    'this page is not yet available', 'website coming soon',
    'apache2 default page', 'it works!', 'welcome to nginx',
    'default web site page', 'iis windows server',
    'index of /', 'directory listing'
]
# Signals that this is an agency, not a freelancer
AGENCY_SIGNALS = [
    'our team', 'meet the team', 'team of', 'our staff',
    'employees', 'we are a team', 'join our team',
    'careers', 'vacancies', 'job openings'
]

# --- HTML Parser ---
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
            elif 'github.com' in href:
                self.social['github'] = href
            elif 'codepen.io' in href:
                self.social['codepen'] = href
            elif 'dribbble.com' in href:
                self.social['dribbble'] = href
            elif 'behance.net' in href:
                self.social['behance'] = href
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
        'language': None,
        'is_parked': False,
        'is_freelancer': False,
        'is_agency': False,
        'freelancer_signals': [],
    }

    # Try HTTPS first
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
        return result

    # Parse HTML
    parser = MetaParser()
    try:
        parser.feed(html)
    except Exception:
        pass

    result['title'] = parser.title.strip()[:200] if parser.title.strip() else None
    result['meta_description'] = parser.meta_desc[:500] if parser.meta_desc else None
    result['page_count_estimate'] = min(parser.internal_links, 200)

    # Tech stack detection
    html_lower = html.lower()
    for tech, patterns in TECH_PATTERNS.items():
        for pat in patterns:
            if re.search(pat, html_lower):
                result['technology_stack'].append(tech)
                break

    # Parked domain detection
    combined = (result['title'] or '').lower() + ' ' + (result['meta_description'] or '').lower() + ' ' + html_lower[:5000]
    for signal in PARKED_SIGNALS:
        if signal in combined:
            result['is_parked'] = True
            break

    # Freelancer detection
    check_text = combined[:10000]
    for kw in FREELANCER_KEYWORDS:
        if kw in check_text:
            result['is_freelancer'] = True
            result['freelancer_signals'].append(kw)

    # Agency detection (to filter out agencies)
    agency_signal_count = 0
    for kw in AGENCY_SIGNALS:
        if kw in check_text:
            agency_signal_count += 1
    if agency_signal_count >= 2:
        result['is_agency'] = True

    return result, parser

def extract_emails(domain, has_ssl, homepage_parser):
    scheme = 'https' if has_ssl else 'http'
    all_emails = set(homepage_parser.emails)
    social = dict(homepage_parser.social)
    has_form = homepage_parser.has_form
    contact_page_url = None

    # Also scan body text of homepage for emails
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    found = re.findall(email_pattern, homepage_parser.body_text)
    for e in found:
        e = e.lower().strip('.')
        if '@' in e and '.' in e.split('@')[1]:
            all_emails.add(e)

    # Check contact pages
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

        # Regex emails from contact page body
        found = re.findall(email_pattern, cp.body_text)
        for e in found:
            e = e.lower().strip('.')
            if '@' in e and '.' in e.split('@')[1]:
                all_emails.add(e)

        time.sleep(0.5)
        break  # Only fetch one contact page

    # Filter emails
    qualified_emails = []
    for email in all_emails:
        local = email.split('@')[0].lower()
        email_domain = email.split('@')[1].lower()

        # Skip generic providers
        if email_domain in GENERIC_PROVIDERS:
            continue
        # Skip spam addresses
        if local in ['noreply', 'no-reply', 'postmaster', 'webmaster', 'abuse']:
            continue
        # Skip image/file extensions that regex might catch
        if email_domain.endswith(('.png', '.jpg', '.gif', '.svg', '.css', '.js')):
            continue

        is_generic = local in ALLOWED_EMAIL_PREFIXES
        confidence = 'high' if is_generic else 'low'

        # Only keep generic business emails
        if is_generic:
            qualified_emails.append({
                'email': email,
                'source': 'page_scrape',
                'confidence': confidence,
            })

    # Select primary email (prefer domain-matching)
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
    if check['page_count_estimate'] >= 3:
        score += 10
    if check['technology_stack']:
        score += 10
    if check['is_freelancer']:
        score += 15
    if len(check.get('freelancer_signals', [])) >= 2:
        score += 5
    if extract['primary_email']:
        score += 15
    if extract['has_contact_form']:
        score += 5
    if extract['social_links'].get('linkedin'):
        score += 5
    if extract['social_links'].get('github'):
        score += 5
    if len(extract['social_links']) >= 2:
        score += 5
    # Check for premium TLD
    tld = check['domain'].split('.')[-1]
    if tld in ['com', 'co.uk', 'org.uk', 'io', 'dev', 'design', 'me', 'co']:
        score += 5
    return min(score, 100)

# --- Main ---
domains_file = sys.argv[1]
output_file = sys.argv[2]

with open(domains_file) as f:
    domains = [line.strip() for line in f if line.strip()]

total = len(domains)
prospects = []
stats = {'total': total, 'live': 0, 'freelancers': 0, 'qualified': 0, 'parked': 0, 'dead': 0, 'no_contact': 0, 'not_freelancer': 0, 'is_agency': 0}

for i, domain in enumerate(domains):
    num = i + 1
    sys.stdout.write(f'\r  [{num}/{total}] Checking {domain}...' + ' ' * 20)
    sys.stdout.flush()

    try:
        result, parser = check_domain(domain)
    except Exception as e:
        stats['dead'] += 1
        continue

    if not result['is_live']:
        stats['dead'] += 1
        time.sleep(0.5)
        continue

    stats['live'] += 1

    if result['is_parked']:
        stats['parked'] += 1
        time.sleep(0.5)
        continue

    if result['is_agency']:
        stats['is_agency'] += 1
        time.sleep(0.5)
        continue

    if not result['is_freelancer']:
        stats['not_freelancer'] += 1
        time.sleep(0.5)
        continue

    stats['freelancers'] += 1

    # Extract emails
    try:
        extract = extract_emails(domain, result['has_ssl'], parser)
    except Exception:
        extract = {'emails': [], 'primary_email': None, 'social_links': {}, 'has_contact_form': False, 'contact_page_url': None}

    if not extract['primary_email'] and not extract['has_contact_form']:
        stats['no_contact'] += 1
        time.sleep(1)
        continue

    # Score
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
        'freelancer_signals': result['freelancer_signals'],
        'quality_score': quality,
        'contact_email': extract['primary_email'],
        'emails': extract['emails'],
        'social_links': extract['social_links'],
        'has_contact_form': extract['has_contact_form'],
        'contact_page_url': extract['contact_page_url'],
    })

    time.sleep(1)

# Write output
with open(output_file, 'w') as f:
    json.dump(prospects, f, indent=2)

print()
print()
print(f'Results: {stats[\"qualified\"]} qualified / {total} checked')
print(f'  Live: {stats[\"live\"]} | Freelancers: {stats[\"freelancers\"]} | Qualified: {stats[\"qualified\"]}')
print(f'  Filtered: {stats[\"dead\"]} dead, {stats[\"parked\"]} parked, {stats[\"not_freelancer\"]} not freelancer, {stats[\"is_agency\"]} agency, {stats[\"no_contact\"]} no contact')
print(f'Output: {output_file}')
" "$DOMAINS_FILE" "$OUTPUT_FILE"

# Append all processed domains (not just qualified) to known-domains.txt
if [ -f "$KNOWN_FILE" ]; then
  cat "$DOMAINS_FILE" >> "$KNOWN_FILE"
  # Deduplicate in place
  sort -u "$KNOWN_FILE" -o "$KNOWN_FILE"
  echo "Updated known-domains.txt ($(wc -l < "$KNOWN_FILE" | tr -d ' ') total)"
fi
