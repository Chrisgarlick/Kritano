"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingInvitations = exports.getMembersWithUsers = void 0;
exports.setPool = setPool;
exports.createOrganization = createOrganization;
exports.getOrganizationById = getOrganizationById;
exports.getOrganizationBySlug = getOrganizationBySlug;
exports.getUserOrganizations = getUserOrganizations;
exports.updateOrganization = updateOrganization;
exports.deleteOrganization = deleteOrganization;
exports.transferOwnership = transferOwnership;
exports.getMembership = getMembership;
exports.getOrganizationMembers = getOrganizationMembers;
exports.updateMemberRole = updateMemberRole;
exports.removeMember = removeMember;
exports.leaveOrganization = leaveOrganization;
exports.createInvitation = createInvitation;
exports.getInvitationByToken = getInvitationByToken;
exports.getOrganizationInvitations = getOrganizationInvitations;
exports.acceptInvitation = acceptInvitation;
exports.declineInvitation = declineInvitation;
exports.cancelInvitation = cancelInvitation;
exports.getSubscription = getSubscription;
exports.getTierLimits = getTierLimits;
exports.getOrganizationLimits = getOrganizationLimits;
exports.checkSeatLimit = checkSeatLimit;
exports.checkDomainLimit = checkDomainLimit;
exports.checkAuditLimit = checkAuditLimit;
exports.getCurrentUsage = getCurrentUsage;
exports.canAuditDomain = canAuditDomain;
exports.logActivity = logActivity;
exports.getAuditLog = getAuditLog;
const crypto_1 = __importDefault(require("crypto"));
let pool;
function setPool(dbPool) {
    pool = dbPool;
}
// =============================================
// ORGANIZATION CRUD
// =============================================
/**
 * Create a new organization
 */
async function createOrganization(userId, input) {
    const slug = input.slug || generateSlug(input.name);
    // Verify slug is unique
    const existing = await pool.query('SELECT id FROM organizations WHERE slug = $1', [slug]);
    if (existing.rows.length > 0) {
        throw new Error('Organization slug already exists');
    }
    const result = await pool.query(`INSERT INTO organizations (name, slug, owner_id)
     VALUES ($1, $2, $3)
     RETURNING *`, [input.name, slug, userId]);
    return result.rows[0];
}
/**
 * Get organization by ID
 */
async function getOrganizationById(organizationId) {
    const result = await pool.query('SELECT * FROM organizations WHERE id = $1', [organizationId]);
    return result.rows[0] || null;
}
/**
 * Get organization by slug
 */
async function getOrganizationBySlug(slug) {
    const result = await pool.query('SELECT * FROM organizations WHERE slug = $1', [slug]);
    return result.rows[0] || null;
}
/**
 * Get all organizations for a user with their role and subscription
 */
async function getUserOrganizations(userId) {
    const result = await pool.query(`SELECT
      o.*,
      om.role,
      s.id as sub_id,
      s.tier as sub_tier,
      s.status as sub_status,
      s.stripe_customer_id,
      s.stripe_subscription_id,
      s.current_period_start,
      s.current_period_end,
      s.cancel_at_period_end,
      s.included_seats,
      s.extra_seats,
      (SELECT COUNT(*) FROM organization_members WHERE organization_id = o.id) as member_count,
      (SELECT COUNT(*) FROM organization_domains WHERE organization_id = o.id) as domain_count
     FROM organizations o
     JOIN organization_members om ON om.organization_id = o.id
     JOIN subscriptions s ON s.organization_id = o.id
     WHERE om.user_id = $1
     ORDER BY o.created_at ASC`, [userId]);
    return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        logo_url: row.logo_url,
        owner_id: row.owner_id,
        settings: row.settings,
        created_at: row.created_at,
        updated_at: row.updated_at,
        role: row.role,
        subscription: {
            id: row.sub_id,
            organization_id: row.id,
            tier: row.sub_tier,
            status: row.sub_status,
            stripe_customer_id: row.stripe_customer_id,
            stripe_subscription_id: row.stripe_subscription_id,
            current_period_start: row.current_period_start,
            current_period_end: row.current_period_end,
            cancel_at_period_end: row.cancel_at_period_end,
            included_seats: row.included_seats,
            extra_seats: row.extra_seats,
        },
        member_count: parseInt(row.member_count, 10),
        domain_count: parseInt(row.domain_count, 10),
    }));
}
/**
 * Update organization
 */
