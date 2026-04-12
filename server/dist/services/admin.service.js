"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAdminService = initializeAdminService;
exports.getDashboardStats = getDashboardStats;
exports.getAnalyticsHistory = getAnalyticsHistory;
exports.listUsers = listUsers;
exports.getUserDetails = getUserDetails;
exports.updateUserSuperAdmin = updateUserSuperAdmin;
exports.updateUserTier = updateUserTier;
exports.deleteUser = deleteUser;
exports.listOrganizations = listOrganizations;
exports.getOrganizationDetails = getOrganizationDetails;
exports.updateOrganizationTier = updateOrganizationTier;
exports.updateSubscriptionStatus = updateSubscriptionStatus;
exports.getAdminActivityLog = getAdminActivityLog;
exports.getSystemHealth = getSystemHealth;
let pool;
function initializeAdminService(dbPool) {
    pool = dbPool;
}
// =============================================
// Dashboard & Analytics
// =============================================
async function getDashboardStats() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    // Users stats
    const usersResult = await pool.query(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE email_verified = TRUE) as verified,
      COUNT(*) FILTER (WHERE DATE(created_at) = $1) as new_today,
      COUNT(*) FILTER (WHERE created_at >= $2) as new_this_week,
      COUNT(*) FILTER (WHERE created_at >= $3) as new_this_month
    FROM users
  `, [today, weekAgo, monthAgo]);
    // Organizations stats
    const orgsResult = await pool.query(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE DATE(created_at) = $1) as new_today,
      COUNT(*) FILTER (WHERE created_at >= $2) as new_this_week
    FROM organizations
  `, [today, weekAgo]);
    // Subscription stats
    const subsResult = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE tier = 'free') as free,
      COUNT(*) FILTER (WHERE tier = 'starter') as starter,
      COUNT(*) FILTER (WHERE tier = 'pro') as pro,
      COUNT(*) FILTER (WHERE tier = 'agency') as agency,
      COUNT(*) FILTER (WHERE tier = 'enterprise') as enterprise
    FROM subscriptions
  `);
    // Audit stats
    const auditsResult = await pool.query(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE DATE(created_at) = $1) as today,
      COUNT(*) FILTER (WHERE created_at >= $2) as this_week,
      COUNT(*) FILTER (WHERE created_at >= $3) as this_month,
      COALESCE(SUM(pages_crawled) FILTER (WHERE DATE(created_at) = $1), 0) as pages_today
    FROM audit_jobs
  `, [today, weekAgo, monthAgo]);
    const users = usersResult.rows[0];
    const orgs = orgsResult.rows[0];
    const subs = subsResult.rows[0];
    const audits = auditsResult.rows[0];
    return {
        users: {
            total: parseInt(users.total),
            verified: parseInt(users.verified),
            newToday: parseInt(users.new_today),
            newThisWeek: parseInt(users.new_this_week),
            newThisMonth: parseInt(users.new_this_month),
        },
        organizations: {
            total: parseInt(orgs.total),
            newToday: parseInt(orgs.new_today),
            newThisWeek: parseInt(orgs.new_this_week),
        },
        subscriptions: {
            free: parseInt(subs.free),
            starter: parseInt(subs.starter),
            pro: parseInt(subs.pro),
            agency: parseInt(subs.agency),
            enterprise: parseInt(subs.enterprise),
        },
        audits: {
            total: parseInt(audits.total),
            today: parseInt(audits.today),
            thisWeek: parseInt(audits.this_week),
            thisMonth: parseInt(audits.this_month),
            pagesCrawledToday: parseInt(audits.pages_today),
        },
    };
}
async function getAnalyticsHistory(days = 30) {
    // First, update today's snapshot
    await pool.query('SELECT update_platform_analytics()');
    const result = await pool.query(`
    SELECT
      date::text,
      total_users,
      new_users,
      active_users,
      total_audits,
      audits_today,
      pages_crawled_today
    FROM platform_analytics
    WHERE date >= CURRENT_DATE - $1::integer
    ORDER BY date ASC
  `, [days]);
    return result.rows;
}
// =============================================
// User Management
// =============================================
async function listUsers(page = 1, limit = 50, search, sortBy = 'created_at', sortOrder = 'desc') {
    const offset = (page - 1) * limit;
    const validSortColumns = ['email', 'created_at', 'last_login_at', 'first_name'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    let whereClause = '';
    const params = [];
    if (search) {
        whereClause = `WHERE u.email ILIKE $1 OR u.first_name ILIKE $1 OR u.last_name ILIKE $1`;
        params.push(`%${search}%`);
    }
    const countResult = await pool.query(`SELECT COUNT(*) FROM users u ${whereClause}`, params);
    const result = await pool.query(`SELECT
      u.id,
      u.email,
      u.first_name,
      u.last_name,
      u.email_verified,
      u.is_super_admin,
      u.created_at,
      u.last_login_at,
      (SELECT COUNT(*) FROM organization_members om WHERE om.user_id = u.id) as organization_count,
      COALESCE(ep.unsubscribed_all, false) AS unsubscribed_all,
      COALESCE(
        (SELECT s.tier FROM subscriptions s WHERE s.user_id = u.id AND s.status IN ('active', 'trialing') ORDER BY s.created_at DESC LIMIT 1),
        'free'
      ) AS tier
     FROM users u
     LEFT JOIN email_preferences ep ON ep.user_id = u.id
     ${whereClause}
     ORDER BY u.${sortColumn} ${order}
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]);
    return {
        users: result.rows,
        total: parseInt(countResult.rows[0].count),
    };
}
async function getUserDetails(userId) {
    const result = await pool.query(`SELECT
      u.id,
      u.email,
      u.first_name,
      u.last_name,
      u.email_verified,
      u.is_super_admin,
      u.created_at,
      u.last_login_at,
      (SELECT COUNT(*) FROM organization_members om WHERE om.user_id = u.id) as organization_count,
      COALESCE(ep.unsubscribed_all, false) AS unsubscribed_all
     FROM users u
     LEFT JOIN email_preferences ep ON ep.user_id = u.id
     WHERE u.id = $1`, [userId]);
    return result.rows[0] || null;
}
async function updateUserSuperAdmin(userId, isSuperAdmin) {
    await pool.query('UPDATE users SET is_super_admin = $1 WHERE id = $2', [isSuperAdmin, userId]);
}
async function updateUserTier(userId, tier) {
    // Upsert the user's subscription — update if active/trialing exists, otherwise insert
    const existing = await pool.query(`SELECT id FROM subscriptions WHERE user_id = $1 AND status IN ('active', 'trialing') ORDER BY created_at DESC LIMIT 1`, [userId]);
    if (existing.rows.length > 0) {
        await pool.query(`UPDATE subscriptions SET tier = $1, updated_at = NOW() WHERE id = $2`, [tier, existing.rows[0].id]);
    }
    else {
        await pool.query(`INSERT INTO subscriptions (user_id, tier, status) VALUES ($1, $2, 'active')`, [userId, tier]);
    }
}
async function deleteUser(userId) {
    // This will cascade delete organization memberships
    // Need to handle organizations where user is the only owner
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
}
// =============================================
// Organization Management
// =============================================
async function listOrganizations(page = 1, limit = 50, search, tier, sortBy = 'created_at', sortOrder = 'desc') {
    const offset = (page - 1) * limit;
    const validSortColumns = ['name', 'created_at', 'member_count', 'audit_count'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    if (search) {
        conditions.push(`(o.name ILIKE $${paramIndex} OR o.slug ILIKE $${paramIndex} OR owner.email ILIKE $${paramIndex})`);
        params.push(`%${search}%`);
        paramIndex++;
    }
    if (tier) {
        conditions.push(`s.tier = $${paramIndex}`);
        params.push(tier);
        paramIndex++;
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await pool.query(`SELECT COUNT(*)
     FROM organizations o
     JOIN users owner ON owner.id = o.owner_id
     JOIN subscriptions s ON s.organization_id = o.id
     ${whereClause}`, params);
    const result = await pool.query(`SELECT
      o.id,
      o.name,
      o.slug,
      owner.email as owner_email,
      COALESCE(owner.first_name || ' ' || owner.last_name, owner.email) as owner_name,
      s.tier,
      s.status,
      (SELECT COUNT(*) FROM organization_members om WHERE om.organization_id = o.id) as member_count,
      (SELECT COUNT(*) FROM organization_domains od WHERE od.organization_id = o.id) as domain_count,
      (SELECT COUNT(*) FROM audit_jobs aj WHERE aj.organization_id = o.id) as audit_count,
      o.created_at
     FROM organizations o
     JOIN users owner ON owner.id = o.owner_id
     JOIN subscriptions s ON s.organization_id = o.id
     ${whereClause}
     ORDER BY ${sortColumn === 'member_count' || sortColumn === 'audit_count' ? sortColumn : 'o.' + sortColumn} ${order}
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, [...params, limit, offset]);
    return {
        organizations: result.rows,
        total: parseInt(countResult.rows[0].count),
    };
}
async function getOrganizationDetails(orgId) {
    const result = await pool.query(`SELECT
      o.id,
      o.name,
      o.slug,
      owner.email as owner_email,
      COALESCE(owner.first_name || ' ' || owner.last_name, owner.email) as owner_name,
      s.tier,
      s.status,
      (SELECT COUNT(*) FROM organization_members om WHERE om.organization_id = o.id) as member_count,
      (SELECT COUNT(*) FROM organization_domains od WHERE od.organization_id = o.id) as domain_count,
      (SELECT COUNT(*) FROM audit_jobs aj WHERE aj.organization_id = o.id) as audit_count,
      o.created_at
     FROM organizations o
     JOIN users owner ON owner.id = o.owner_id
     JOIN subscriptions s ON s.organization_id = o.id
     WHERE o.id = $1`, [orgId]);
    return result.rows[0] || null;
}
// =============================================
// Subscription Management
// =============================================
async function updateOrganizationTier(orgId, tier) {
    // Get tier limits
    const limitsResult = await pool.query('SELECT max_seats FROM tier_limits WHERE tier = $1', [tier]);
    const maxSeats = limitsResult.rows[0]?.max_seats || 1;
    await pool.query(`UPDATE subscriptions
     SET tier = $1,
         included_seats = $2,
         updated_at = NOW()
     WHERE organization_id = $3`, [tier, maxSeats, orgId]);
}
async function updateSubscriptionStatus(orgId, status) {
    await pool.query(`UPDATE subscriptions
     SET status = $1, updated_at = NOW()
     WHERE organization_id = $2`, [status, orgId]);
}
// =============================================
// Activity Log
// =============================================
async function getAdminActivityLog(page = 1, limit = 50, adminId) {
    const offset = (page - 1) * limit;
    let whereClause = '';
    const params = [];
    if (adminId) {
        whereClause = 'WHERE al.admin_id = $1';
        params.push(adminId);
    }
    const countResult = await pool.query(`SELECT COUNT(*) FROM admin_activity_log al ${whereClause}`, params);
    const result = await pool.query(`SELECT
      al.id,
      u.email as admin_email,
      al.action,
      al.target_type,
      al.target_id,
      al.details,
      al.ip_address::text,
      al.created_at
     FROM admin_activity_log al
     JOIN users u ON u.id = al.admin_id
     ${whereClause}
     ORDER BY al.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]);
    return {
        activities: result.rows,
        total: parseInt(countResult.rows[0].count),
    };
}
// =============================================
// System Health
// =============================================
async function getSystemHealth() {
    try {
        // Test database connection
        await pool.query('SELECT 1');
        const queueResult = await pool.query(`SELECT COUNT(*) FROM audit_jobs WHERE status IN ('pending', 'queued')`);
        const activeResult = await pool.query(`SELECT COUNT(*) FROM audit_jobs WHERE status = 'running'`);
        const failedResult = await pool.query(`SELECT COUNT(*) FROM audit_jobs WHERE status = 'failed' AND DATE(created_at) = CURRENT_DATE`);
        return {
            database: true,
            queueSize: parseInt(queueResult.rows[0].count),
            activeAudits: parseInt(activeResult.rows[0].count),
            failedAuditsToday: parseInt(failedResult.rows[0].count),
        };
    }
    catch {
        return {
            database: false,
            queueSize: 0,
            activeAudits: 0,
            failedAuditsToday: 0,
        };
    }
}
//# sourceMappingURL=admin.service.js.map