import { Pool } from 'pg';
import {
  CONSENT_VERSION,
  TOS_VERSION,
  getConsentTextHash,
} from '../constants/consent.constants.js';

let pool: Pool;

export function setPool(dbPool: Pool): void {
  pool = dbPool;
}

// =============================================
// TYPES
// =============================================

export interface AuditConsentInput {
  auditJobId: string;
  userId: string;
  organizationId?: string;
  targetUrl: string;
  targetDomain: string;
  isVerified: boolean;
  ipAddress: string;
  userAgent?: string;
  dontShowAgain?: boolean;
  consentVersion?: string;
}

export interface UserConsentPreference {
  skipUnverifiedDomainWarning: boolean;
}

export interface AuditConsentLog {
  id: string;
  audit_job_id: string;
  user_id: string;
  organization_id: string | null;
  target_url: string;
  target_domain: string;
  is_verified: boolean;
  accepted_at: Date;
  ip_address: string;
  user_agent: string | null;
  consent_text_hash: string;
  consent_version: string;
  dont_show_again: boolean;
  created_at: Date;
}

export interface UserConsent {
  id: string;
  user_id: string;
  consent_type: string;
  consent_version: string;
  consent_text_hash: string;
  accepted_at: Date;
  ip_address: string;
  user_agent: string | null;
  created_at: Date;
}

// =============================================
// AUDIT CONSENT LOGGING
// =============================================

/**
 * Log consent acceptance for an unverified domain audit
 * This is called every time an audit is started on an unverified domain,
 * regardless of the "don't show again" preference
 */