async function updateOrganization(organizationId, input) {
    const updates = [];
    const values = [];
    let paramIndex = 1;
    if (input.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(input.name);
    }
    if (input.slug !== undefined) {
        // Verify slug is unique
        const existing = await pool.query('SELECT id FROM organizations WHERE slug = $1 AND id != $2', [input.slug, organizationId]);
        if (existing.rows.length > 0) {
            throw new Error('Organization slug already exists');
        }
        updates.push(`slug = $${paramIndex++}`);
        values.push(input.slug);
    }
    if (input.logo_url !== undefined) {
        updates.push(`logo_url = $${paramIndex++}`);
        values.push(input.logo_url);
    }
    if (input.settings !== undefined) {
        updates.push(`settings = settings || $${paramIndex++}::jsonb`);
        values.push(JSON.stringify(input.settings));
    }
    if (updates.length === 0) {
        const org = await getOrganizationById(organizationId);
        if (!org)
            throw new Error('Organization not found');
        return org;
    }
    values.push(organizationId);
    const result = await pool.query(`UPDATE organizations SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`, values);
    if (result.rows.length === 0) {
        throw new Error('Organization not found');
    }
    return result.rows[0];
}
/**
 * Delete organization
 */
async function deleteOrganization(organizationId) {
    await pool.query('DELETE FROM organizations WHERE id = $1', [organizationId]);
}
/**
 * Transfer ownership to another member
 */
async function transferOwnership(organizationId, currentOwnerId, newOwnerId) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Verify new owner is a member
        const memberCheck = await client.query('SELECT id FROM organization_members WHERE organization_id = $1 AND user_id = $2', [organizationId, newOwnerId]);
        if (memberCheck.rows.length === 0) {
            throw new Error('New owner must be a member of the organization');
        }
        // Update organization owner
        await client.query('UPDATE organizations SET owner_id = $1 WHERE id = $2', [newOwnerId, organizationId]);
        // Update roles
        await client.query(`UPDATE organization_members SET role = 'admin' WHERE organization_id = $1 AND user_id = $2`, [organizationId, currentOwnerId]);
        await client.query(`UPDATE organization_members SET role = 'owner' WHERE organization_id = $1 AND user_id = $2`, [organizationId, newOwnerId]);
        await client.query('COMMIT');
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
// MEMBERSHIP
// =============================================
/**
 * Get user's membership in an organization
 */
async function getMembership(organizationId, userId) {
    const result = await pool.query(`SELECT * FROM organization_members WHERE organization_id = $1 AND user_id = $2`, [organizationId, userId]);
    return result.rows[0] || null;
}
/**
 * Get all members of an organization
 */
async function getOrganizationMembers(organizationId) {
    const result = await pool.query(`SELECT
      om.*,
      u.email as user_email,
      u.first_name as user_first_name,
      u.last_name as user_last_name
     FROM organization_members om
     JOIN users u ON u.id = om.user_id
     WHERE om.organization_id = $1
     ORDER BY
       CASE om.role
         WHEN 'owner' THEN 1
         WHEN 'admin' THEN 2
         WHEN 'member' THEN 3
         WHEN 'viewer' THEN 4
       END,
       om.joined_at ASC`, [organizationId]);
    return result.rows;
}
/**
 * Update member role
 */
async function updateMemberRole(organizationId, userId, newRole) {
    if (newRole === 'owner') {
        throw new Error('Cannot directly assign owner role. Use transferOwnership instead.');
    }
    // Cannot change owner's role
    const member = await getMembership(organizationId, userId);
    if (member?.role === 'owner') {
        throw new Error('Cannot change owner role. Transfer ownership first.');
    }
    const result = await pool.query(`UPDATE organization_members SET role = $1 WHERE organization_id = $2 AND user_id = $3 RETURNING *`, [newRole, organizationId, userId]);
    if (result.rows.length === 0) {
        throw new Error('Member not found');
    }
    return result.rows[0];
}
/**
 * Remove member from organization
 */
async function removeMember(organizationId, userId) {
    // Cannot remove owner
    const member = await getMembership(organizationId, userId);
    if (member?.role === 'owner') {
        throw new Error('Cannot remove organization owner. Transfer ownership or delete organization.');
    }
    await pool.query('DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2', [organizationId, userId]);
}
/**
 * Leave organization (self-remove)
 */
async function leaveOrganization(organizationId, userId) {
    const member = await getMembership(organizationId, userId);
    if (member?.role === 'owner') {
        throw new Error('Owner cannot leave organization. Transfer ownership or delete organization.');
    }
    await pool.query('DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2', [organizationId, userId]);
}
// =============================================
// INVITATIONS
// =============================================
/**
 * Create invitation
 */
