/**
 * One-time setup: create the Kritano client profile on typeset.chrisgarlick.com.
 *
 * Run once per environment after setting TYPESET_BASE_URL and TYPESET_API_KEY:
 *   npx tsx scripts/setup-typeset-profile.ts
 *
 * The profile is upserted (POST /api/clients), so re-running is safe and
 * useful when you tweak the branding values below.
 *
 * See /docs/typeset_integration.md for the full client profile schema.
 */

import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.TYPESET_BASE_URL ?? 'https://typeset.chrisgarlick.com';
const API_KEY = process.env.TYPESET_API_KEY;
const CLIENT_SLUG = process.env.TYPESET_CLIENT_SLUG ?? 'kritano';

if (!API_KEY) {
  console.error('❌ TYPESET_API_KEY is not set in your environment.');
  console.error('   Add it to server/.env and try again.');
  process.exit(1);
}

// Branding values aligned with /docs/BRAND_GUIDELINES.md.
// Typeset's defaults to Helvetica for fonts; we leave fonts unset so typeset
// can fall back gracefully without us shipping font files.
const profile = {
  slug: CLIENT_SLUG,
  name: 'Kritano',

  // Indigo-600 primary, amber-500 accent.
  colour_primary: '#4F46E5',
  colour_secondary: '#1E1B4B',
  colour_accent: '#F59E0B',
  colour_text: '#0F172A',
  colour_background: '#FFFFFF',
  colour_table_header: '#EEF2FF',
  colour_table_border: '#E2E8F0',
  colour_callout_bg: '#F8FAFC',

  page_size: 'A4',
  margin_top: 25.4,
  margin_bottom: 25.4,
  margin_left: 25.4,
  margin_right: 25.4,

  // Per /docs/integration-guide.md: cover_template 'minimal' does NOT fill the
  // background edge-to-edge — it produces a frame-and-rules look instead. Use
  // 'bold' (or 'full' / 'dark') for the dramatic indigo cover we want.
  cover_enabled: true,
  cover_template: 'bold',
  cover_bg_colour: '#4F46E5',
  cover_text_colour: '#FFFFFF',

  header_enabled: true,
  header_template: 'logo-left',
  header_border: true,

  footer_enabled: true,
  footer_template: 'page-numbers',
  footer_border: true,
};

async function main(): Promise<void> {
  console.log(`→ Upserting typeset client profile "${CLIENT_SLUG}" at ${BASE_URL}`);

  const res = await fetch(`${BASE_URL.replace(/\/$/, '')}/api/clients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(profile),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`❌ Typeset returned ${res.status}: ${text}`);
    process.exit(2);
  }

  const body = await res.json().catch(() => null);
  console.log(`✅ Profile "${CLIENT_SLUG}" is ready.`);
  if (body) console.log(JSON.stringify(body, null, 2));
}

main().catch((err) => {
  console.error('❌ Unhandled error:', err);
  process.exit(3);
});
