import { Pool } from 'pg';
import dns from 'dns';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
import type { OrganizationDomain } from '../types/organization.types.js';
import {
  VERIFICATION_TOKEN_PREFIX,
  VERIFICATION_FILE_PATH,
  VERIFICATION_DNS_SUBDOMAIN,
  VERIFICATION_LIMITS,
} from '../constants/consent.constants.js';

const resolveTxt = promisify(dns.resolveTxt);

let pool: Pool;

export function setPool(dbPool: Pool): void {
  pool = dbPool;
}

// =============================================
// TYPES
// =============================================

export interface VerificationInstructions {
  token: string;
  dns: {
    recordType: 'TXT';
    name: string;
    alternativeName: string;
    value: string;
  };
  file: {
    path: string;
    url: string;
    content: string;
  };
}

export interface VerificationResult {
  verified: boolean;
  method?: 'dns' | 'file';
  error?: string;
  details?: string;
}

// =============================================
// TOKEN GENERATION
// =============================================

/**
 * Generate a unique verification token for a domain
 * If a token already exists and is not expired, return the existing one
 */
export async function generateVerificationToken(
  organizationId: string,
  domainId: string
): Promise<VerificationInstructions> {
  // Get the domain
  const domainResult = await pool.query<OrganizationDomain>(
    'SELECT * FROM organization_domains WHERE id = $1 AND organization_id = $2',
    [domainId, organizationId]
  );

  if (domainResult.rows.length === 0) {
    throw new Error('Domain not found');
  }

  const domain = domainResult.rows[0];

  // Check if there's already a verification token
  let token = domain.verification_token;

  if (!token) {
    // Generate new token
    token = randomUUID();

    // Store token in database
    await pool.query(
      `UPDATE organization_domains
       SET verification_token = $1
       WHERE id = $2`,
      [token, domainId]
    );
  }

  // Build verification instructions
  const verificationValue = `${VERIFICATION_TOKEN_PREFIX}${token}`;

  return {
    token,
    dns: {
      recordType: 'TXT',
      name: domain.domain,
      alternativeName: `${VERIFICATION_DNS_SUBDOMAIN}.${domain.domain}`,
      value: verificationValue,
    },
    file: {
      path: VERIFICATION_FILE_PATH,
      url: `https://${domain.domain}${VERIFICATION_FILE_PATH}`,
      content: token,
    },
  };
}

// =============================================
// DNS TXT VERIFICATION
// =============================================

/**
 * Verify domain ownership via DNS TXT record
 * Looks for pagepulser-verify=<token> in:
 * 1. Root domain TXT records
 * 2. _pagepulser.<domain> TXT records
 */