async function createInvitation(organizationId, invitedBy, input) {
    // Check if already a member
    const existingMember = await pool.query(`SELECT om.id FROM organization_members om
     JOIN users u ON u.id = om.user_id
     WHERE om.organization_id = $1 AND u.email = $2`, [organizationId, input.email.toLowerCase()]);
    if (existingMember.rows.length > 0) {
        throw new Error('User is already a member of this organization');
    }
    // Check for existing pending invitation
    const existingInvite = await pool.query(`SELECT id FROM organization_invitations
     WHERE organization_id = $1 AND email = $2 AND status = 'pending'`, [organizationId, input.email.toLowerCase()]);
    if (existingInvite.rows.length > 0) {
        throw new Error('An invitation is already pending for this email');
    }
    // Check seat limit
    const canAddSeat = await checkSeatLimit(organizationId);
    if (!canAddSeat) {
        throw new Error('Organization has reached its seat limit. Upgrade your plan to add more members.');
    }
    const token = crypto_1.default.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    const result = await pool.query(`INSERT INTO organization_invitations (organization_id, email, role, invited_by, token, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`, [organizationId, input.email.toLowerCase(), input.role, invitedBy, token, expiresAt]);
    return result.rows[0];
}
/**
 * Get invitation by token
 */
async function getInvitationByToken(token) {
    const result = await pool.query(`SELECT
      oi.*,
      o.name as organization_name,
      CONCAT(u.first_name, ' ', u.last_name) as inviter_name
     FROM organization_invitations oi
     JOIN organizations o ON o.id = oi.organization_id
     JOIN users u ON u.id = oi.invited_by
     WHERE oi.token = $1`, [token]);
    return result.rows[0] || null;
}
/**
 * Get pending invitations for an organization
 */
async function getOrganizationInvitations(organizationId) {
    const result = await pool.query(`SELECT * FROM organization_invitations
     WHERE organization_id = $1 AND status = 'pending' AND expires_at > NOW()
     ORDER BY created_at DESC`, [organizationId]);
    return result.rows;
}
/**
 * Accept invitation
 */
