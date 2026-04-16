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

  // 2. Raw query with minimal dimensions
  const resp = await webmasters.searchanalytics.query({
    siteUrl: 'sc-domain:chrisgarlick.com',
    requestBody: {
      startDate: '2026-01-01',
      endDate: '2026-04-13',
      dimensions: ['date'],
      rowLimit: 10,
    },
  });
  console.log('API response:', JSON.stringify(resp.data, null, 2));

  await pool.end();
}

main().catch(e => { console.error(e.message); pool.end(); });
