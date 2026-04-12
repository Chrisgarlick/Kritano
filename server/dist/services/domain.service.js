"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPool = setPool;
exports.addDomain = addDomain;
exports.getOrganizationDomains = getOrganizationDomains;
exports.getDomainById = getDomainById;
exports.updateDomain = updateDomain;
exports.removeDomain = removeDomain;
exports.lockDomainForFreeTier = lockDomainForFreeTier;
exports.requestDomainChange = requestDomainChange;
exports.cancelDomainChange = cancelDomainChange;
exports.processMonthlyDomainResets = processMonthlyDomainResets;
exports.isUrlAllowedForAudit = isUrlAllowedForAudit;
const organization_service_js_1 = require("./organization.service.js");
let pool;
function setPool(dbPool) {
    pool = dbPool;
}
// =============================================
// DOMAIN CRUD
// =============================================
/**
 * Add a domain to an organization
 */
async function addDomain(organizationId, userId, input) {
    // Normalize domain
    const domain = normalizeDomain(input.domain);
    // Check if domain already exists in this org
    const existing = await pool.query('SELECT id FROM organization_domains WHERE organization_id = $1 AND domain = $2', [organizationId, domain]);
    if (existing.rows.length > 0) {
        throw new Error('Domain already exists in this organization');
    }
    // Check domain limit
    const canAdd = await (0, organization_service_js_1.checkDomainLimit)(organizationId);
    if (!canAdd) {
        throw new Error('Organization has reached its domain limit. Upgrade your plan to add more domains.');
    }
    // Get subscription to determine if domain locking applies
    const subscription = await (0, organization_service_js_1.getSubscription)(organizationId);
    const isFree = subscription?.tier === 'free';
    // For FREE tier, check if there's already a domain
    if (isFree) {
        const existingDomains = await pool.query('SELECT id FROM organization_domains WHERE organization_id = $1', [organizationId]);
        if (existingDomains.rows.length > 0) {
            throw new Error('FREE tier allows only 1 domain. Upgrade to add more domains.');
        }
    }
    // Create domain - requires verification before becoming active
    const result = await pool.query(`INSERT INTO organization_domains
     (organization_id, domain, include_subdomains, added_by, status, verified)
     VALUES ($1, $2, $3, $4, $5, FALSE)
     RETURNING *`, [
        organizationId,
        domain,
        input.include_subdomains ?? true,
        userId,
        isFree ? 'pending' : 'active', // FREE tier starts as pending until first audit
    ]);
    return result.rows[0];
}
/**
 * Get all domains for an organization
 */
async function getOrganizationDomains(organizationId) {
    const result = await pool.query(`SELECT * FROM organization_domains WHERE organization_id = $1 ORDER BY created_at ASC`, [organizationId]);
    return result.rows;
}
/**
 * Get domain by ID
 */
async function getDomainById(domainId) {
    const result = await pool.query('SELECT * FROM organization_domains WHERE id = $1', [domainId]);
    return result.rows[0] || null;
}
/**
 * Update domain settings
 */
async function updateDomain(domainId, updates) {
    const result = await pool.query(`UPDATE organization_domains
     SET include_subdomains = COALESCE($1, include_subdomains),
         ignore_robots_txt = COALESCE($2, ignore_robots_txt),
         rate_limit_profile = COALESCE($3, rate_limit_profile),
         send_verification_header = COALESCE($4, send_verification_header)
     WHERE id = $5
     RETURNING *`, [
        updates.include_subdomains,
        updates.ignore_robots_txt,
        updates.rate_limit_profile,
        updates.send_verification_header,
        domainId,
    ]);
    if (result.rows.length === 0) {
        throw new Error('Domain not found');
    }
    return result.rows[0];
}
/**
 * Remove domain from organization
 */
async function removeDomain(domainId) {
    await pool.query('DELETE FROM organization_domains WHERE id = $1', [domainId]);
}
// =============================================
// FREE TIER DOMAIN LOCKING
// =============================================
/**
 * Lock domain after first audit (FREE tier)
 * Called when an audit is started on a FREE tier organization
 */
async function lockDomainForFreeTier(organizationId, domain) {
    const subscription = await (0, organization_service_js_1.getSubscription)(organizationId);
    if (subscription?.tier !== 'free') {
        return; // Only applies to FREE tier
    }
    // Calculate end of current billing period (end of month)
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    await pool.query(`UPDATE organization_domains
     SET status = 'locked', locked_until = $1
     WHERE organization_id = $2 AND domain = $3 AND status IN ('pending', 'active')`, [endOfMonth, organizationId, normalizeDomain(domain)]);
}
/**
 * Request domain change for FREE tier
 * The new domain will become active on the next billing cycle
 */