export async function verifyDnsTxt(
  domain: string,
  expectedToken: string
): Promise<VerificationResult> {
  const expectedValue = `${VERIFICATION_TOKEN_PREFIX}${expectedToken}`;

  try {
    // Try root domain first
    const rootResult = await queryDnsTxt(domain, expectedValue);
    if (rootResult.verified) {
      return rootResult;
    }

    // Try _pagepulser subdomain
    const subdomainResult = await queryDnsTxt(
      `${VERIFICATION_DNS_SUBDOMAIN}.${domain}`,
      expectedValue
    );
    if (subdomainResult.verified) {
      return subdomainResult;
    }

    return {
      verified: false,
      error: 'Verification record not found',
      details: `Expected TXT record with value "${expectedValue}" on ${domain} or ${VERIFICATION_DNS_SUBDOMAIN}.${domain}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle common DNS errors
    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ENODATA')) {
      return {
        verified: false,
        error: 'No TXT records found for this domain',
        details: `Make sure you have added a TXT record to ${domain} or ${VERIFICATION_DNS_SUBDOMAIN}.${domain}`,
      };
    }

    if (errorMessage.includes('ETIMEOUT')) {
      return {
        verified: false,
        error: 'DNS query timed out',
        details: 'Please try again. If this persists, check your DNS provider.',
      };
    }

    return {
      verified: false,
      error: 'DNS verification failed',
      details: errorMessage,
    };
  }
}

async function queryDnsTxt(domain: string, expectedValue: string): Promise<VerificationResult> {
  try {
    const records = await Promise.race([
      resolveTxt(domain),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('ETIMEOUT')), VERIFICATION_LIMITS.DNS_TIMEOUT_MS)
      ),
    ]);

    // TXT records come back as arrays of strings (can be chunked)
    for (const record of records) {
      const fullRecord = record.join('');
      if (fullRecord === expectedValue) {
        return {
          verified: true,
          method: 'dns',
          details: `Found matching TXT record on ${domain}`,
        };
      }
    }

    return {
      verified: false,
      error: 'TXT record found but value does not match',
      details: `Found ${records.length} TXT record(s) but none matched expected value`,
    };
  } catch (error) {
    throw error;
  }
}

// =============================================
// FILE VERIFICATION
// =============================================

/**
 * Verify domain ownership via file upload
 * Fetches /.well-known/pagepulser-verify.txt and checks content
 */
export async function verifyFile(
  domain: string,
  expectedToken: string
): Promise<VerificationResult> {
  const url = `https://${domain}${VERIFICATION_FILE_PATH}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      VERIFICATION_LIMITS.FILE_FETCH_TIMEOUT_MS
    );

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'PagePulser-Verifier/1.0',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        verified: false,
        error: `Failed to fetch verification file (HTTP ${response.status})`,
        details: response.status === 404
          ? `File not found at ${url}. Make sure you have created the file at the correct path.`
          : `Server returned status ${response.status}`,
      };
    }

    const content = await response.text();
    const trimmedContent = content.trim();

    if (trimmedContent === expectedToken) {
      return {
        verified: true,
        method: 'file',
        details: `Found matching content at ${url}`,
      };
    }

    return {
      verified: false,
      error: 'Verification file found but content does not match',
      details: `Expected "${expectedToken}" but found "${trimmedContent.substring(0, 50)}${trimmedContent.length > 50 ? '...' : ''}"`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('abort') || errorMessage.includes('timeout')) {
      return {
        verified: false,
        error: 'Request timed out',
        details: `Could not reach ${url} within ${VERIFICATION_LIMITS.FILE_FETCH_TIMEOUT_MS / 1000} seconds`,
      };
    }

    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
      return {
        verified: false,
        error: 'Domain not found',
        details: `Could not resolve ${domain}. Make sure the domain exists and has DNS configured.`,
      };
    }

    if (errorMessage.includes('ECONNREFUSED')) {
      return {
        verified: false,
        error: 'Connection refused',
        details: `Could not connect to ${domain}. Make sure the website is accessible via HTTPS.`,
      };
    }

    return {
      verified: false,
      error: 'File verification failed',
      details: errorMessage,
    };
  }
}

// =============================================
// MAIN VERIFICATION FUNCTION
// =============================================

/**
 * Attempt to verify a domain using the specified method
 * Updates the database on success
 */
export async function attemptVerification(
  organizationId: string,
  domainId: string,
  method: 'dns' | 'file'
): Promise<VerificationResult> {
  // Get the domain
  const domainResult = await pool.query<OrganizationDomain>(
    'SELECT * FROM organization_domains WHERE id = $1 AND organization_id = $2',
    [domainId, organizationId]
  );

  if (domainResult.rows.length === 0) {
    throw new Error('Domain not found');
  }

  const domain = domainResult.rows[0];

  if (!domain.verification_token) {
    throw new Error('No verification token found. Generate a token first.');
  }

  // Check verification attempt limits
  const attempts = domain.verification_attempts || 0;
  const lastAttempt = domain.last_verification_attempt
    ? new Date(domain.last_verification_attempt)
    : null;

  if (attempts >= VERIFICATION_LIMITS.MAX_ATTEMPTS && lastAttempt) {
    const cooldownEnd = new Date(lastAttempt.getTime() + VERIFICATION_LIMITS.COOLDOWN_MS);
    if (new Date() < cooldownEnd) {
      const minutesRemaining = Math.ceil((cooldownEnd.getTime() - Date.now()) / 60000);
      throw new Error(
        `Too many verification attempts. Please wait ${minutesRemaining} minute(s) before trying again.`
      );
    }
    // Reset attempts after cooldown
    await pool.query(
      'UPDATE organization_domains SET verification_attempts = 0 WHERE id = $1',
      [domainId]
    );
  }

  // Increment attempt counter
  await pool.query(
    `UPDATE organization_domains
     SET verification_attempts = verification_attempts + 1,
         last_verification_attempt = NOW()
     WHERE id = $1`,
    [domainId]
  );

  // Attempt verification
  let result: VerificationResult;

  if (method === 'dns') {
    result = await verifyDnsTxt(domain.domain, domain.verification_token);
  } else {
    result = await verifyFile(domain.domain, domain.verification_token);
  }

  // Update database on success
  if (result.verified) {
    await pool.query(
      `UPDATE organization_domains
       SET verified = TRUE,
           verified_at = NOW(),
           verification_method = $1,
           verification_attempts = 0
       WHERE id = $2`,
      [method, domainId]
    );
  }

  return result;
}

