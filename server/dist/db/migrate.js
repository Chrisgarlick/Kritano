"use strict";
/**
 * Database Migration Runner
 *
 * Tracks and runs pending migrations using a migrations table.
 * Usage:
 *   npm run migrate          - Run pending migrations
 *   npm run migrate:refresh  - Drop all tables and run all migrations
 *   npm run migrate:status   - Show migration status
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Migrations directory relative to project root
const MIGRATIONS_DIR = path_1.default.join(process.cwd(), 'src', 'db', 'migrations');
async function createMigrationsTable(pool) {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}
async function getExecutedMigrations(pool) {
    const result = await pool.query('SELECT name FROM _migrations ORDER BY id');
    return new Set(result.rows.map(row => row.name));
}
function getMigrationFiles() {
    const files = fs_1.default.readdirSync(MIGRATIONS_DIR)
        .filter(f => f.endsWith('.sql'))
        .sort((a, b) => {
        // Sort by numeric prefix (e.g., 001_, 002_, etc.)
        const numA = parseInt(a.split('_')[0], 10);
        const numB = parseInt(b.split('_')[0], 10);
        return numA - numB;
    });
    return files;
}
async function runMigration(pool, filename) {
    const filepath = path_1.default.join(MIGRATIONS_DIR, filename);
    const sql = fs_1.default.readFileSync(filepath, 'utf-8');
    // CONCURRENTLY operations cannot run inside a transaction block
    const needsNoTransaction = /\bCONCURRENTLY\b/i.test(sql);
    const client = await pool.connect();
    try {
        if (needsNoTransaction) {
            await client.query(sql);
            await client.query('INSERT INTO _migrations (name) VALUES ($1)', [filename]);
        }
        else {
            await client.query('BEGIN');
            await client.query(sql);
            await client.query('INSERT INTO _migrations (name) VALUES ($1)', [filename]);
            await client.query('COMMIT');
        }
        console.log(`  ✓ ${filename}`);
    }
    catch (error) {
        if (!needsNoTransaction) {
            await client.query('ROLLBACK');
        }
        throw error;
    }
    finally {
        client.release();
    }
}
async function migrate(pool) {
    console.log('🔄 Running migrations...\n');
    await createMigrationsTable(pool);
    const executed = await getExecutedMigrations(pool);
    const files = getMigrationFiles();
    const pending = files.filter(f => !executed.has(f));
    if (pending.length === 0) {
        console.log('✅ No pending migrations\n');
        return;
    }
    console.log(`Found ${pending.length} pending migration(s):\n`);
    for (const file of pending) {
        await runMigration(pool, file);
    }
    console.log(`\n✅ Completed ${pending.length} migration(s)\n`);
}
async function refresh(pool) {
    console.log('🗑️  Dropping all tables...\n');
    // Get all tables except system tables
    const tablesResult = await pool.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
  `);
    if (tablesResult.rows.length > 0) {
        // Drop all tables with CASCADE
        const tableNames = tablesResult.rows.map(r => `"${r.tablename}"`).join(', ');
        await pool.query(`DROP TABLE IF EXISTS ${tableNames} CASCADE`);
        console.log(`  Dropped ${tablesResult.rows.length} table(s)\n`);
    }
    else {
        console.log('  No tables to drop\n');
    }
    // Drop any remaining types (enums, etc.)
    const typesResult = await pool.query(`
    SELECT typname FROM pg_type
    WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND typtype = 'e'
  `);
    for (const row of typesResult.rows) {
        await pool.query(`DROP TYPE IF EXISTS "${row.typname}" CASCADE`);
    }
    // Now run all migrations
    await migrate(pool);
}
async function status(pool) {
    console.log('📊 Migration Status\n');
    try {
        await createMigrationsTable(pool);
    }
    catch {
        // Table might not exist yet
    }
    const executed = await getExecutedMigrations(pool);
    const files = getMigrationFiles();
    console.log('Migration                                      Status');
    console.log('─'.repeat(60));
    for (const file of files) {
        const status = executed.has(file) ? '✓ Executed' : '○ Pending';
        const padding = 45 - file.length;
        console.log(`${file}${' '.repeat(Math.max(1, padding))}${status}`);
    }
    const pendingCount = files.filter(f => !executed.has(f)).length;
    console.log('─'.repeat(60));
    console.log(`\nTotal: ${files.length} migrations, ${files.length - pendingCount} executed, ${pendingCount} pending\n`);
}
async function adopt(pool) {
    console.log('📝 Adopting existing migrations...\n');
    console.log('This marks all migrations as executed WITHOUT running them.');
    console.log('Use this when the database was set up manually.\n');
    await createMigrationsTable(pool);
    const executed = await getExecutedMigrations(pool);
    const files = getMigrationFiles();
    const pending = files.filter(f => !executed.has(f));
    if (pending.length === 0) {
        console.log('✅ All migrations already adopted\n');
        return;
    }
    for (const file of pending) {
        await pool.query('INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT DO NOTHING', [file]);
        console.log(`  ✓ ${file}`);
    }
    console.log(`\n✅ Adopted ${pending.length} migration(s)\n`);
}
async function main() {
    const command = process.argv[2] || 'migrate';
    const pool = new pg_1.Pool({
        connectionString: process.env.DATABASE_URL,
    });
    try {
        switch (command) {
            case 'migrate':
                await migrate(pool);
                break;
            case 'refresh':
                const readline = await import('readline');
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout,
                });
                // Check if running in non-interactive mode (CI/scripts)
                if (!process.stdin.isTTY) {
                    console.log('⚠️  Running in non-interactive mode, proceeding with refresh...');
                    await refresh(pool);
                }
                else {
                    await new Promise((resolve) => {
                        rl.question('⚠️  This will DROP ALL TABLES. Are you sure? (yes/no): ', async (answer) => {
                            rl.close();
                            if (answer.toLowerCase() === 'yes') {
                                await refresh(pool);
                            }
                            else {
                                console.log('Cancelled.\n');
                            }
                            resolve();
                        });
                    });
                }
                break;
            case 'status':
                await status(pool);
                break;
            case 'adopt':
                await adopt(pool);
                break;
            default:
                console.log('Unknown command. Use: migrate, refresh, status, or adopt');
                process.exit(1);
        }
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
    finally {
        await pool.end();
    }
}
main();
//# sourceMappingURL=migrate.js.map