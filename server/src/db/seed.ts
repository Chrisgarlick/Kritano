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

const SEED_EMAIL = process.env.SEED_EMAIL || 'admin@pagepulser.com';
const SEED_PASSWORD = process.env.SEED_PASSWORD || 'Password123!';
const SEED_FIRST_NAME = process.env.SEED_FIRST_NAME || 'Admin';
const SEED_LAST_NAME = process.env.SEED_LAST_NAME || 'User';

async function seed(): Promise<void> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Running database seeder...\n');

    // Seed admin user
    console.log(`  Creating admin user: ${SEED_EMAIL}`);
    const passwordHash = await argon2.hash(SEED_PASSWORD, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, email_verified, status, role)
       VALUES ($1, $2, $3, $4, true, 'active', 'admin')
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         status = 'active',
         email_verified = true
       RETURNING id`,
      [SEED_EMAIL, passwordHash, SEED_FIRST_NAME, SEED_LAST_NAME]
    );
    console.log(`  Admin user created (id: ${userResult.rows[0].id})`);

    console.log('\nSeeding complete!');
    console.log(`\n  Admin login: ${SEED_EMAIL} / ${SEED_PASSWORD}\n`);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