// =============================================
// STATUS CHECK
// =============================================

/**
 * Get the current verification status of a domain
 */
export async function getVerificationStatus(
  organizationId: string,
  domainId: string
): Promise<{
  verified: boolean;
  method: string | null;
  verifiedAt: Date | null;
  hasToken: boolean;
  attempts: number;
}> {
  const result = await pool.query<OrganizationDomain>(
    'SELECT * FROM organization_domains WHERE id = $1 AND organization_id = $2',
    [domainId, organizationId]
  );

  if (result.rows.length === 0) {
    throw new Error('Domain not found');
  }

  const domain = result.rows[0];

  return {
    verified: domain.verified,
    method: domain.verification_method || null,
    verifiedAt: domain.verified_at || null,
    hasToken: !!domain.verification_token,
    attempts: domain.verification_attempts || 0,
  };
}

/**
 * Check if a domain (by hostname) is verified for an organization
 * Used when starting an audit to determine if consent is required
 */
export async function isDomainVerifiedForOrg(
  organizationId: string,
  hostname: string
): Promise<{ verified: boolean; domainId?: string }> {
  // Normalize hostname
  const normalizedHostname = hostname.toLowerCase().replace(/^www\./, '');

  // Check for exact match or subdomain match
  const result = await pool.query<OrganizationDomain>(
    `SELECT * FROM organization_domains
     WHERE organization_id = $1 AND verified = TRUE`,
    [organizationId]
  );

  for (const domain of result.rows) {
    const configuredDomain = domain.domain.toLowerCase().replace(/^www\./, '');

    // Exact match
    if (normalizedHostname === configuredDomain) {
      return { verified: true, domainId: domain.id };
    }

    // Subdomain match
    if (domain.include_subdomains && normalizedHostname.endsWith('.' + configuredDomain)) {
      return { verified: true, domainId: domain.id };
    }
  }

  return { verified: false };
}

/**
 * Revoke domain verification (for admin use or testing)
 */
export async function revokeVerification(
  organizationId: string,
  domainId: string
): Promise<void> {
  await pool.query(
    `UPDATE organization_domains
     SET verified = FALSE,
         verified_at = NULL,
         verification_method = NULL,
         verification_token = NULL,
         verification_attempts = 0
     WHERE id = $1 AND organization_id = $2`,
    [domainId, organizationId]
  );
}

// =============================================
// DOMAIN SETTINGS FOR AUDIT
// =============================================

export interface DomainAuditSettings {
  verified: boolean;
  ignoreRobotsTxt: boolean;
  rateLimitProfile: string | null;
  sendVerificationHeader: boolean;
  verificationToken: string | null;
}

/**
 * Get domain bypass settings for audit worker
 * Used to apply custom settings for verified domains
 */
export async function getDomainSettingsForAudit(
  organizationId: string,
  hostname: string
): Promise<DomainAuditSettings | null> {
  // Normalize hostname
  const normalizedHostname = hostname.toLowerCase().replace(/^www\./, '');

  // Check for verified domain with bypass settings
  const result = await pool.query<{
    verified: boolean;
    ignore_robots_txt: boolean;
    rate_limit_profile: string | null;
    send_verification_header: boolean;
    verification_token: string | null;
    domain: string;
    include_subdomains: boolean;
  }>(
    `SELECT verified, ignore_robots_txt, rate_limit_profile, send_verification_header,
            verification_token, domain, include_subdomains
     FROM organization_domains
     WHERE organization_id = $1`,
    [organizationId]
  );

  for (const domain of result.rows) {
    const configuredDomain = domain.domain.toLowerCase().replace(/^www\./, '');

    // Check for exact match or subdomain match
    const isMatch =
      normalizedHostname === configuredDomain ||
      (domain.include_subdomains && normalizedHostname.endsWith('.' + configuredDomain));

    if (isMatch) {
      return {
        verified: domain.verified,
        ignoreRobotsTxt: domain.ignore_robots_txt || false,
        rateLimitProfile: domain.rate_limit_profile || null,
        sendVerificationHeader: domain.send_verification_header ?? true,
        verificationToken: domain.verification_token,
      };
    }
  }

  return null;
}
