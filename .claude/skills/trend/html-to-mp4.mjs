#!/usr/bin/env node
/**
 * html-to-mp4.mjs - Convert an animated HTML file to MP4 using Playwright + ffmpeg
 *
 * Usage: node html-to-mp4.mjs <input.html> [output.mp4] [duration_seconds] [fps]
 * Example: node html-to-mp4.mjs docs/trend/2026-04-07/video.html docs/trend/2026-04-07/video.mp4 28 30
 *
 * Instead of capturing in real-time (which drifts), this script:
 * 1. Pauses all CSS animations on load
 * 2. Steps through frame-by-frame, setting each animation's currentTime precisely
 * 3. Screenshots each frame
 * 4. Stitches frames into MP4 with ffmpeg
 *
 * This guarantees the output matches the CSS animation timing exactly.
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const inputFile = process.argv[2];
const outputFile = process.argv[3] || inputFile.replace('.html', '.mp4');
const duration = parseInt(process.argv[4] || '28', 10);
const fps = parseInt(process.argv[5] || '30', 10);

if (!inputFile) {
  console.error('Usage: node html-to-mp4.mjs <input.html> [output.mp4] [duration_seconds] [fps]');
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`ERROR: File not found: ${inputFile}`);
  process.exit(1);
}

const absolutePath = path.resolve(inputFile);
const fileUrl = `file://${absolutePath}`;
const totalFrames = duration * fps;
const frameDurationMs = 1000 / fps;

// Create temp directory for frames
const tmpDir = path.join(path.dirname(absolutePath), '.frames-tmp');
if (fs.existsSync(tmpDir)) {
  // Clean any leftover frames
  for (const f of fs.readdirSync(tmpDir)) fs.unlinkSync(path.join(tmpDir, f));
} else {
  fs.mkdirSync(tmpDir, { recursive: true });
}

console.log(`Recording: ${inputFile}`);
console.log(`Output: ${outputFile}`);
console.log(`Duration: ${duration}s at ${fps}fps (${totalFrames} frames)`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Set viewport to 1080x1920 (portrait Reels format)
await page.setViewportSize({ width: 1080, height: 1920 });

await page.goto(fileUrl, { waitUntil: 'networkidle' });

// Wait for fonts to load
await page.waitForTimeout(3000);

// Pause all animations and get their count
const animCount = await page.evaluate(() => {
  const animations = document.getAnimations();
  animations.forEach(a => a.pause());
  return animations.length;
});

console.log(`Found ${animCount} animations. Capturing frames...`);

for (let i = 0; i < totalFrames; i++) {
  const timeMs = i * frameDurationMs;

  // Set all animations to the exact time for this frame
  await page.evaluate((t) => {
    document.getAnimations().forEach(a => {
      a.currentTime = t;
    });
  }, timeMs);

  // Small delay to let the browser render the frame
  await page.waitForTimeout(5);

  const frameNum = String(i).padStart(6, '0');
  await page.screenshot({
    path: path.join(tmpDir, `frame-${frameNum}.png`),
    type: 'png',
  });

  // Progress update every second of video
  if ((i + 1) % fps === 0) {
    const sec = (i + 1) / fps;
    console.log(`  ${sec}s / ${duration}s`);
  }
}

await browser.close();
console.log('Frames captured. Stitching with ffmpeg...');

// Use ffmpeg to stitch frames into MP4
const ffmpegCmd = `ffmpeg -y -framerate ${fps} -i "${tmpDir}/frame-%06d.png" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 18 "${path.resolve(outputFile)}"`;

try {
  execSync(ffmpegCmd, { stdio: 'pipe' });
  console.log(`Done! Saved to: ${outputFile}`);
} catch (err) {
  console.error('ffmpeg failed:', err.stderr?.toString() || err.message);
  process.exit(1);
} finally {
  // Clean up temp frames
  const files = fs.readdirSync(tmpDir);
  for (const f of files) {
    fs.unlinkSync(path.join(tmpDir, f));
  }
  fs.rmdirSync(tmpDir);
  console.log('Cleaned up temp frames.');
}
