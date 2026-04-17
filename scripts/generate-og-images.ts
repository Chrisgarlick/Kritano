/**
 * Generate OG images for service pages.
 *
 * Uses Puppeteer to screenshot branded HTML templates at 1200x630.
 * Run: npx tsx scripts/generate-og-images.ts
 */

import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const OUTPUT_DIR = path.resolve(__dirname, '..', 'client', 'public', 'brand');

interface OgImageConfig {
  filename: string;
  icon: string;
  title: string;
  subtitle: string;
  accentColor: string;
  glowColor: string;
  pills: string[];
}

const SERVICES: OgImageConfig[] = [
  {
    filename: 'og-service-seo.png',
    icon: 'TrendingUp',
    title: 'SEO Auditing',
    subtitle: '100+ ranking factors checked in under 2 minutes',
    accentColor: '#8b5cf6',
    glowColor: 'rgba(139,92,246,0.2)',
    pills: ['Metadata', 'Structured Data', 'Core Web Vitals', 'Mobile', 'Crawlability'],
  },
  {
    filename: 'og-service-accessibility.png',
    icon: 'Accessibility',
    title: 'Accessibility Auditing',
    subtitle: 'WCAG 2.2 Level AA compliance checking',
    accentColor: '#10b981',
    glowColor: 'rgba(16,185,129,0.2)',
    pills: ['WCAG 2.2', 'Colour Contrast', 'Keyboard Nav', 'Screen Readers', 'ARIA'],
  },
  {
    filename: 'og-service-security.png',
    icon: 'Shield',
    title: 'Security Scanning',
    subtitle: 'Find vulnerabilities before attackers do',
    accentColor: '#ef4444',
    glowColor: 'rgba(239,68,68,0.2)',
    pills: ['Headers', 'HTTPS', 'CSP', 'Cookies', 'Exposed Files'],
  },
  {
    filename: 'og-service-performance.png',
    icon: 'Zap',
    title: 'Performance Analysis',
    subtitle: 'Core Web Vitals and loading speed optimisation',
    accentColor: '#0ea5e9',
    glowColor: 'rgba(14,165,233,0.2)',
    pills: ['LCP', 'INP', 'CLS', 'Resource Loading', 'Caching'],
  },
];

const SVG_ICONS: Record<string, string> = {
  TrendingUp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  Accessibility: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/></svg>`,
  Shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`,
  Zap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>`,
};

function generateHtml(config: OgImageConfig): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px;
    height: 630px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #3730a3 70%, #4338ca 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    overflow: hidden;
    position: relative;
  }
  body::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  body::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, ${config.glowColor} 0%, transparent 70%);
    border-radius: 50%;
  }
  .content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }
  .icon-wrapper {
    width: 80px;
    height: 80px;
    border-radius: 20px;
    background: ${config.accentColor};
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }
  .icon-wrapper svg {
    width: 40px;
    height: 40px;
  }
  .brand-line {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .kritano-text {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 22px;
    color: rgba(255,255,255,0.5);
    letter-spacing: -0.5px;
  }
  .divider {
    width: 1px;
    height: 20px;
    background: rgba(255,255,255,0.2);
  }
  .service-label {
    font-size: 14px;
    color: ${config.accentColor};
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .title {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 56px;
    color: white;
    letter-spacing: -1px;
    font-weight: normal;
    text-align: center;
  }
  .subtitle {
    font-size: 20px;
    color: rgba(255,255,255,0.6);
    letter-spacing: 0.3px;
    font-weight: 400;
    text-align: center;
    max-width: 600px;
  }
  .pills {
    display: flex;
    gap: 10px;
    margin-top: 4px;
  }
  .pill {
    padding: 5px 14px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255,255,255,0.85);
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.15);
    letter-spacing: 0.3px;
  }
  .url {
    position: absolute;
    bottom: 28px;
    font-size: 14px;
    color: rgba(255,255,255,0.3);
    letter-spacing: 1px;
  }
</style>
</head>
<body>
  <div class="content">
    <div class="icon-wrapper">
      ${SVG_ICONS[config.icon]}
    </div>
    <div class="brand-line">
      <span class="kritano-text">Kritano</span>
      <span class="divider"></span>
      <span class="service-label">Service</span>
    </div>
    <div class="title">${config.title}</div>
    <div class="subtitle">${config.subtitle}</div>
    <div class="pills">
      ${config.pills.map(p => `<span class="pill">${p}</span>`).join('\n      ')}
    </div>
  </div>
  <div class="url">kritano.com</div>
</body>
</html>`;
}

async function main() {
  console.log('Generating OG images...');

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });

  for (const config of SERVICES) {
    const html = generateHtml(config);
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const outputPath = path.join(OUTPUT_DIR, config.filename);
    await page.screenshot({ path: outputPath, type: 'png' });
    console.log(`  Created: ${outputPath}`);
  }

  await browser.close();
  console.log('Done! Generated', SERVICES.length, 'OG images.');
}

main().catch(console.error);
