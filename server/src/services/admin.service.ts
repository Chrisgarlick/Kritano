import { Pool } from 'pg';

let pool: Pool;

export function initializeAdminService(dbPool: Pool): void {
  pool = dbPool;
}

// =============================================
// Types
// =============================================

export interface DashboardStats {
  users: {
    total: number;
    verified: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  organizations: {
    total: number;
    newToday: number;
    newThisWeek: number;
  };
  subscriptions: {
    free: number;
    starter: number;
    pro: number;
    agency: number;
    enterprise: number;
  };
  audits: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    pagesCrawledToday: number;
  };
}

export interface UserListItem {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  email_verified: boolean;
  is_super_admin: boolean;
  created_at: string;
  last_login_at: string | null;
  organization_count: number;
}

export interface OrganizationListItem {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  owner_name: string;
  tier: string;
  status: string;
  member_count: number;
  domain_count: number;
  audit_count: number;
  created_at: string;
}

export interface AdminActivityItem {
  id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface AnalyticsData {
  date: string;
  total_users: number;
  new_users: number;
  active_users: number;
  total_audits: number;
  audits_today: number;
  pages_crawled_today: number;
}

// =============================================
// Dashboard & Analytics
// =============================================

export async function getDashboardStats(): Promise<DashboardStats> {
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

export async function getAnalyticsHistory(days: number = 30): Promise<AnalyticsData[]> {
  // First, update today's snapshot
  await pool.query('SELECT update_platform_analytics()');

  const result = await pool.query<AnalyticsData>(`
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

export async function listUsers(
  page: number = 1,
  limit: number = 50,
  search?: string,
  sortBy: string = 'created_at',
  sortOrder: string = 'desc'
): Promise<{ users: UserListItem[]; total: number }> {
  const offset = (page - 1) * limit;
  const validSortColumns = ['email', 'created_at', 'last_login_at', 'first_name'];
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
  const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  let whereClause = '';
  const params: (string | number)[] = [];

  if (search) {
    whereClause = `WHERE u.email ILIKE $1 OR u.first_name ILIKE $1 OR u.last_name ILIKE $1`;
    params.push(`%${search}%`);
  }

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM users u ${whereClause}`,
    params
  );

  const result = await pool.query<UserListItem>(
    `SELECT
      u.id,
      u.email,
      u.first_name,
      u.last_name,
      u.email_verified,
      u.is_super_admin,
      u.created_at,
      u.last_login_at,
      (SELECT COUNT(*) FROM organization_members om WHERE om.user_id = u.id) as organization_count
     FROM users u
     ${whereClause}
     ORDER BY u.${sortColumn} ${order}
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return {
    users: result.rows,
    total: parseInt(countResult.rows[0].count),
  };
}

export async function getUserDetails(userId: string): Promise<UserListItem | null> {
  const result = await pool.query<UserListItem>(
    `SELECT
      u.id,
      u.email,
      u.first_name,
      u.last_name,
      u.email_verified,
      u.is_super_admin,
      u.created_at,
      u.last_login_at,
      (SELECT COUNT(*) FROM organization_members om WHERE om.user_id = u.id) as organization_count
     FROM users u
     WHERE u.id = $1`,
    [userId]
  );

  return result.rows[0] || null;
}

export async function updateUserSuperAdmin(userId: string, isSuperAdmin: boolean): Promise<void> {
  await pool.query(
    'UPDATE users SET is_super_admin = $1 WHERE id = $2',
    [isSuperAdmin, userId]
  );
}

export async function deleteUser(userId: string): Promise<void> {
  // This will cascade delete organization memberships
  // Need to handle organizations where user is the only owner
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
}

// =============================================
// Organization Management
// =============================================

export async function listOrganizations(
  page: number = 1,
  limit: number = 50,
  search?: string,
  tier?: string,
  sortBy: string = 'created_at',
  sortOrder: string = 'desc'
): Promise<{ organizations: OrganizationListItem[]; total: number }> {
  const offset = (page - 1) * limit;
  const validSortColumns = ['name', 'created_at', 'member_count', 'audit_count'];
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
  const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const conditions: string[] = [];
  const params: (string | number)[] = [];
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

  const countResult = await pool.query(
    `SELECT COUNT(*)
     FROM organizations o
     JOIN users owner ON owner.id = o.owner_id
     JOIN subscriptions s ON s.organization_id = o.id
     ${whereClause}`,
    params
  );

  const result = await pool.query<OrganizationListItem>(
    `SELECT
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
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  return {
    organizations: result.rows,
    total: parseInt(countResult.rows[0].count),
  };
}

export async function getOrganizationDetails(orgId: string): Promise<OrganizationListItem | null> {
  const result = await pool.query<OrganizationListItem>(
    `SELECT
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
     WHERE o.id = $1`,
    [orgId]
  );

  return result.rows[0] || null;
}

// =============================================
// Subscription Management
// =============================================

export async function updateOrganizationTier(
  orgId: string,
  tier: 'free' | 'starter' | 'pro' | 'agency' | 'enterprise'
): Promise<void> {
  // Get tier limits
  const limitsResult = await pool.query(
    'SELECT max_seats FROM tier_limits WHERE tier = $1',
    [tier]
  );
  const maxSeats = limitsResult.rows[0]?.max_seats || 1;

  await pool.query(
    `UPDATE subscriptions
     SET tier = $1,
         included_seats = $2,
         updated_at = NOW()
     WHERE organization_id = $3`,
    [tier, maxSeats, orgId]
  );
}

export async function updateSubscriptionStatus(
  orgId: string,
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'paused'
): Promise<void> {
  await pool.query(
    `UPDATE subscriptions
     SET status = $1, updated_at = NOW()
     WHERE organization_id = $2`,
    [status, orgId]
  );
}

// =============================================
// Activity Log
// =============================================

export async function getAdminActivityLog(
  page: number = 1,
  limit: number = 50,
  adminId?: string
): Promise<{ activities: AdminActivityItem[]; total: number }> {
  const offset = (page - 1) * limit;

  let whereClause = '';
  const params: (string | number)[] = [];

  if (adminId) {
    whereClause = 'WHERE al.admin_id = $1';
    params.push(adminId);
  }

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM admin_activity_log al ${whereClause}`,
    params
  );

  const result = await pool.query<AdminActivityItem>(
    `SELECT
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
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return {
    activities: result.rows,
    total: parseInt(countResult.rows[0].count),
  };
}

// =============================================
// System Health
// =============================================

export async function getSystemHealth(): Promise<{
  database: boolean;
  queueSize: number;
  activeAudits: number;
  failedAuditsToday: number;
}> {
  try {
    // Test database connection
    await pool.query('SELECT 1');

    const queueResult = await pool.query(
      `SELECT COUNT(*) FROM audit_jobs WHERE status IN ('pending', 'queued')`
    );

    const activeResult = await pool.query(
      `SELECT COUNT(*) FROM audit_jobs WHERE status = 'running'`
    );

    const failedResult = await pool.query(
      `SELECT COUNT(*) FROM audit_jobs WHERE status = 'failed' AND DATE(created_at) = CURRENT_DATE`
    );

    return {
      database: true,
      queueSize: parseInt(queueResult.rows[0].count),
      activeAudits: parseInt(activeResult.rows[0].count),
      failedAuditsToday: parseInt(failedResult.rows[0].count),
    };
  } catch {
    return {
      database: false,
      queueSize: 0,
      activeAudits: 0,
      failedAuditsToday: 0,
    };
  }
}
