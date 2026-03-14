/**
 * Email Template Service
 *
 * Core template operations: CRUD, MJML compilation, variable substitution, sending.
 * Pipeline: JSON blocks → MJML string → HTML (cached) → variable substitution → Resend
 */

// @ts-ignore — mjml does not ship type declarations
import mjml from 'mjml';
import Handlebars from 'handlebars';
import { pool } from '../db/index.js';
import { resolveEmailBranding } from './email-branding.service.js';
import { canSendCategory, generateUnsubscribeToken } from './email-preference.service.js';
import type {
  EmailTemplate,
  EmailBlock,
  EmailBranding,
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplateFilters,
  SendTemplateParams,
  EmailSend,
  FONT_SIZE_MAP,
} from '../types/email-template.types.js';
import { EMAIL_BRAND_DEFAULTS, FONT_SIZE_MAP as fontSizeMap } from '../types/email-template.types.js';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// ========================================
// Template CRUD
// ========================================

export async function listTemplates(
  filters: TemplateFilters = {}
): Promise<{ templates: EmailTemplate[]; total: number }> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (filters.category) {
    conditions.push(`category = $${paramIndex++}`);
    values.push(filters.category);
  }
  if (filters.is_system !== undefined) {
    conditions.push(`is_system = $${paramIndex++}`);
    values.push(filters.is_system);
  }
  if (filters.is_active !== undefined) {
    conditions.push(`is_active = $${paramIndex++}`);
    values.push(filters.is_active);
  }
  if (filters.search) {
    conditions.push(`(name ILIKE $${paramIndex} OR slug ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
    values.push(`%${filters.search}%`);
    paramIndex++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 50, 100);
  const offset = (page - 1) * limit;

  const [dataResult, countResult] = await Promise.all([
    pool.query<EmailTemplate>(
      `SELECT * FROM email_templates ${where}
       ORDER BY is_system DESC, updated_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM email_templates ${where}`,
      values
    ),
  ]);

  return {
    templates: dataResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function getTemplate(id: string): Promise<EmailTemplate | null> {
  const result = await pool.query<EmailTemplate>(
    `SELECT * FROM email_templates WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function getTemplateBySlug(slug: string): Promise<EmailTemplate | null> {
  const result = await pool.query<EmailTemplate>(
    `SELECT * FROM email_templates WHERE slug = $1`,
    [slug]
  );
  return result.rows[0] || null;
}

export async function createTemplate(input: CreateTemplateInput): Promise<EmailTemplate> {
  // Compile on creation
  const branding = EMAIL_BRAND_DEFAULTS;
  const compiledHtml = compileBlocksToHtml(input.blocks, branding, input.preview_text || '');

  const result = await pool.query<EmailTemplate>(
    `INSERT INTO email_templates (
      slug, name, description, subject, preview_text, blocks, compiled_html, compiled_at,
      category, variables, is_system, branding_mode, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      input.slug,
      input.name,
      input.description || null,
      input.subject,
      input.preview_text || null,
      JSON.stringify(input.blocks),
      compiledHtml,
      input.category,
      JSON.stringify(input.variables || []),
      input.is_system || false,
      input.branding_mode || 'platform',
      input.created_by || null,
    ]
  );

  return result.rows[0];
}

export async function updateTemplate(id: string, input: UpdateTemplateInput): Promise<EmailTemplate | null> {
  const existing = await getTemplate(id);
  if (!existing) return null;

  const sets: string[] = [];
  const values: unknown[] = [id];
  let paramIndex = 2;

  if (input.name !== undefined) { sets.push(`name = $${paramIndex++}`); values.push(input.name); }
  if (input.description !== undefined) { sets.push(`description = $${paramIndex++}`); values.push(input.description); }
  if (input.subject !== undefined) { sets.push(`subject = $${paramIndex++}`); values.push(input.subject); }
  if (input.preview_text !== undefined) { sets.push(`preview_text = $${paramIndex++}`); values.push(input.preview_text); }
  if (input.category !== undefined) { sets.push(`category = $${paramIndex++}`); values.push(input.category); }
  if (input.variables !== undefined) { sets.push(`variables = $${paramIndex++}`); values.push(JSON.stringify(input.variables)); }
  if (input.is_active !== undefined) { sets.push(`is_active = $${paramIndex++}`); values.push(input.is_active); }
  if (input.branding_mode !== undefined) { sets.push(`branding_mode = $${paramIndex++}`); values.push(input.branding_mode); }

  if (input.blocks !== undefined) {
    sets.push(`blocks = $${paramIndex++}`);
    values.push(JSON.stringify(input.blocks));

    // Recompile
    const branding = EMAIL_BRAND_DEFAULTS;
    const compiledHtml = compileBlocksToHtml(input.blocks, branding, input.preview_text || existing.preview_text || '');
    sets.push(`compiled_html = $${paramIndex++}`);
    values.push(compiledHtml);
    sets.push(`compiled_at = NOW()`);
  }

  sets.push(`updated_at = NOW()`);

  if (sets.length === 1) return existing; // only updated_at

  const result = await pool.query<EmailTemplate>(
    `UPDATE email_templates SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    values
  );

  return result.rows[0] || null;
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const template = await getTemplate(id);
  if (!template) return false;
  if (template.is_system) {
    throw new Error('Cannot delete system templates');
  }

  const result = await pool.query(
    `DELETE FROM email_templates WHERE id = $1 AND is_system = false`,
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function duplicateTemplate(
  id: string,
  newSlug: string,
  newName: string
): Promise<EmailTemplate | null> {
  const existing = await getTemplate(id);
  if (!existing) return null;

  return createTemplate({
    slug: newSlug,
    name: newName,
    description: existing.description || undefined,
    subject: existing.subject,
    preview_text: existing.preview_text || undefined,
    blocks: existing.blocks,
    category: existing.category,
    variables: existing.variables,
    is_system: false,
    branding_mode: existing.branding_mode,
  });
}

// ========================================
// MJML Compilation
// ========================================

/**
 * Compile JSON blocks to HTML via MJML.
 */
export function compileBlocksToHtml(
  blocks: EmailBlock[],
  branding: EmailBranding,
  previewText: string
): string {
  const mjmlBody = blocks.map((block) => blockToMjml(block, branding)).join('\n');

  const mjmlString = `
<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="Outfit, 'Helvetica Neue', Arial, sans-serif" />
      <mj-text font-size="16px" color="${branding.bodyTextColor}" line-height="1.6" />
      <mj-button background-color="${branding.buttonColor}" color="${branding.buttonTextColor}"
                 border-radius="6px" font-size="16px" font-weight="600"
                 inner-padding="12px 30px" />
      <mj-divider border-color="${branding.dividerColor}" border-width="1px" />
    </mj-attributes>
    ${previewText ? `<mj-preview>${escapeXml(previewText)}</mj-preview>` : ''}
    <mj-style>
      .score-good { color: #22c55e; font-weight: 600; }
      .score-fair { color: #eab308; font-weight: 600; }
      .score-poor { color: #ef4444; font-weight: 600; }
    </mj-style>
  </mj-head>
  <mj-body background-color="${branding.bodyBackground}" width="600px">
    ${mjmlBody}
  </mj-body>
</mjml>`;

  const result = mjml(mjmlString, {
    validationLevel: 'soft',
    minify: false,
  });

  if (result.errors && result.errors.length > 0) {
    console.warn('MJML compilation warnings:', result.errors.map((e: { message: string }) => e.message));
  }

  return result.html;
}

/**
 * Convert a single block to MJML markup.
 */
function blockToMjml(block: EmailBlock, branding: EmailBranding): string {
  switch (block.type) {
    case 'header': {
      const bg = block.backgroundColor || branding.headerBackground;
      const name = block.companyName || branding.companyName;
      const logoMjml = (block.logoUrl || branding.logoUrl)
        ? `<mj-image src="${escapeXml(block.logoUrl || branding.logoUrl!)}" alt="${escapeXml(name)}" width="150px" />`
        : `<mj-text align="center" font-size="24px" font-weight="700" color="${branding.headerTextColor}">${escapeXml(name)}</mj-text>`;
      return `
    <mj-section background-color="${bg}" padding="20px 25px">
      <mj-column>
        ${logoMjml}
      </mj-column>
    </mj-section>`;
    }

    case 'hero_image': {
      const width = block.width ? `${block.width}px` : '600px';
      const href = block.href ? `href="${escapeXml(block.href)}"` : '';
      return `
    <mj-section padding="0">
      <mj-column>
        <mj-image src="${escapeXml(block.src)}" alt="${escapeXml(block.alt)}" width="${width}" ${href} fluid-on-mobile="true" />
      </mj-column>
    </mj-section>`;
    }

    case 'text': {
      const fontSize = fontSizeMap[block.fontSize || 'md'] || '16px';
      const color = block.color || branding.bodyTextColor;
      const align = block.align || 'left';
      const padding = block.padding || '10px 25px';
      return `
    <mj-section padding="0">
      <mj-column>
        <mj-text font-size="${fontSize}" color="${color}" align="${align}" padding="${padding}">
          ${block.content}
        </mj-text>
      </mj-column>
    </mj-section>`;
    }

    case 'button': {
      const bg = block.backgroundColor || branding.buttonColor;
      const color = block.color || branding.buttonTextColor;
      const align = block.align || 'center';
      const radius = block.borderRadius || '6px';
      return `
    <mj-section padding="10px 25px">
      <mj-column>
        <mj-button background-color="${bg}" color="${color}" border-radius="${radius}" align="${align}" href="${escapeXml(block.href)}">
          ${escapeXml(block.label)}
        </mj-button>
      </mj-column>
    </mj-section>`;
    }

    case 'two_column': {
      const ratioMap: Record<string, [string, string]> = {
        '50:50': ['50%', '50%'],
        '30:70': ['30%', '70%'],
        '70:30': ['70%', '30%'],
      };
      const [leftW, rightW] = ratioMap[block.ratio || '50:50'] || ['50%', '50%'];
      const leftContent = block.left.map(b => blockToMjml(b, branding)).join('\n');
      const rightContent = block.right.map(b => blockToMjml(b, branding)).join('\n');
      return `
    <mj-section padding="10px 25px">
      <mj-column width="${leftW}">
        ${leftContent}
      </mj-column>
      <mj-column width="${rightW}">
        ${rightContent}
      </mj-column>
    </mj-section>`;
    }

    case 'divider': {
      const color = block.color || branding.dividerColor;
      const width = block.width || '100%';
      const padding = block.padding || '10px 25px';
      return `
    <mj-section padding="0">
      <mj-column>
        <mj-divider border-color="${color}" border-width="1px" width="${width}" padding="${padding}" />
      </mj-column>
    </mj-section>`;
    }

    case 'spacer': {
      const height = block.height || '20px';
      return `
    <mj-section padding="0">
      <mj-column>
        <mj-spacer height="${height}" />
      </mj-column>
    </mj-section>`;
    }

    case 'score_table':
      // Dynamic block — placeholder that gets replaced at send time
      return `
    <mj-section padding="10px 25px">
      <mj-column>
        <mj-text><!-- SCORE_TABLE_PLACEHOLDER --></mj-text>
      </mj-column>
    </mj-section>`;

    case 'issues_summary':
      return `
    <mj-section padding="10px 25px">
      <mj-column>
        <mj-text><!-- ISSUES_SUMMARY_PLACEHOLDER --></mj-text>
      </mj-column>
    </mj-section>`;

    case 'footer': {
      const text = block.text || branding.footerText;
      const unsub = block.includeUnsubscribe
        ? `<br/><a href="{{unsubscribeUrl}}" style="color: ${branding.footerTextColor}; text-decoration: underline;">Unsubscribe</a> | <a href="{{preferencesUrl}}" style="color: ${branding.footerTextColor}; text-decoration: underline;">Email Preferences</a>`
        : '';
      return `
    <mj-section background-color="${branding.footerBackground}" padding="20px 25px">
      <mj-column>
        <mj-text align="center" font-size="12px" color="${branding.footerTextColor}">
          ${escapeXml(text)}${unsub}
        </mj-text>
      </mj-column>
    </mj-section>`;
    }

    default:
      return '';
  }
}

// ========================================
// Variable Substitution
// ========================================

/**
 * Replace {{variables}} in compiled HTML using Handlebars.
 */
export function substituteVariables(
  html: string,
  variables: Record<string, string>
): string {
  const template = Handlebars.compile(html, { noEscape: false });
  return template(variables);
}

/**
 * Build the system variables that are always available.
 */
function buildSystemVariables(
  userId: string,
  email: string,
  firstName: string
): Record<string, string> {
  const unsubscribeToken = generateUnsubscribeToken(userId);
  return {
    firstName,
    email,
    appUrl: APP_URL,
    unsubscribeUrl: `${APP_URL}/email/unsubscribe?token=${unsubscribeToken}`,
    preferencesUrl: `${APP_URL}/settings/notifications`,
    currentYear: new Date().getFullYear().toString(),
  };
}

// ========================================
// Preview
// ========================================

/**
 * Render a template preview with sample variables.
 */
export async function renderPreview(
  templateId: string,
  sampleVariables?: Record<string, string>
): Promise<string | null> {
  const template = await getTemplate(templateId);
  if (!template) return null;

  let html = template.compiled_html;

  // Recompile if stale
  if (!html || !template.compiled_at || new Date(template.updated_at) > new Date(template.compiled_at)) {
    html = compileBlocksToHtml(template.blocks, EMAIL_BRAND_DEFAULTS, template.preview_text || '');
  }

  // Substitute with sample data
  const variables: Record<string, string> = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    companyName: 'Example Corp',
    appUrl: APP_URL,
    unsubscribeUrl: '#',
    preferencesUrl: '#',
    currentYear: new Date().getFullYear().toString(),
    domain: 'example.com',
    auditId: '00000000-0000-0000-0000-000000000000',
    auditUrl: `${APP_URL}/audits/00000000-0000-0000-0000-000000000000`,
    targetUrl: 'https://example.com',
    statusText: 'Completed',
    statusMessage: 'completed successfully',
    totalIssues: '42',
    criticalIssues: '3',
    seoScore: '78',
    accessibilityScore: '85',
    securityScore: '92',
    performanceScore: '64',
    contentScore: '71',
    structuredDataScore: '55',
    verifyUrl: `${APP_URL}/verify-email?token=sample`,
    resetUrl: `${APP_URL}/reset-password?token=sample`,
    ...sampleVariables,
  };

  // Replace dynamic block placeholders with sample data
  html = renderDynamicBlocks(html, {
    scores: {
      seo: 78, accessibility: 85, security: 92,
      performance: 64, content: 71, structured_data: 55,
    },
    totalIssues: 42,
    criticalIssues: 3,
  });

  return substituteVariables(html, variables);
}

// ========================================
// Sending
// ========================================

/**
 * Send an email using a template. This is the main entry point for sending.
 */
export async function sendTemplate(params: SendTemplateParams): Promise<string> {
  const { templateSlug, to, variables, sentBy, campaignId, siteId } = params;

  // 1. Load template
  const template = await getTemplateBySlug(templateSlug);
  if (!template) {
    throw new Error(`Email template not found: ${templateSlug}`);
  }
  if (!template.is_active) {
    throw new Error(`Email template is inactive: ${templateSlug}`);
  }

  // 2. Check preferences
  const canSend = await canSendCategory(to.userId, template.category);
  if (!canSend) {
    // Log as skipped but don't throw
    console.log(`Email skipped (preferences): ${templateSlug} → ${to.email}`);
    // Still create a send record for tracking
    const skipResult = await pool.query<{ id: string }>(
      `INSERT INTO email_sends (template_id, campaign_id, user_id, sent_by, to_email, subject, variables, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'failed')
       RETURNING id`,
      [template.id, campaignId || null, to.userId, sentBy || null, to.email, template.subject, JSON.stringify(variables)]
    );
    return skipResult.rows[0].id;
  }

  // 3. Resolve branding
  const branding = await resolveEmailBranding(siteId || null, to.userId);

  // 4. Compile if needed
  let html = template.compiled_html;
  if (!html || !template.compiled_at || new Date(template.updated_at) > new Date(template.compiled_at)) {
    html = compileBlocksToHtml(template.blocks, branding, template.preview_text || '');
    // Cache
    await pool.query(
      `UPDATE email_templates SET compiled_html = $1, compiled_at = NOW() WHERE id = $2`,
      [html, template.id]
    );
  }

  // 5. Build variables
  const systemVars = buildSystemVariables(to.userId, to.email, to.firstName);
  const allVars = { ...systemVars, ...variables };

  // 6. Render dynamic blocks if present
  if (allVars.seoScore || allVars.totalIssues) {
    html = renderDynamicBlocks(html, {
      scores: {
        seo: parseInt(allVars.seoScore || '0'),
        accessibility: parseInt(allVars.accessibilityScore || '0'),
        security: parseInt(allVars.securityScore || '0'),
        performance: parseInt(allVars.performanceScore || '0'),
        content: parseInt(allVars.contentScore || '0'),
        structured_data: parseInt(allVars.structuredDataScore || '0'),
      },
      totalIssues: parseInt(allVars.totalIssues || '0'),
      criticalIssues: parseInt(allVars.criticalIssues || '0'),
    });
  }

  // 7. Substitute variables
  const resolvedSubject = substituteVariables(template.subject, allVars);
  const resolvedHtml = substituteVariables(html, allVars);

  // 8. Create send record
  const sendResult = await pool.query<{ id: string }>(
    `INSERT INTO email_sends (template_id, campaign_id, user_id, sent_by, to_email, subject, variables, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'queued')
     RETURNING id`,
    [template.id, campaignId || null, to.userId, sentBy || null, to.email, resolvedSubject, JSON.stringify(allVars)]
  );
  const sendId = sendResult.rows[0].id;

  // 9. Send via SMTP (Mailpit) / Resend / Console
  try {
    const fromAddress = process.env.EMAIL_FROM || 'PagePulser <noreply@pagepulser.com>';
    const smtpHost = process.env.SMTP_HOST;

    if (smtpHost) {
      // SMTP transport (Mailpit for dev, or any SMTP server)
      const nodemailer = await import('nodemailer');
      const transport = nodemailer.default.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || '1025', 10),
        secure: false,
        auth: process.env.SMTP_USER ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || '',
        } : undefined,
      });

      const info = await transport.sendMail({
        from: fromAddress,
        to: to.email,
        subject: resolvedSubject,
        html: resolvedHtml,
      });

      await pool.query(
        `UPDATE email_sends SET status = 'sent', resend_message_id = $2, sent_at = NOW() WHERE id = $1`,
        [sendId, info.messageId || null]
      );
      console.log(`📧 Email sent via SMTP (${templateSlug}) to ${to.email}: ${info.messageId}`);

    } else {
      const { Resend } = await import('resend');
      const apiKey = process.env.RESEND_API_KEY;

      if (apiKey && apiKey !== 're_your_api_key_here') {
        const resend = new Resend(apiKey);

        // Build headers for non-transactional emails
        const headers: Record<string, string> = {};
        if (template.category !== 'transactional' && template.category !== 'security') {
          headers['List-Unsubscribe'] = `<${systemVars.unsubscribeUrl}>`;
          headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
        }

        const result = await resend.emails.send({
          from: fromAddress,
          to: to.email,
          subject: resolvedSubject,
          html: resolvedHtml,
          headers: Object.keys(headers).length > 0 ? headers : undefined,
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        await pool.query(
          `UPDATE email_sends SET status = 'sent', resend_message_id = $2, sent_at = NOW() WHERE id = $1`,
          [sendId, result.data?.id || null]
        );
      } else {
        // Dev mode — console logging
        console.log(`\n📧 EMAIL (Template: ${templateSlug})`);
        console.log(`To: ${to.email} | Subject: ${resolvedSubject}`);
        const urlMatch = resolvedHtml.match(/href="([^"#]+)"/);
        if (urlMatch) console.log(`🔗 Action URL: ${urlMatch[1]}`);
        console.log('');

        await pool.query(
          `UPDATE email_sends SET status = 'sent', sent_at = NOW() WHERE id = $1`,
          [sendId]
        );
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await pool.query(
      `UPDATE email_sends SET status = 'failed', error_message = $2 WHERE id = $1`,
      [sendId, errorMessage]
    );
    console.error(`Email send failed (${templateSlug} → ${to.email}):`, errorMessage);
    throw error;
  }

  return sendId;
}

// ========================================
// Dynamic Block Rendering
// ========================================

interface DynamicBlockData {
  scores: {
    seo: number;
    accessibility: number;
    security: number;
    performance: number;
    content: number;
    structured_data: number;
  };
  totalIssues: number;
  criticalIssues: number;
}

function renderDynamicBlocks(html: string, data: DynamicBlockData): string {
  // Replace score table placeholder
  html = html.replace(
    /<!-- SCORE_TABLE_PLACEHOLDER -->/g,
    renderScoreTable(data.scores)
  );

  // Replace issues summary placeholder
  html = html.replace(
    /<!-- ISSUES_SUMMARY_PLACEHOLDER -->/g,
    renderIssuesSummary(data.totalIssues, data.criticalIssues)
  );

  return html;
}

function renderScoreTable(scores: DynamicBlockData['scores']): string {
  const rows = [
    ['SEO', scores.seo],
    ['Accessibility', scores.accessibility],
    ['Security', scores.security],
    ['Performance', scores.performance],
    ['Content', scores.content],
    ['Structured Data', scores.structured_data],
  ] as const;

  const scoreClass = (s: number) => s >= 80 ? 'score-good' : s >= 50 ? 'score-fair' : 'score-poor';
  const scoreColor = (s: number) => s >= 80 ? '#22c55e' : s >= 50 ? '#eab308' : '#ef4444';

  return `
    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 8px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding: 8px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Category</th>
            <th style="padding: 8px 12px; text-align: right; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">Score</th>
          </tr>
        </thead>
        <tbody>
          ${rows.filter(([, s]) => s > 0).map(([label, score]) => `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f3f4f6;">${label}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600; color: ${scoreColor(score)};">${score}/100</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function renderIssuesSummary(totalIssues: number, criticalIssues: number): string {
  return `
    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 8px 0; text-align: center;">
      <div style="font-size: 32px; font-weight: 700; color: #334155;">${totalIssues}</div>
      <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">issues found</div>
      ${criticalIssues > 0 ? `<div style="margin-top: 8px; display: inline-block; background: #fef2f2; color: #ef4444; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">${criticalIssues} critical</div>` : ''}
    </div>`;
}

// ========================================
// Utility
// ========================================

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
