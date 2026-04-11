import { pool } from '../db/index.js';
import { passwordService } from './password.service.js';
import { tokenService } from './token.service.js';
import { userService } from './user.service.js';
import { sendTemplate } from './email-template.service.js';
import archiver from 'archiver';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';

const EXPORT_EXPIRY_HOURS = 24;
const DELETION_GRACE_DAYS = 30;

/**
 * Verify a user's password for sensitive operations.
 */
async function verifyPassword(userId: string, password: string): Promise<boolean> {
  const result = await pool.query<{ password_hash: string | null }>(
    `SELECT password_hash FROM users WHERE id = $1`,
    [userId]
  );
  const hash = result.rows[0]?.password_hash;
  if (!hash) return false;
  return passwordService.verify(password, hash);
}

/**
 * Request a data export for a user.
 */
async function requestExport(userId: string): Promise<string> {
  // Check for recent pending/processing exports
  const existing = await pool.query(
    `SELECT id FROM account_data_exports
     WHERE user_id = $1 AND status IN ('pending', 'processing')
     AND created_at > NOW() - INTERVAL '1 hour'
     LIMIT 1`,
    [userId]
  );
  if (existing.rows.length > 0) {
    throw Object.assign(new Error('An export is already in progress. Please wait for it to complete.'), { statusCode: 409 });
  }

  const result = await pool.query<{ id: string }>(
    `INSERT INTO account_data_exports (user_id) VALUES ($1) RETURNING id`,
    [userId]
  );
  return result.rows[0].id;
}

/**
 * Gather all user data for export.
 */