async function requestDomainChange(organizationId, currentDomainId, newDomain) {
    const subscription = await (0, organization_service_js_1.getSubscription)(organizationId);
    if (subscription?.tier !== 'free') {
        throw new Error('Domain change requests only apply to FREE tier');
    }
    const normalizedNewDomain = normalizeDomain(newDomain);
    // Get current domain
    const currentDomain = await getDomainById(currentDomainId);
    if (!currentDomain) {
        throw new Error('Current domain not found');
    }
    if (currentDomain.organization_id !== organizationId) {
        throw new Error('Domain does not belong to this organization');
    }
    // Update domain with pending change
    const result = await pool.query(`UPDATE organization_domains
     SET status = 'pending_change', pending_domain = $1
     WHERE id = $2
     RETURNING *`, [normalizedNewDomain, currentDomainId]);
    return result.rows[0];
}
/**
 * Cancel pending domain change
 */
async function cancelDomainChange(domainId) {
    const result = await pool.query(`UPDATE organization_domains
     SET status = CASE WHEN locked_until > NOW() THEN 'locked' ELSE 'active' END,
         pending_domain = NULL
     WHERE id = $1
     RETURNING *`, [domainId]);
    if (result.rows.length === 0) {
        throw new Error('Domain not found');
    }
    return result.rows[0];
}
/**
 * Process domain changes at start of new billing period
 * Should be called by a scheduled job on the 1st of each month
 */
async function processMonthlyDomainResets() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Find all FREE tier domains with pending changes
        const pendingChanges = await client.query(`SELECT od.* FROM organization_domains od
       JOIN subscriptions s ON s.organization_id = od.organization_id
       WHERE s.tier = 'free' AND od.status = 'pending_change' AND od.pending_domain IS NOT NULL`);
        let processed = 0;
        for (const domain of pendingChanges.rows) {
            // Update to new domain
            await client.query(`UPDATE organization_domains
         SET domain = $1, pending_domain = NULL, status = 'pending', locked_until = NULL
         WHERE id = $2`, [domain.pending_domain, domain.id]);
            processed++;
        }
        // Also unlock any domains where locked_until has passed
        await client.query(`UPDATE organization_domains
       SET status = 'active', locked_until = NULL
       WHERE status = 'locked' AND locked_until <= NOW()`);
        await client.query('COMMIT');
        return processed;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
// =============================================
// DOMAIN VERIFICATION
// =============================================
// Note: Actual verification logic is in domain-verification.service.ts
// These functions are kept for backwards compatibility but should not be used
// Use attemptVerification() from domain-verification.service.ts instead
// =============================================
// DOMAIN VALIDATION
// =============================================
/**
 * Check if a URL is allowed for audit based on organization's domains
 */
async function isUrlAllowedForAudit(organizationId, url) {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./, '');
    const domains = await getOrganizationDomains(organizationId);
    if (domains.length === 0) {
        return { allowed: false, reason: 'No domains configured for this organization' };
    }
    for (const domain of domains) {
        // Check if domain is locked (FREE tier) and URL doesn't match
        if (domain.status === 'locked' || domain.status === 'pending_change') {
            const lockedDomain = domain.domain.replace(/^www\./, '');
            if (hostname === lockedDomain || (domain.include_subdomains && hostname.endsWith('.' + lockedDomain))) {
                return { allowed: true, matchedDomain: domain };
            }
        }
        // Check exact match
        const configuredDomain = domain.domain.replace(/^www\./, '');
        if (hostname === configuredDomain) {
            return { allowed: true, matchedDomain: domain };
        }
        // Check subdomain match
        if (domain.include_subdomains && hostname.endsWith('.' + configuredDomain)) {
            return { allowed: true, matchedDomain: domain };
        }
    }
    // For FREE tier with pending status, allow any configured domain
    const subscription = await (0, organization_service_js_1.getSubscription)(organizationId);
    if (subscription?.tier === 'free') {
        const pendingDomain = domains.find(d => d.status === 'pending');
        if (pendingDomain) {
            const pendingHostname = pendingDomain.domain.replace(/^www\./, '');
            if (hostname === pendingHostname || (pendingDomain.include_subdomains && hostname.endsWith('.' + pendingHostname))) {
                return { allowed: true, matchedDomain: pendingDomain };
            }
        }
    }
    return {
        allowed: false,
        reason: `URL "${hostname}" does not match any configured domain for this organization`,
    };
}
// =============================================
// HELPERS
// =============================================
function normalizeDomain(domain) {
    return domain
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/.*$/, '')
        .trim();
}
//# sourceMappingURL=domain.service.js.map