export async function logAuditConsent(input: AuditConsentInput): Promise<AuditConsentLog> {
  const consentVersion = input.consentVersion || CONSENT_VERSION;
  const consentTextHash = getConsentTextHash(consentVersion);

  const result = await pool.query<AuditConsentLog>(
    `INSERT INTO audit_consent_log (
      audit_job_id, user_id, organization_id,
      target_url, target_domain, is_verified,
      ip_address, user_agent,
      consent_text_hash, consent_version, dont_show_again
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      input.auditJobId,
      input.userId,
      input.organizationId || null,
      input.targetUrl,
      input.targetDomain,
      input.isVerified,
      input.ipAddress,
      input.userAgent || null,
      consentTextHash,
      consentVersion,
      input.dontShowAgain || false,
    ]
  );

  // If user chose "don't show again", update their preference
  if (input.dontShowAgain) {
    await updateConsentPreference(input.userId, true);
  }

  return result.rows[0];
}

/**
 * Get consent logs for a specific audit
 */
export async function getConsentLogsForAudit(auditJobId: string): Promise<AuditConsentLog[]> {
  const result = await pool.query<AuditConsentLog>(
    'SELECT * FROM audit_consent_log WHERE audit_job_id = $1 ORDER BY accepted_at DESC',
    [auditJobId]
  );
  return result.rows;
}

/**
 * Get all consent logs for a user
 */
export async function getConsentLogsForUser(
  userId: string,
  limit: number = 50
): Promise<AuditConsentLog[]> {
  const result = await pool.query<AuditConsentLog>(
    'SELECT * FROM audit_consent_log WHERE user_id = $1 ORDER BY accepted_at DESC LIMIT $2',
    [userId, limit]
  );
  return result.rows;
}

/**
 * Get consent logs for an organization
 */
export async function getConsentLogsForOrg(
  organizationId: string,
  limit: number = 100
): Promise<AuditConsentLog[]> {
  const result = await pool.query<AuditConsentLog>(
    'SELECT * FROM audit_consent_log WHERE organization_id = $1 ORDER BY accepted_at DESC LIMIT $2',
    [organizationId, limit]
  );
  return result.rows;
}

// =============================================
// USER CONSENT PREFERENCES
// =============================================

/**
 * Get user's consent preference (skip warning for unverified domains)
 */
export async function getUserConsentPreference(userId: string): Promise<UserConsentPreference> {
  const result = await pool.query<{ settings: Record<string, unknown> | null }>(
    'SELECT settings FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const settings = result.rows[0].settings || {};

  return {
    skipUnverifiedDomainWarning: settings.skipUnverifiedDomainWarning === true,
  };
}

/**
 * Update user's consent preference
 */
export async function updateConsentPreference(
  userId: string,
  skipWarning: boolean
): Promise<void> {
  await pool.query(
    `UPDATE users
     SET settings = COALESCE(settings, '{}'::jsonb) || $1::jsonb
     WHERE id = $2`,
    [JSON.stringify({ skipUnverifiedDomainWarning: skipWarning }), userId]
  );
}

/**
 * Reset user's consent preference (show warnings again)
 */
export async function resetConsentPreference(userId: string): Promise<void> {
  await updateConsentPreference(userId, false);
}

// =============================================
// TERMS OF SERVICE ACCEPTANCE
// =============================================

/**
 * Record ToS acceptance during registration
 */
export async function recordTosAcceptance(
  userId: string,
  ipAddress: string,
  userAgent?: string,
  version: string = TOS_VERSION
): Promise<UserConsent> {
  // Generate hash for ToS (you would typically have actual ToS text here)
  const tosHash = getConsentTextHash(`tos-${version}`);

  // Insert into user_consents table
  const result = await pool.query<UserConsent>(
    `INSERT INTO user_consents (
      user_id, consent_type, consent_version, consent_text_hash,
      ip_address, user_agent
    ) VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (user_id, consent_type, consent_version) DO UPDATE
    SET accepted_at = NOW(), ip_address = $5, user_agent = $6
    RETURNING *`,
    [
      userId,
      'terms_of_service',
      version,
      tosHash,
      ipAddress,
      userAgent || null,
    ]
  );

  // Also update the users table for quick access
  await pool.query(
    'UPDATE users SET tos_accepted_at = NOW(), tos_version = $1 WHERE id = $2',
    [version, userId]
  );

  return result.rows[0];
}

/**
 * Check if user has accepted ToS
 */
export async function hasAcceptedTos(
  userId: string,
  minVersion?: string
): Promise<boolean> {
  const result = await pool.query<{ tos_version: string | null }>(
    'SELECT tos_version FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0 || !result.rows[0].tos_version) {
    return false;
  }

  if (minVersion) {
    // Simple version comparison (assumes semantic versioning like "1.0", "1.1", etc.)
    return result.rows[0].tos_version >= minVersion;
  }

  return true;
}

/**
 * Get user's ToS acceptance details
 */
export async function getTosAcceptance(userId: string): Promise<UserConsent | null> {
  const result = await pool.query<UserConsent>(
    `SELECT * FROM user_consents
     WHERE user_id = $1 AND consent_type = 'terms_of_service'
     ORDER BY consent_version DESC
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
}

// =============================================
// PRIVACY POLICY ACCEPTANCE
// =============================================

/**
 * Record privacy policy acceptance
 */
export async function recordPrivacyAcceptance(
  userId: string,
  ipAddress: string,
  userAgent?: string,
  version: string = '1.0'
): Promise<UserConsent> {
  const hash = getConsentTextHash(`privacy-${version}`);

  const result = await pool.query<UserConsent>(
    `INSERT INTO user_consents (
      user_id, consent_type, consent_version, consent_text_hash,
      ip_address, user_agent
    ) VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (user_id, consent_type, consent_version) DO UPDATE
    SET accepted_at = NOW(), ip_address = $5, user_agent = $6
    RETURNING *`,
    [
      userId,
      'privacy_policy',
      version,
      hash,
      ipAddress,
      userAgent || null,
    ]
  );

  return result.rows[0];
}

// =============================================
// ADMIN/AUDIT FUNCTIONS
// =============================================

/**
 * Get all consent records for compliance/audit purposes
 */
export async function getConsentAuditTrail(
  filters: {
    userId?: string;
    organizationId?: string;
    domain?: string;
    startDate?: Date;
    endDate?: Date;
  },
  limit: number = 1000
): Promise<AuditConsentLog[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.userId) {
    conditions.push(`user_id = $${paramIndex++}`);
    params.push(filters.userId);
  }

  if (filters.organizationId) {
    conditions.push(`organization_id = $${paramIndex++}`);
    params.push(filters.organizationId);
  }

  if (filters.domain) {
    conditions.push(`target_domain = $${paramIndex++}`);
    params.push(filters.domain);
  }

  if (filters.startDate) {
    conditions.push(`accepted_at >= $${paramIndex++}`);
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    conditions.push(`accepted_at <= $${paramIndex++}`);
    params.push(filters.endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(limit);

  const result = await pool.query<AuditConsentLog>(
    `SELECT * FROM audit_consent_log ${whereClause} ORDER BY accepted_at DESC LIMIT $${paramIndex}`,
    params
  );

  return result.rows;
}

/**
 * Get statistics on consent records
 */
export async function getConsentStats(): Promise<{
  totalConsents: number;
  uniqueUsers: number;
  uniqueDomains: number;
  consentsToday: number;
  consentsThisMonth: number;
}> {
  const result = await pool.query<{
    total_consents: string;
    unique_users: string;
    unique_domains: string;
    consents_today: string;
    consents_this_month: string;
  }>(`
    SELECT
      COUNT(*) as total_consents,
      COUNT(DISTINCT user_id) as unique_users,
      COUNT(DISTINCT target_domain) as unique_domains,
      COUNT(*) FILTER (WHERE accepted_at >= CURRENT_DATE) as consents_today,
      COUNT(*) FILTER (WHERE accepted_at >= DATE_TRUNC('month', CURRENT_DATE)) as consents_this_month
    FROM audit_consent_log
  `);

  const row = result.rows[0];

  return {
    totalConsents: parseInt(row.total_consents, 10),
    uniqueUsers: parseInt(row.unique_users, 10),
    uniqueDomains: parseInt(row.unique_domains, 10),
    consentsToday: parseInt(row.consents_today, 10),
    consentsThisMonth: parseInt(row.consents_this_month, 10),
  };
}
