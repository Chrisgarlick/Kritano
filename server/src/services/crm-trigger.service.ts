/**
 * CRM Trigger Service
 *
 * Automated behavior triggers that fire when users enter specific states.
 * Triggers are deduplicated: same (user_id, trigger_type) won't fire again
 * within 30 days unless the previous was dismissed.
 */

import { pool } from '../db/index.js';
import { sendTemplate } from './email-template.service.js';
import { getSetting } from './system-settings.service.js';

// =============================================
// Trigger → Template Mapping
// =============================================

const TRIGGER_TEMPLATE_MAP: Record<string, {
  slug: string;
  variables: (ctx: Record<string, unknown>) => Record<string, string>;
}> = {
  first_audit_complete: {
    slug: 'welcome_first_audit',
    variables: (ctx) => ({
      domain: String(ctx.domain || ''),
      topIssueCount: String(ctx.totalIssues || '0'),
    }),
  },
  stalled_verification: {
    slug: 'verify_domain_howto',
    variables: (ctx) => ({
      domain: String(ctx.domain || ''),
    }),
  },
  security_alert: {
    slug: 'security_alert_dorking',
    variables: (ctx) => ({
      domain: String(ctx.domain || ''),
      issueCount: '1',
    }),
  },
  upgrade_nudge: {
    slug: 'upgrade_hitting_limits',
    variables: (ctx) => ({
      limitHit: String(ctx.limitType || 'plan'),
    }),
  },
  low_aeo_score: {
    slug: 'aeo_improvement_guide',
    variables: (ctx) => ({
      domain: String(ctx.domain || ''),
      aeoScore: String(ctx.aeoScore || '0'),
    }),
  },
  low_content_score: {
    slug: 'content_improvement_guide',
    variables: (ctx) => ({
      domain: String(ctx.domain || ''),
      contentScore: String(ctx.contentScore || '0'),
    }),
  },
  churn_risk: {
    slug: 'churn_risk_winback',
    variables: (ctx) => ({
      domain: String(ctx.domain || ''),
    }),
  },
  score_improvement: {
    slug: 'score_celebration',
    variables: (ctx) => ({
      domain: String(ctx.domain || ''),
      category: String(ctx.category || ''),
      score: String(ctx.newScore || '0'),
    }),
  },
};

// Triggers that are already handled elsewhere — skip auto-send
const SKIP_AUTO_SEND: Set<string> = new Set([
  'domain_verified',
  'trial_started',
  'trial_expiring',
  'trial_expired',
]);

// =============================================
// Types
// =============================================

export type TriggerType =
  | 'stalled_verification'
  | 'domain_verified'
  | 'security_alert'
  | 'upgrade_nudge'
  | 'low_aeo_score'
  | 'low_content_score'
  | 'churn_risk'
  | 'score_improvement'
  | 'first_audit_complete'
  | 'trial_started'
  | 'trial_expiring'
  | 'trial_expired';

export type TriggerStatus = 'pending' | 'sent' | 'dismissed' | 'actioned';

export interface CrmTrigger {
  id: string;
  user_id: string;
  trigger_type: TriggerType;
  status: TriggerStatus;
  context: Record<string, unknown>;
  created_at: string;
  actioned_at: string | null;
  actioned_by: string | null;
  // Joined fields
  user_email?: string;
  user_first_name?: string;
  user_last_name?: string;
  user_lead_score?: number;
  user_lead_status?: string;
}

