/**
 * Cold Prospect Pipeline CLI
 *
 * Processes NRD feeds entirely in-memory. Qualified prospects
 * (live site + contact email found) are written to JSON files
 * in server/prospect-output/.
 *
 * No database or Docker required.
 *
 * Usage:
 *   npm run prospects                     — full pipeline (yesterday's feed)
 *   npm run prospects -- download         — download yesterday's NRD feed only
 *   npm run prospects -- download 2026-03-12 — download a specific date's NRD feed
 *   npm run prospects -- nrd file.txt     — run pipeline from a .txt file in prospect-output/
 *   npm run prospects -- import file.csv  — import CSV, run pipeline, output JSON
 *   npm run prospects -- list             — list output files
 *   npm run prospects -- settings         — view current pipeline settings
 *   npm run prospects -- set key value    — update a setting
 *   npm run prospects -- reset            — clear checkpoints and start fresh
 */
export {};
//# sourceMappingURL=cold-prospect-cli.d.ts.map