async function acceptInvitation(token, userId) {
    const invitation = await getInvitationByToken(token);
    if (!invitation) {
        throw new Error('Invitation not found');
    }
    if (invitation.status !== 'pending') {
        throw new Error('Invitation has already been responded to');
    }
    if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Update invitation status
        await client.query(`UPDATE organization_invitations SET status = 'accepted', responded_at = NOW() WHERE id = $1`, [invitation.id]);
        // Add member
        const memberResult = await client.query(`INSERT INTO organization_members (organization_id, user_id, role, invited_by, joined_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`, [invitation.organization_id, userId, invitation.role, invitation.invited_by]);
        await client.query('COMMIT');
        return memberResult.rows[0];
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
/**
 * Decline invitation
 */
async function declineInvitation(token) {
    await pool.query(`UPDATE organization_invitations SET status = 'declined', responded_at = NOW() WHERE token = $1`, [token]);
}
/**
 * Cancel/delete invitation
 */
async function cancelInvitation(invitationId, organizationId) {
    if (organizationId) {
        await pool.query('DELETE FROM organization_invitations WHERE id = $1 AND organization_id = $2', [invitationId, organizationId]);
    }
    else {
        await pool.query('DELETE FROM organization_invitations WHERE id = $1', [invitationId]);
    }
}
// Alias for route compatibility
exports.getMembersWithUsers = getOrganizationMembers;
exports.getPendingInvitations = getOrganizationInvitations;
// =============================================
// SUBSCRIPTION & LIMITS
// =============================================
/**
 * Get subscription for organization
 */
async function getSubscription(organizationId) {
    const result = await pool.query('SELECT * FROM subscriptions WHERE organization_id = $1', [organizationId]);
    return result.rows[0] || null;
}
/**
 * Get tier limits
 */
async function getTierLimits(tier) {
    const result = await pool.query('SELECT * FROM tier_limits WHERE tier = $1', [tier]);
    return result.rows[0] || null;
}
/**
 * Get organization's tier limits
 */
async function getOrganizationLimits(organizationId) {
    const subscription = await getSubscription(organizationId);
    if (!subscription)
        return null;
    return getTierLimits(subscription.tier);
}
/**
 * Check if organization can add more seats
 */
async function checkSeatLimit(organizationId) {
    const result = await pool.query('SELECT check_seat_limit($1) as can_add', [organizationId]);
    return result.rows[0]?.can_add ?? false;
}
/**
 * Check if organization can add more domains
 */
async function checkDomainLimit(organizationId) {
    const result = await pool.query('SELECT check_domain_limit($1) as can_add', [organizationId]);
    return result.rows[0]?.can_add ?? false;
}
/**
 * Check if organization can create more audits this period
 */
async function checkAuditLimit(organizationId) {
    const result = await pool.query('SELECT check_audit_limit($1) as can_create', [organizationId]);
    return result.rows[0]?.can_create ?? false;
}
/**
 * Get current usage for organization
 */
async function getCurrentUsage(organizationId) {
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    const [audits, uniqueDomains, uniqueCompetitorDomains, members, apiRequests] = await Promise.all([
        pool.query(`SELECT COUNT(*) as count FROM audit_jobs
       WHERE organization_id = $1 AND created_at >= $2`, [organizationId, periodStart]),
        // Count unique domains from NON-competitor audits this billing period
        pool.query(`SELECT DISTINCT target_domain as domain
       FROM audit_jobs
       WHERE organization_id = $1 AND created_at >= $2 AND (is_competitor = FALSE OR is_competitor IS NULL)`, [organizationId, periodStart]),
        // Count unique domains from COMPETITOR audits this billing period (separate quota)
        pool.query(`SELECT DISTINCT target_domain as domain
       FROM audit_jobs
       WHERE organization_id = $1 AND created_at >= $2 AND is_competitor = TRUE`, [organizationId, periodStart]),
        pool.query('SELECT COUNT(*) as count FROM organization_members WHERE organization_id = $1', [organizationId]),
        pool.query(`SELECT COALESCE(SUM(api_requests), 0) as count FROM usage_records
       WHERE organization_id = $1 AND period_start >= $2`, [organizationId, periodStart]),
    ]);
    const domainsUsed = uniqueDomains.rows.map(r => r.domain).filter(Boolean);
    const competitorDomainsUsed = uniqueCompetitorDomains.rows.map(r => r.domain).filter(Boolean);
    return {
        audits: parseInt(audits.rows[0].count, 10),
        domains: domainsUsed.length,
        domainsUsed,
        members: parseInt(members.rows[0].count, 10),
        apiRequests: parseInt(apiRequests.rows[0].count, 10),
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        competitorDomains: competitorDomainsUsed.length,
        competitorDomainsUsed,
    };
}
/**
 * Check if organization can audit a new domain
 * Returns true if the domain has been audited before or if under the limit
 */
async function canAuditDomain(organizationId, url) {
    // Extract domain from URL
    const domain = url
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/.*$/, '')
        .toLowerCase();
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);
    // Get unique domains audited this period
    const uniqueDomainsResult = await pool.query(`SELECT DISTINCT lower(target_domain) as domain
     FROM audit_jobs
     WHERE organization_id = $1 AND created_at >= $2 AND target_domain IS NOT NULL`, [organizationId, periodStart]);
    const existingDomains = uniqueDomainsResult.rows.map(r => r.domain).filter(Boolean);
    // Check if this domain was already audited this period
    if (existingDomains.includes(domain)) {
        return { allowed: true, domainsUsed: existingDomains.length, maxDomains: null };
    }
    // Get subscription limits
    const limits = await getOrganizationLimits(organizationId);
    const maxDomains = limits?.max_domains ?? null;
    // If unlimited domains, allow
    if (maxDomains === null) {
        return { allowed: true, domainsUsed: existingDomains.length, maxDomains: null };
    }
    // Check if under the limit
    if (existingDomains.length < maxDomains) {
        return { allowed: true, domainsUsed: existingDomains.length, maxDomains };
    }
    // Over limit
    return {
        allowed: false,
        reason: `You've reached your plan's limit of ${maxDomains} domain${maxDomains === 1 ? '' : 's'} this month. Upgrade your plan or wait until next month to audit new domains.`,
        domainsUsed: existingDomains.length,
        maxDomains,
    };
}
// =============================================
// AUDIT LOG
// =============================================
/**
 * Log organization activity
 */
async function logActivity(organizationId, userId, action, resourceType, resourceId, details = {}, ipAddress, userAgent) {
    await pool.query(`INSERT INTO organization_audit_log
     (organization_id, user_id, action, resource_type, resource_id, details, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [organizationId, userId, action, resourceType, resourceId, JSON.stringify(details), ipAddress, userAgent]);
}
/**
 * Get audit log for organization
 */
async function getAuditLog(organizationId, options = {}) {
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    const [entries, total] = await Promise.all([
        pool.query(`SELECT * FROM organization_audit_log
       WHERE organization_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`, [organizationId, limit, offset]),
        pool.query('SELECT COUNT(*) as count FROM organization_audit_log WHERE organization_id = $1', [organizationId]),
    ]);
    return {
        entries: entries.rows,
        total: parseInt(total.rows[0].count, 10),
    };
}
// =============================================
// HELPERS
// =============================================
function generateSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50) + '-' + crypto_1.default.randomBytes(4).toString('hex');
}
//# sourceMappingURL=organization.service.js.map