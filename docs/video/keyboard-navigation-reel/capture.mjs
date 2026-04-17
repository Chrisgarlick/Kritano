import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const FILE = process.argv[2] || '6.html';
const FPS = 30;
const DURATION = 36; // seconds
const TOTAL_FRAMES = FPS * DURATION;
const FRAME_INTERVAL = 1000 / FPS;

const framesDir = resolve(__dirname, 'frames');
const inputPath = resolve(__dirname, FILE);
const outputName = FILE.replace('.html', '');
const outputPath = resolve(__dirname, `${outputName}.mp4`);

// Clean up and create frames dir
if (existsSync(framesDir)) rmSync(framesDir, { recursive: true });
mkdirSync(framesDir);

console.log(`Capturing ${TOTAL_FRAMES} frames from ${FILE} at ${FPS}fps...`);

const browser = await chromium.launch();
const page = await browser.newPage();

// Set viewport to match the scaled canvas (450x800)
await page.setViewportSize({ width: 450, height: 800 });

await page.goto(`file://${inputPath}`, { waitUntil: 'networkidle' });

// Wait for fonts to load
await page.waitForTimeout(2000);

// Pause all animations initially
await page.evaluate(() => {
  document.getAnimations({ subtree: true }).forEach(a => a.pause());
});

for (let i = 0; i < TOTAL_FRAMES; i++) {
  const time = i * FRAME_INTERVAL;

  // Set all animations to the correct time
  await page.evaluate((t) => {
    document.getAnimations({ subtree: true }).forEach(a => {
      a.currentTime = t;
    });
  }, time);

  const frameNum = String(i).padStart(5, '0');
  await page.screenshot({
    path: resolve(framesDir, `frame_${frameNum}.png`),
    clip: { x: 0, y: 0, width: 450, height: 800 }
  });

  if (i % 100 === 0) {
    console.log(`  Frame ${i}/${TOTAL_FRAMES} (${Math.round(i/TOTAL_FRAMES*100)}%)`);
  }
}

await browser.close();
console.log('Frames captured. Stitching MP4...');

// Stitch with ffmpeg - scale up to 1080x1920 for proper reel resolution
execSync(
  `ffmpeg -y -framerate ${FPS} -i "${framesDir}/frame_%05d.png" ` +
  `-vf "scale=1080:1920:flags=lanczos" ` +
  `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p ` +
  `"${outputPath}"`,
  { stdio: 'inherit' }
);

// Clean up frames
rmSync(framesDir, { recursive: true });
console.log(`Done! Output: ${outputPath}`);
