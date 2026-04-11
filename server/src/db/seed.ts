/**
 * Database Seeder
 *
 * Creates seed data for local development after a fresh migration.
 * Usage:
 *   npm run seed             - Run seeder
 *   npm run migrate:seed     - Run migrations + seeder
 */

import { Pool } from 'pg';
import argon2 from 'argon2';
import dotenv from 'dotenv';

dotenv.config();

// Seed configuration
const SEED_EMAIL = 'cgarlick94@gmail.com';
const SEED_PASSWORD = 'R49Setr#L7mP';
const SEED_FIRST_NAME = 'Chris';
const SEED_LAST_NAME = 'Garlick';

async function seed(): Promise<void> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🌱 Running database seeder...\n');

    // 1. Seed admin user
    console.log(`  Creating admin user: ${SEED_EMAIL}`);
    const passwordHash = await argon2.hash(SEED_PASSWORD, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, email_verified, status, role, is_super_admin)
       VALUES ($1, $2, $3, $4, true, 'active', 'admin', true)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         status = 'active',
         email_verified = true,
         is_super_admin = true
       RETURNING id`,
      [SEED_EMAIL, passwordHash, SEED_FIRST_NAME, SEED_LAST_NAME]
    );
    const userId = userResult.rows[0].id;
    console.log(`  ✓ Admin user created (id: ${userId})`);

    // 2. Seed organization
    const orgSlug = `user-${userId.replace(/-/g, '')}`;
    await pool.query(
      `INSERT INTO organizations (name, slug, owner_id)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [`${SEED_FIRST_NAME}'s Workspace`, orgSlug, userId]
    );
    console.log(`  ✓ Organization created`);

    // 3. Seed free-tier subscription (if subscriptions table exists)
    try {
      await pool.query(
        `INSERT INTO subscriptions (user_id, tier, status)
         VALUES ($1, 'free', 'active')
         ON CONFLICT DO NOTHING`,
        [userId]
      );
      console.log(`  ✓ Free subscription created`);
    } catch {
      // subscriptions table might have different schema, skip
    }

    // 4. Seed beta user (Owen)
    const owenPassword = 'dhIJT*CZc03g';
    const owenHash = await argon2.hash(owenPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const owenResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, email_verified, status, role, beta_access)
       VALUES ('owenlambert@hotmail.co.uk', $1, 'Owen', 'Lambert', true, 'active', 'user', true)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         status = 'active',
         email_verified = true,
         beta_access = true
       RETURNING id`,
      [owenHash]
    );
    const owenId = owenResult.rows[0].id;
    console.log(`  ✓ Beta user created (id: ${owenId})`);

    // Create org + subscription for Owen
    const owenSlug = `user-${owenId.replace(/-/g, '')}`;
    await pool.query(
      `INSERT INTO organizations (name, slug, owner_id)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      ["Owen's Workspace", owenSlug, owenId]
    );
    await pool.query(
      `INSERT INTO subscriptions (user_id, tier, status)
       VALUES ($1, 'free', 'active')
       ON CONFLICT DO NOTHING`,
      [owenId]
    );

    // 5. Initialize lead scores for seeded users
    await pool.query(
      `UPDATE users SET lead_score = 5, lead_status = 'new', lead_score_updated_at = NOW()
       WHERE lead_score = 0 OR lead_score IS NULL`
    );
    console.log(`  ✓ Lead scores initialized`);

    console.log('\n✅ Seeding complete!');
    console.log(`\n  Admin login: ${SEED_EMAIL} / ${SEED_PASSWORD}`);
    console.log(`  Beta login:  owenlambert@hotmail.co.uk / ${owenPassword}\n`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