async function gatherUserData(userId: string): Promise<Record<string, unknown>> {
  const [
    userData,
    sites,
    auditJobs,
    auditSchedules,
    apiKeys,
    emailPrefs,
    consents,
    oauthProviders,
    bugReports,
    featureRequests,
    emailSends,
    subscriptions,
    organizations,
  ] = await Promise.all([
    pool.query(
      `SELECT id, email, first_name, last_name, company_name, status, role, email_verified, created_at, last_login_at
       FROM users WHERE id = $1`,
      [userId]
    ),
    pool.query(
      `SELECT id, domain, name, verified, verification_method, created_at
       FROM sites WHERE owner_id = $1 ORDER BY created_at`,
      [userId]
    ),
    pool.query(
      `SELECT id, target_url, target_domain, status, seo_score, accessibility_score,
              security_score, performance_score, content_score, structured_data_score,
              total_issues, critical_issues, pages_found, pages_audited, created_at, completed_at
       FROM audit_jobs WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    ),
    pool.query(
      `SELECT id, site_id, name, cron_expression, frequency, enabled, created_at
       FROM audit_schedules WHERE user_id = $1 ORDER BY created_at`,
      [userId]
    ),
    pool.query(
      `SELECT id, name, key_prefix, scopes, is_active, created_at, last_used_at, expires_at
       FROM api_keys WHERE user_id = $1 ORDER BY created_at`,
      [userId]
    ),
    pool.query(
      `SELECT * FROM email_preferences WHERE user_id = $1`,
      [userId]
    ),
    pool.query(
      `SELECT id, consent_type, consent_version, accepted_at, ip_address, created_at
       FROM user_consents WHERE user_id = $1 ORDER BY created_at`,
      [userId]
    ),
    pool.query(
      `SELECT provider, email, name, linked_at
       FROM user_oauth_providers WHERE user_id = $1`,
      [userId]
    ).catch(() => ({ rows: [] })),
    pool.query(
      `SELECT id, title, description, status, created_at
       FROM bug_reports WHERE user_id = $1 ORDER BY created_at`,
      [userId]
    ),
    pool.query(
      `SELECT id, title, description, status, created_at
       FROM feature_requests WHERE user_id = $1 ORDER BY created_at`,
      [userId]
    ),
    pool.query(
      `SELECT id, template_id, subject, status, sent_at, opened_at
       FROM email_sends WHERE user_id = $1 ORDER BY created_at DESC LIMIT 500`,
      [userId]
    ),
    pool.query(
      `SELECT id, tier, status, trial_start, trial_end, created_at
       FROM subscriptions WHERE user_id = $1 ORDER BY created_at`,
      [userId]
    ),
    pool.query(
      `SELECT o.id, o.name, o.slug, om.role as member_role, o.created_at
       FROM organizations o
       JOIN organization_members om ON om.organization_id = o.id
       WHERE om.user_id = $1 ORDER BY o.created_at`,
      [userId]
    ),
  ]);

  return {
    account: userData.rows[0] || null,
    sites: sites.rows,
    audit_jobs: auditJobs.rows,
    audit_schedules: auditSchedules.rows,
    api_keys: apiKeys.rows,
    email_preferences: emailPrefs.rows,
    consents: consents.rows,
    oauth_providers: oauthProviders.rows,
    bug_reports: bugReports.rows,
    feature_requests: featureRequests.rows,
    email_sends: emailSends.rows,
    subscriptions: subscriptions.rows,
    organizations: organizations.rows,
    exported_at: new Date().toISOString(),
  };
}

/**
 * Process a pending export: gather data, create ZIP, update record.
 */
async function processExport(exportId: string): Promise<void> {
  // Mark as processing
  const exportRow = await pool.query<{ user_id: string; status: string }>(
    `UPDATE account_data_exports SET status = 'processing' WHERE id = $1 AND status = 'pending' RETURNING user_id, status`,
    [exportId]
  );
  if (exportRow.rows.length === 0) return;

  const userId = exportRow.rows[0].user_id;

  try {
    const data = await gatherUserData(userId);
    const exportDir = path.join(os.tmpdir(), 'kritano-exports');
    fs.mkdirSync(exportDir, { recursive: true });

    const filePath = path.join(exportDir, `${exportId}.zip`);
    const output = fs.createWriteStream(filePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    await new Promise<void>((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);

      // Add each data category as a separate JSON file
      for (const [key, value] of Object.entries(data)) {
        if (key === 'exported_at') continue;
        archive.append(JSON.stringify(value, null, 2), { name: `${key}.json` });
      }

      // Add a manifest
      archive.append(
        JSON.stringify({
          export_id: exportId,
          exported_at: data.exported_at,
          format: 'JSON',
          description: 'Your complete Kritano data export',
        }, null, 2),
        { name: 'manifest.json' }
      );

      archive.finalize();
    });

    const stats = fs.statSync(filePath);
    const expiresAt = new Date(Date.now() + EXPORT_EXPIRY_HOURS * 60 * 60 * 1000);

    await pool.query(
      `UPDATE account_data_exports
       SET status = 'completed', file_path = $1, file_size_bytes = $2, completed_at = NOW(), expires_at = $3
       WHERE id = $4`,
      [filePath, stats.size, expiresAt, exportId]
    );

    // Send notification email
    const user = await userService.findById(userId);
    if (user) {
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      await sendTemplate({
        templateSlug: 'data_export_ready',
        to: { userId, email: user.email, firstName: user.first_name },
        variables: {
          firstName: user.first_name,
          settingsUrl: `${appUrl}/app/settings/profile`,
        },
      }).catch(err => console.error('Failed to send export ready email:', err));
    }
  } catch (error: any) {
    await pool.query(
      `UPDATE account_data_exports SET status = 'failed', error_message = $1 WHERE id = $2`,
      [error.message?.slice(0, 500), exportId]
    );
    throw error;
  }
}

/**
 * Get export download info. Verifies ownership and expiry.
 */
async function getExportDownload(userId: string, exportId: string): Promise<{ filePath: string; fileName: string }> {
  const result = await pool.query<{ file_path: string; expires_at: Date }>(
    `SELECT file_path, expires_at FROM account_data_exports
     WHERE id = $1 AND user_id = $2 AND status = 'completed'`,
    [exportId, userId]
  );
  const row = result.rows[0];
  if (!row) {
    throw Object.assign(new Error('Export not found'), { statusCode: 404 });
  }
  if (new Date(row.expires_at) < new Date()) {
    throw Object.assign(new Error('Export has expired. Please request a new one.'), { statusCode: 410 });
  }
  if (!fs.existsSync(row.file_path)) {
    throw Object.assign(new Error('Export file not found. Please request a new one.'), { statusCode: 404 });
  }
  return { filePath: row.file_path, fileName: `kritano-data-export.zip` };
}

/**
 * Get the latest export status for a user.
 */
async function getLatestExport(userId: string): Promise<{
  id: string;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
  expiresAt: Date | null;
  fileSizeBytes: number | null;
} | null> {
  const result = await pool.query(
    `SELECT id, status, created_at, completed_at, expires_at, file_size_bytes
     FROM account_data_exports
     WHERE user_id = $1
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    expiresAt: row.expires_at,
    fileSizeBytes: row.file_size_bytes,
  };
}

/**
 * Request account deletion with 30-day grace period.
 */
async function requestAccountDeletion(userId: string): Promise<{ scheduledFor: Date }> {
  const user = await userService.findById(userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }
  if (user.deletion_requested_at) {
    throw Object.assign(new Error('Account deletion is already scheduled.'), { statusCode: 409 });
  }

  const scheduledFor = new Date(Date.now() + DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000);

  await pool.query(
    `UPDATE users
     SET deletion_requested_at = NOW(), deletion_scheduled_for = $1, status = 'pending_deletion'
     WHERE id = $2`,
    [scheduledFor, userId]
  );

  // Revoke all sessions
  await tokenService.revokeAllUserTokens(userId, 'account_deletion_requested');

  // Send confirmation email
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  await sendTemplate({
    templateSlug: 'deletion_requested',
    to: { userId, email: user.email, firstName: user.first_name },
    variables: {
      firstName: user.first_name,
      deletionDate: scheduledFor.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      settingsUrl: `${appUrl}/app/settings/profile`,
    },
  }).catch(err => console.error('Failed to send deletion requested email:', err));

  return { scheduledFor };
}

/**
 * Cancel a pending account deletion.
 */
async function cancelAccountDeletion(userId: string): Promise<void> {
  const user = await userService.findById(userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }
  if (!user.deletion_requested_at) {
    throw Object.assign(new Error('No pending deletion to cancel.'), { statusCode: 400 });
  }

  await pool.query(
    `UPDATE users
     SET deletion_requested_at = NULL, deletion_scheduled_for = NULL, status = 'active'
     WHERE id = $1`,
    [userId]
  );

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  await sendTemplate({
    templateSlug: 'deletion_cancelled',
    to: { userId, email: user.email, firstName: user.first_name },
    variables: {
      firstName: user.first_name,
      dashboardUrl: `${appUrl}/app/dashboard`,
    },
  }).catch(err => console.error('Failed to send deletion cancelled email:', err));
}

/**
 * Execute account deletion (called by worker after grace period).
 */
async function executeAccountDeletion(userId: string): Promise<void> {
  const user = await userService.findById(userId);
  if (!user) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Archive consent records (hash user_id for privacy)
    const userIdHash = crypto.createHash('sha256').update(userId).digest('hex');
    await client.query(
      `INSERT INTO archived_consents (original_user_id_hash, consent_type, consent_version, accepted_at, ip_address)
       SELECT $1, consent_type, consent_version, created_at, ip_address::inet
       FROM user_consents WHERE user_id = $2`,
      [userIdHash, userId]
    );

    // 2. NULL out user references in tables without FK CASCADE
    await client.query(`UPDATE blog_posts SET author_id = NULL WHERE author_id = $1`, [userId]);
    await client.query(`UPDATE blog_post_revisions SET changed_by = NULL WHERE changed_by = $1`, [userId]);
    await client.query(`UPDATE blog_media SET uploaded_by = NULL WHERE uploaded_by = $1`, [userId]);
    await client.query(`UPDATE email_sends SET user_id = NULL WHERE user_id = $1`, [userId]);
    await client.query(`UPDATE email_sends SET sent_by = NULL WHERE sent_by = $1`, [userId]);
    await client.query(`UPDATE audit_consent_log SET user_id = NULL WHERE user_id = $1`, [userId]);
    await client.query(`UPDATE announcements SET created_by = NULL WHERE created_by = $1`, [userId]);

    // 3. Delete organizations owned by this user
    await client.query(
      `DELETE FROM organizations WHERE id IN (
         SELECT organization_id FROM organization_members WHERE user_id = $1 AND role = 'owner'
       )`,
      [userId]
    );

    // 4. Delete user (CASCADE handles 16+ related tables)
    await client.query(`DELETE FROM users WHERE id = $1`, [userId]);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  // Send final email (outside transaction - user is already deleted)
  await sendTemplate({
    templateSlug: 'deletion_completed',
    to: { userId, email: user.email, firstName: user.first_name },
    variables: { firstName: user.first_name },
  }).catch(err => console.error('Failed to send deletion completed email:', err));
}

/**
 * Run retention cleanup tasks:
 * - Process scheduled deletions past grace period
 * - Expire old export files
 * - Purge old auth logs
 */
async function runRetentionCleanup(): Promise<{ deletionsProcessed: number; exportsExpired: number; logsDeleted: number }> {
  let deletionsProcessed = 0;
  let exportsExpired = 0;
  let logsDeleted = 0;

  // 1. Process scheduled deletions past 30-day grace period
  const pendingDeletions = await pool.query<{ id: string }>(
    `SELECT id FROM users
     WHERE status = 'pending_deletion'
     AND deletion_scheduled_for IS NOT NULL
     AND deletion_scheduled_for <= NOW()`
  );

  for (const row of pendingDeletions.rows) {
    try {
      await executeAccountDeletion(row.id);
      deletionsProcessed++;
      console.log(`GDPR: Executed deletion for user ${row.id}`);
    } catch (err) {
      console.error(`GDPR: Failed to delete user ${row.id}:`, err);
    }
  }

  // 2. Expire old export files
  const expiredExports = await pool.query<{ id: string; file_path: string | null }>(
    `UPDATE account_data_exports
     SET status = 'expired'
     WHERE status = 'completed' AND expires_at IS NOT NULL AND expires_at < NOW()
     RETURNING id, file_path`
  );

  for (const row of expiredExports.rows) {
    exportsExpired++;
    if (row.file_path) {
      try {
        fs.unlinkSync(row.file_path);
      } catch {
        // File may already be deleted
      }
    }
  }

  // 3. Purge auth audit logs older than 1 year
  const logResult = await pool.query(
    `DELETE FROM auth_audit_logs WHERE created_at < NOW() - INTERVAL '1 year'`
  );
  logsDeleted += logResult.rowCount ?? 0;

  // 4. Purge API request logs older than 90 days (per privacy policy)
  const apiLogResult = await pool.query(
    `DELETE FROM api_requests WHERE created_at < NOW() - INTERVAL '90 days'`
  );
  logsDeleted += apiLogResult.rowCount ?? 0;

  // 5. Purge email send logs older than 1 year (per privacy policy)
  const emailLogResult = await pool.query(
    `DELETE FROM email_sends WHERE created_at < NOW() - INTERVAL '1 year'`
  );
  logsDeleted += emailLogResult.rowCount ?? 0;

  return { deletionsProcessed, exportsExpired, logsDeleted };
}

export const gdprService = {
  verifyPassword,
  requestExport,
  processExport,
  getExportDownload,
  getLatestExport,
  requestAccountDeletion,
  cancelAccountDeletion,
  executeAccountDeletion,
  runRetentionCleanup,
};
