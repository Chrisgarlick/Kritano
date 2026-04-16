import 'dotenv/config';
import { google } from 'googleapis';
import pg from 'pg';
import { decryptToken } from './src/utils/crypto.utils.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const r = await pool.query(
    `SELECT id, gsc_property, access_token_encrypted, refresh_token_encrypted
     FROM gsc_connections WHERE gsc_property LIKE '%chrisgarlick%'`
  );
  const conn = r.rows[0];
  if (!conn) { console.log('No connection found'); return; }

  const accessToken = decryptToken(conn.access_token_encrypted);
  const refreshToken = decryptToken(conn.refresh_token_encrypted);

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

  const webmasters = google.webmasters({ version: 'v3', auth: client });

  // 1. List all sites to confirm access
  const sites = await webmasters.sites.list();
  console.log('Accessible sites:', sites.data.siteEntry?.map(s => s.siteUrl));

  // 2. Query with all 5 dimensions (what syncQueryData uses)
  const resp5 = await webmasters.searchanalytics.query({
    siteUrl: 'sc-domain:chrisgarlick.com',
    requestBody: {
      startDate: '2026-01-01',
      endDate: '2026-04-13',
      dimensions: ['query', 'page', 'device', 'country', 'date'],
      rowLimit: 10,
    },
  });
  console.log('5-dimension response rows:', resp5.data.rows?.length ?? 0);
  if (resp5.data.rows?.length) {
    console.log('Sample:', JSON.stringify(resp5.data.rows[0], null, 2));
  }

  // 3. Query with just query+date (lighter)
  const resp2 = await webmasters.searchanalytics.query({
    siteUrl: 'sc-domain:chrisgarlick.com',
    requestBody: {
      startDate: '2026-01-01',
      endDate: '2026-04-13',
      dimensions: ['query', 'date'],
      rowLimit: 10,
    },
  });
  console.log('query+date response rows:', resp2.data.rows?.length ?? 0);
  if (resp2.data.rows?.length) {
    console.log('Sample:', JSON.stringify(resp2.data.rows.slice(0, 3), null, 2));
  }

  // 4. No dimensions - just totals
  const respTotal = await webmasters.searchanalytics.query({
    siteUrl: 'sc-domain:chrisgarlick.com',
    requestBody: {
      startDate: '2026-01-01',
      endDate: '2026-04-13',
    },
  });
  console.log('Totals (no dimensions):', JSON.stringify(respTotal.data, null, 2));

  await pool.end();
}

main().catch(e => { console.error(e.message); pool.end(); });