export interface TriggerFilters {
  status?: TriggerStatus;
  type?: TriggerType;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface TriggerStats {
  total: number;
  pending: number;
  sent: number;
  dismissed: number;
  actioned: number;
  by_type: Record<string, number>;
}

export type TriggerEvent =
  | 'audit_completed'
  | 'registration'
  | 'email_verified'
  | 'domain_verified'
  | 'member_added'
  | 'score_recalculated'
  | 'limit_hit';

// =============================================
// Trigger Evaluation
// =============================================

/**
 * Check and fire triggers for a user based on an event.
 * This is the main entry point — call after relevant events.
 */
export async function checkTriggers(
  userId: string,
  event: TriggerEvent,
  context: Record<string, unknown> = {}
): Promise<CrmTrigger[]> {
  const fired: CrmTrigger[] = [];

  switch (event) {
    case 'audit_completed': {
      // Check for first audit
      const auditCount = await pool.query(
        `SELECT COUNT(*) as count FROM audit_jobs WHERE user_id = $1 AND status = 'completed'`,
        [userId]
      );
      if (parseInt(auditCount.rows[0].count) === 1) {
        const trigger = await fireTrigger(userId, 'first_audit_complete', context);
        if (trigger) fired.push(trigger);
      }

      // Check for low AEO score
      if (context.aeoScore && (context.aeoScore as number) < 40) {
        const trigger = await fireTrigger(userId, 'low_aeo_score', context);
        if (trigger) fired.push(trigger);
      }

      // Check for low content score
      if (context.contentScore && (context.contentScore as number) < 40) {
        const trigger = await fireTrigger(userId, 'low_content_score', context);
        if (trigger) fired.push(trigger);
      }

      // Check for score improvement (20+ points in any category)
      if (context.previousScores && context.currentScores) {
        const prev = context.previousScores as Record<string, number>;
        const curr = context.currentScores as Record<string, number>;
        for (const category of Object.keys(curr)) {
          if (prev[category] !== undefined && curr[category] - prev[category] >= 20) {
            const trigger = await fireTrigger(userId, 'score_improvement', {
              ...context,
              category,
              oldScore: prev[category],
              newScore: curr[category],
            });
            if (trigger) fired.push(trigger);
            break; // Only one improvement trigger per audit
          }
        }
      }

      // Check for security alerts (google-dorking critical)
      if (context.securityFindings) {
        const findings = context.securityFindings as Array<{ ruleId: string; severity: string }>;
        const critical = findings.find(f => f.severity === 'critical');
        if (critical) {
          const trigger = await fireTrigger(userId, 'security_alert', {
            ...context,
            ruleId: critical.ruleId,
          });
          if (trigger) fired.push(trigger);
        }
      }
      break;
    }

    case 'score_recalculated': {
      // Check for churn risk
      if (context.status === 'churning') {
        const trigger = await fireTrigger(userId, 'churn_risk', context);
        if (trigger) fired.push(trigger);
      }
      break;
    }

    case 'limit_hit': {
      const trigger = await fireTrigger(userId, 'upgrade_nudge', context);
      if (trigger) fired.push(trigger);
      break;
    }

    case 'domain_verified': {
      const trigger = await fireTrigger(userId, 'domain_verified', context);
      if (trigger) fired.push(trigger);
      break;
    }

    case 'registration':
    case 'email_verified':
    case 'member_added':
      // These events trigger score recalculation but no direct triggers
      break;
  }

  return fired;
}

/**
 * Check for stalled verification triggers.
 * Called by batch job — checks for sites created 48h+ ago with unverified domains.
 */
export async function checkStalledVerifications(): Promise<CrmTrigger[]> {
  const result = await pool.query(
    `SELECT s.created_by as user_id, s.id as site_id, s.domain
     FROM sites s
     WHERE s.verified = false
       AND s.created_at < NOW() - INTERVAL '48 hours'
       AND s.created_by IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM crm_triggers ct
         WHERE ct.user_id = s.created_by
           AND ct.trigger_type = 'stalled_verification'
           AND ct.created_at > NOW() - INTERVAL '30 days'
           AND ct.status != 'dismissed'
       )`
  );

  const fired: CrmTrigger[] = [];
  for (const row of result.rows) {
    const trigger = await fireTrigger(row.user_id, 'stalled_verification', {
      siteId: row.site_id,
      domain: row.domain,
    });
    if (trigger) fired.push(trigger);
  }
  return fired;
}

// =============================================
// Fire & Deduplicate
// =============================================

/**
 * Fire a trigger with deduplication.
 * Returns null if a duplicate exists within 30 days.
 */
export async function fireTrigger(
  userId: string,
  triggerType: TriggerType,
  context: Record<string, unknown> = {}
): Promise<CrmTrigger | null> {
  // Deduplication check: same (user_id, trigger_type) within 30 days unless dismissed
  const existing = await pool.query(
    `SELECT id FROM crm_triggers
     WHERE user_id = $1
       AND trigger_type = $2
       AND created_at > NOW() - INTERVAL '30 days'
       AND status != 'dismissed'
     LIMIT 1`,
    [userId, triggerType]
  );

  if (existing.rows.length > 0) return null;

  const result = await pool.query(
    `INSERT INTO crm_triggers (user_id, trigger_type, context)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, triggerType, JSON.stringify(context)]
  );

  const trigger = result.rows[0];

  // Auto-send email if enabled for this trigger type
  if (trigger && !SKIP_AUTO_SEND.has(triggerType)) {
    try {
      await autoSendTriggerEmail(trigger, context);
    } catch (err) {
      console.error(`Auto-send failed for trigger ${triggerType} (user ${userId}):`, err);
      // Leave trigger as pending — can be retried manually
    }
  }

  return trigger;
}

/**
 * Attempt to auto-send the mapped email template for a trigger.
 * Checks the per-trigger setting and sends if enabled.
 */
async function autoSendTriggerEmail(
  trigger: CrmTrigger,
  context: Record<string, unknown>
): Promise<void> {
  const mapping = TRIGGER_TEMPLATE_MAP[trigger.trigger_type];
  if (!mapping) return;

  // Check per-trigger auto-send setting
  const settingKey = `trigger_auto_send_${trigger.trigger_type}`;
  const enabled = await getSetting(settingKey);
  if (enabled !== true && enabled !== 'true') return;

  // Get user info for sending
  const userResult = await pool.query(
    `SELECT id, email, first_name FROM users WHERE id = $1`,
    [trigger.user_id]
  );
  if (userResult.rows.length === 0) return;
  const user = userResult.rows[0];

  // Send the email
  await sendTemplate({
    templateSlug: mapping.slug,
    to: {
      userId: user.id,
      email: user.email,
      firstName: user.first_name || '',
    },
    variables: mapping.variables(context),
    sentBy: undefined,
  });

  // Mark trigger as sent
  await pool.query(
    `UPDATE crm_triggers SET status = 'sent', actioned_at = NOW(), actioned_by = 'system'
     WHERE id = $1`,
    [trigger.id]
  );

  console.log(`📧 Auto-sent ${mapping.slug} to ${user.email} (trigger: ${trigger.trigger_type})`);
}

// =============================================
// Admin Queries
// =============================================

/**
 * Get pending triggers with user info.
 */
export async function getPendingTriggers(filters: TriggerFilters): Promise<{ triggers: CrmTrigger[]; total: number }> {
  const {
    status = 'pending',
    type,
    userId,
    page = 1,
    limit = 50,
  } = filters;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (status) {
    conditions.push(`ct.status = $${paramIdx++}`);
    params.push(status);
  }
  if (type) {
    conditions.push(`ct.trigger_type = $${paramIdx++}`);
    params.push(type);
  }
  if (userId) {
    conditions.push(`ct.user_id = $${paramIdx++}`);
    params.push(userId);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const [dataResult, countResult] = await Promise.all([
    pool.query(
      `SELECT ct.*,
        u.email as user_email,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        u.lead_score as user_lead_score,
        u.lead_status as user_lead_status
      FROM crm_triggers ct
      JOIN users u ON ct.user_id = u.id
      ${where}
      ORDER BY ct.created_at DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*) FROM crm_triggers ct ${where}`,
      params
    ),
  ]);

  return {
    triggers: dataResult.rows,
    total: parseInt(countResult.rows[0].count) || 0,
  };
}

/**
 * Action a trigger (mark as sent, dismissed, or actioned).
 */
export async function actionTrigger(
  triggerId: string,
  adminId: string,
  action: 'sent' | 'dismissed' | 'actioned'
): Promise<CrmTrigger | null> {
  const result = await pool.query(
    `UPDATE crm_triggers
     SET status = $1, actioned_at = NOW(), actioned_by = $2
     WHERE id = $3
     RETURNING *`,
    [action, adminId, triggerId]
  );

  return result.rows[0] || null;
}

/**
 * Get trigger stats.
 */
export async function getTriggerStats(): Promise<TriggerStats> {
  const result = await pool.query(
    `SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'sent') as sent,
      COUNT(*) FILTER (WHERE status = 'dismissed') as dismissed,
      COUNT(*) FILTER (WHERE status = 'actioned') as actioned,
      trigger_type, COUNT(*) FILTER (WHERE status = 'pending') as type_pending
    FROM crm_triggers
    GROUP BY GROUPING SETS ((), (trigger_type))`
  );

  const totals = result.rows.find(r => r.trigger_type === null) || {
    total: 0, pending: 0, sent: 0, dismissed: 0, actioned: 0,
  };

  const byType: Record<string, number> = {};
  result.rows
    .filter(r => r.trigger_type !== null)
    .forEach(r => {
      byType[r.trigger_type] = parseInt(r.type_pending) || 0;
    });

  return {
    total: parseInt(totals.total) || 0,
    pending: parseInt(totals.pending) || 0,
    sent: parseInt(totals.sent) || 0,
    dismissed: parseInt(totals.dismissed) || 0,
    actioned: parseInt(totals.actioned) || 0,
    by_type: byType,
  };
}
