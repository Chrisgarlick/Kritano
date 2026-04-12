"use strict";
/**
 * Seed beta users and update passwords.
 * Run: npx tsx src/db/seed-beta-users.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const password_service_js_1 = require("../services/password.service.js");
dotenv_1.default.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // 1. Seed Owen's account with beta_access
        const owenPassword = await password_service_js_1.passwordService.hash('dhIJT*CZc03g');
        await client.query(`INSERT INTO users (email, password_hash, first_name, last_name, status, email_verified, email_verified_at, beta_access)
       VALUES ($1, $2, $3, $4, 'active', TRUE, NOW(), TRUE)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = $2,
         beta_access = TRUE,
         status = 'active',
         email_verified = TRUE`, ['owenlambert@hotmail.co.uk', owenPassword, 'Owen', 'Lambert']);
        // Create free subscription for Owen if not exists
        const owenUser = await client.query('SELECT id FROM users WHERE email = $1', ['owenlambert@hotmail.co.uk']);
        if (owenUser.rows[0]) {
            await client.query(`INSERT INTO subscriptions (user_id, tier, status)
         VALUES ($1, 'free', 'active')
         ON CONFLICT DO NOTHING`, [owenUser.rows[0].id]);
        }
        // 2. Update Chris's password
        const chrisPassword = await password_service_js_1.passwordService.hash('R49Setr#L7mP');
        await client.query(`UPDATE users SET password_hash = $1, password_changed_at = NOW() WHERE email = $2`, [chrisPassword, 'cgarlick94@gmail.com']);
        await client.query('COMMIT');
        console.log('Beta users seeded successfully:');
        console.log('  - owenlambert@hotmail.co.uk: created with beta_access');
        console.log('  - cgarlick94@gmail.com: password updated');
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Seed failed:', error);
        process.exit(1);
    }
    finally {
        client.release();
        await pool.end();
    }
}
seed();
//# sourceMappingURL=seed-beta-users.js.map