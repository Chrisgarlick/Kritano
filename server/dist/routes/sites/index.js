"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_js_1 = require("../../db/index.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const site_middleware_js_1 = require("../../middleware/site.middleware.js");
const site_service_js_1 = require("../../services/site.service.js");
const site_sharing_service_js_1 = require("../../services/site-sharing.service.js");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_js_1.authenticate);
// =============================================
// SITE CRUD (User-centric, no org prefix)
// =============================================
/**
 * GET /api/sites
 * List all sites accessible by user (owned + shared)
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const [sites, usage] = await Promise.all([
            (0, site_service_js_1.getUserSites)(userId),
            (0, site_service_js_1.getUserSiteUsage)(userId),
        ]);
        // Transform to camelCase for API
        const transformed = sites.map(s => ({
            id: s.site.id,
            name: s.site.name,
            domain: s.site.domain,
            description: s.site.description,
            logoUrl: s.site.logo_url,
            verified: s.site.verified,
            badgeEnabled: s.site.badge_enabled,
            settings: s.site.settings,
            createdAt: s.site.created_at,
            updatedAt: s.site.updated_at,
            permission: s.permission,
            isOwner: s.permission === 'owner',
            ownerTier: s.ownerTier,
            sharedBy: s.sharedBy,
            sharedAt: s.sharedAt,
            stats: {
                totalAudits: s.site.stats.totalAudits,
                lastAuditAt: s.site.stats.lastAuditAt,
                latestScores: s.site.stats.latestScores,
                urlCount: s.site.stats.urlCount,
            },
        }));
        res.json({
            sites: transformed,
            usage: {
                sites: usage.sites,
                maxSites: usage.maxSites,
                canAddMore: usage.canAddMore,
            },
        });
    }
    catch (error) {
        console.error('Get sites error:', error);
        res.status(500).json({ error: 'Failed to get sites' });
    }
});
/**
 * POST /api/sites
 * Create a new site
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, domain, description } = req.body;
        if (!name || !domain) {
            res.status(400).json({ error: 'Name and domain are required' });
            return;
        }
        const site = await (0, site_service_js_1.createSite)(userId, { name, domain, description });
        res.status(201).json({
            site: {
                id: site.id,
                name: site.name,
                domain: site.domain,
                description: site.description,
                logoUrl: site.logo_url,
                verified: site.verified,
                settings: site.settings,
                createdAt: site.created_at,
                updatedAt: site.updated_at,
            },
        });
    }
    catch (error) {
        console.error('Create site error:', error);
        const message = error instanceof Error ? error.message : 'Failed to create site';
        res.status(400).json({ error: message });
    }
});
/**
 * GET /api/sites/:siteId
 * Get a single site with full details
 */
router.get('/:siteId', site_middleware_js_1.loadSite, async (req, res) => {
    try {
        const siteReq = req;
        const siteId = siteReq.siteId;
        const site = await (0, site_service_js_1.getSiteWithStats)(siteId);
        if (!site) {
            res.status(404).json({ error: 'Site not found' });
            return;
        }
        // Get additional data
        const [scoreHistory, ownerTierLimits] = await Promise.all([
            (0, site_service_js_1.getSiteScoreHistory)(siteId, 30),
            (0, site_service_js_1.getSiteOwnerTierLimits)(siteId),
        ]);
        const ownerTier = ownerTierLimits?.tier || 'free';
        res.json({
            site: {
                id: site.id,
                name: site.name,
                domain: site.domain,
                description: site.description,
                logoUrl: site.logo_url,
                verified: site.verified,
                verificationToken: siteReq.sitePermission === 'owner' || siteReq.sitePermission === 'admin'
                    ? site.verification_token
                    : undefined,
                verifiedAt: site.verified_at,
                badgeEnabled: site.badge_enabled,
                settings: site.settings,
                createdAt: site.created_at,
                updatedAt: site.updated_at,
                stats: {
                    totalAudits: site.stats.totalAudits,
                    lastAuditAt: site.stats.lastAuditAt,
                    latestScores: site.stats.latestScores,
                    urlCount: site.stats.urlCount,
                },
            },
            permission: siteReq.sitePermission,
            isOwner: siteReq.sitePermission === 'owner',
            ownerTier,
            scoreHistory: scoreHistory.map(s => ({
                date: s.date,
                seo: s.seo,
                accessibility: s.accessibility,
                security: s.security,
                performance: s.performance,
                content: s.content,
                structuredData: s.structuredData,
                cqs: s.cqs,
            })),
        });
    }
    catch (error) {
        console.error('Get site error:', error);
        res.status(500).json({ error: 'Failed to get site' });
    }
});
/**
 * PATCH /api/sites/:siteId
 * Update a site
 */
router.patch('/:siteId', site_middleware_js_1.loadSite, (0, site_middleware_js_1.requireMinPermission)('editor'), async (req, res) => {
    try {
        const siteReq = req;
        const siteId = siteReq.siteId;
        const { name, description, logoUrl, settings } = req.body;
        const site = await (0, site_service_js_1.updateSite)(siteId, {
            name,
            description,
            logo_url: logoUrl,
            settings,
        });
        res.json({
            site: {
                id: site.id,
                name: site.name,
                domain: site.domain,
                description: site.description,
                logoUrl: site.logo_url,
                verified: site.verified,
                settings: site.settings,
                createdAt: site.created_at,
                updatedAt: site.updated_at,
            },
        });
    }
    catch (error) {
        console.error('Update site error:', error);
        const message = error instanceof Error ? error.message : 'Failed to update site';
        res.status(400).json({ error: message });
    }
});
/**
 * DELETE /api/sites/:siteId
 * Delete a site (owner only)
 */
router.delete('/:siteId', site_middleware_js_1.loadSite, site_middleware_js_1.requireSiteOwner, async (req, res) => {
    try {
        const siteReq = req;
        const siteId = siteReq.siteId;
        await (0, site_service_js_1.deleteSite)(siteId);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Delete site error:', error);
        res.status(500).json({ error: 'Failed to delete site' });
    }
});
// =============================================
// SITE AUDITS
// =============================================
/**
 * GET /api/sites/:siteId/audits
 * Get audits for a site
 */
router.get('/:siteId/audits', site_middleware_js_1.loadSite, async (req, res) => {
    try {
        const siteReq = req;
        const siteId = siteReq.siteId;
        const { limit = '20', offset = '0', status } = req.query;
        const { audits, total } = await (0, site_service_js_1.getSiteAudits)(siteId, {
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            status: status,
        });
        res.json({
            audits: audits.map((a) => ({
                id: a.id,
                targetUrl: a.target_url,
                targetDomain: a.target_domain,
                status: a.status,
                pagesFound: a.pages_found,
                pagesCrawled: a.pages_crawled,
                pagesAudited: a.pages_audited,
                totalIssues: a.total_issues,
                criticalIssues: a.critical_issues,
                seoScore: a.seo_score,
                accessibilityScore: a.accessibility_score,
                securityScore: a.security_score,
                performanceScore: a.performance_score,
                startedAt: a.started_at,
                completedAt: a.completed_at,
                createdAt: a.created_at,
                wcagLevel: a.wcag_level,
                checkAccessibility: a.check_accessibility,
            })),
            pagination: {
                total,
                limit: parseInt(limit, 10),
                offset: parseInt(offset, 10),
            },
        });
    }
    catch (error) {
        console.error('Get site audits error:', error);
        res.status(500).json({ error: 'Failed to get audits' });
    }
});
// =============================================
// SITE URLs
// =============================================
/**
 * GET /api/sites/:siteId/urls
 * Get URLs for a site (with search and pagination)
 */
router.get('/:siteId/urls', site_middleware_js_1.loadSite, async (req, res) => {
    try {
        const siteReq = req;
        const siteId = siteReq.siteId;
        const { search, limit = '50', offset = '0', sortBy, sortOrder } = req.query;
        const { urls, total } = await (0, site_service_js_1.getSiteUrls)(siteId, {
            search: search,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            sortBy: sortBy,
            sortOrder: sortOrder,
        });
        res.json({
            urls: urls.map(u => ({
                id: u.id,
                url: u.url,
                urlPath: u.url_path,
                source: u.source,
                lastAuditedAt: u.last_audited_at,
                lastAuditId: u.last_audit_id,
                lastSeoScore: u.last_seo_score,
                lastAccessibilityScore: u.last_accessibility_score,
                lastSecurityScore: u.last_security_score,
                lastPerformanceScore: u.last_performance_score,
                lastContentScore: u.last_content_score,
                auditCount: u.audit_count,
                sitemapPriority: u.sitemap_priority,
                sitemapChangefreq: u.sitemap_changefreq,
                createdAt: u.created_at,
            })),
            pagination: {
                total,
                limit: parseInt(limit, 10),
                offset: parseInt(offset, 10),
            },
        });
    }
    catch (error) {
        console.error('Get site URLs error:', error);
        res.status(500).json({ error: 'Failed to get URLs' });
    }
});
/**
 * POST /api/sites/:siteId/urls
 * Add a URL manually
 */
router.post('/:siteId/urls', site_middleware_js_1.loadSite, (0, site_middleware_js_1.requireMinPermission)('editor'), async (req, res) => {
    try {
        const siteReq = req;
        const siteId = siteReq.siteId;
        const { url } = req.body;
        if (!url) {
            res.status(400).json({ error: 'URL is required' });
            return;
        }
        const newUrl = await (0, site_service_js_1.addUrl)(siteId, url);
        res.status(201).json({
            url: {
                id: newUrl.id,
                url: newUrl.url,
                urlPath: newUrl.url_path,
                source: newUrl.source,
                createdAt: newUrl.created_at,
            },
        });
    }
    catch (error) {
        console.error('Add URL error:', error);
        const message = error instanceof Error ? error.message : 'Failed to add URL';
        res.status(400).json({ error: message });
    }
});
/**
 * GET /api/sites/:siteId/urls/:urlId
 * Get a specific URL
 */
router.get('/:siteId/urls/:urlId', site_middleware_js_1.loadSite, async (req, res) => {
    try {
        const siteReq = req;
        const { urlId } = req.params;
        const url = await (0, site_service_js_1.getUrlById)(urlId);
        if (!url || url.site_id !== siteReq.siteId) {
            res.status(404).json({ error: 'URL not found' });
            return;
        }
        res.json({
            url: {
                id: url.id,
                url: url.url,
                urlPath: url.url_path,
                source: url.source,
                lastAuditedAt: url.last_audited_at,
                lastAuditId: url.last_audit_id,
                lastSeoScore: url.last_seo_score,
                lastAccessibilityScore: url.last_accessibility_score,
                lastSecurityScore: url.last_security_score,
                lastPerformanceScore: url.last_performance_score,
                auditCount: url.audit_count,
                sitemapPriority: url.sitemap_priority,
                sitemapChangefreq: url.sitemap_changefreq,
                createdAt: url.created_at,
                updatedAt: url.updated_at,
            },
        });
    }
    catch (error) {
        console.error('Get URL error:', error);
        res.status(500).json({ error: 'Failed to get URL' });
    }
});
/**
 * GET /api/sites/:siteId/urls/:urlId/audits
 * Get audits for a specific URL
 */
router.get('/:siteId/urls/:urlId/audits', site_middleware_js_1.loadSite, async (req, res) => {
    try {
        const siteReq = req;
        const { urlId } = req.params;
        const { limit = '20', offset = '0' } = req.query;
        // Verify URL belongs to this site
        const url = await (0, site_service_js_1.getUrlById)(urlId);
        if (!url || url.site_id !== siteReq.siteId) {
            res.status(404).json({ error: 'URL not found' });
            return;
        }
        const { audits, total } = await (0, site_service_js_1.getUrlAudits)(urlId, {
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
        });
        res.json({
            audits: audits.map((a) => ({
                id: a.id,
                targetUrl: a.target_url,
                status: a.status,
                seoScore: a.seo_score,
                accessibilityScore: a.accessibility_score,
                securityScore: a.security_score,
                performanceScore: a.performance_score,
                completedAt: a.completed_at,
                createdAt: a.created_at,
            })),
            pagination: {
                total,
                limit: parseInt(limit, 10),
                offset: parseInt(offset, 10),
            },
        });
    }
    catch (error) {
        console.error('Get URL audits error:', error);
        res.status(500).json({ error: 'Failed to get URL audits' });
    }
});
/**
 * GET /api/sites/:siteId/urls/count
 * Get count of URLs for a site
 */
router.get('/:siteId/urls-count', site_middleware_js_1.loadSite, async (req, res) => {
    try {
        const siteReq = req;
        const siteId = siteReq.siteId;
        const count = await (0, site_service_js_1.getUrlCount)(siteId);
        res.json({ count });
    }
    catch (error) {
        console.error('Get URL count error:', error);
        res.status(500).json({ error: 'Failed to get count' });
    }
});
/**
 * POST /api/sites/:siteId/discover-urls
 * Discover URLs from sitemap
 */
router.post('/:siteId/discover-urls', site_middleware_js_1.loadSite, (0, site_middleware_js_1.requireMinPermission)('editor'), async (req, res) => {
    try {
        const siteReq = req;
        const siteId = siteReq.siteId;
        const site = siteReq.site;
        const { urlsDiscovered, errors } = await (0, site_service_js_1.discoverSitemapUrls)(siteId, site.domain);
        res.json({
            message: `Discovered ${urlsDiscovered} URLs from sitemap`,
            urlsDiscovered,
            errors: errors.length > 0 ? errors : undefined,
        });
    }
    catch (error) {
        console.error('Discover URLs error:', error);
        res.status(500).json({ error: 'Failed to discover URLs' });
    }
});
// =============================================
// SITE SHARING
// =============================================
/**
 * GET /api/sites/:siteId/shares
 * Get all users who have access to this site
 */
router.get('/:siteId/shares', site_middleware_js_1.loadSite, (0, site_middleware_js_1.requireSitePermission)('admin'), async (req, res) => {
    try {
        const siteReq = req;
        const siteId = siteReq.siteId;
        const [shares, tierLimits, pendingInvitations] = await Promise.all([
            (0, site_sharing_service_js_1.getSiteShares)(siteId),
            (0, site_service_js_1.getSiteOwnerTierLimits)(siteId),
            (0, site_sharing_service_js_1.getSiteInvitations)(siteId),
        ]);
        const maxMembers = tierLimits?.max_members_per_site;
        const pendingCount = pendingInvitations.filter(i => i.status === 'pending').length;
        const usedMembers = shares.length + pendingCount;
        res.json({
            shares: shares.map(s => ({
                id: s.id,
                userId: s.user_id,
                email: s.user_email,
                name: s.user_name,
                permission: s.permission,
                invitedAt: s.invited_at,
                acceptedAt: s.accepted_at,
            })),
            memberLimit: {
                used: usedMembers,
                max: maxMembers ?? null,
                tier: tierLimits?.tier || 'free',
            },
        });
    }
    catch (error) {
        console.error('Get shares error:', error);
        res.status(500).json({ error: 'Failed to get shares' });
    }
});
/**
 * POST /api/sites/:siteId/shares
 * Share site with a user by email
 */
router.post('/:siteId/shares', site_middleware_js_1.loadSite, (0, site_middleware_js_1.requireSitePermission)('admin'), async (req, res) => {
    try {
        const siteReq = req;
        const siteId = siteReq.siteId;
        const userId = req.user.id;
        const { email, permission = 'viewer' } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }
        if (!['viewer', 'editor', 'admin'].includes(permission)) {
            res.status(400).json({ error: 'Invalid permission level' });
            return;
        }
        const result = await (0, site_sharing_service_js_1.shareByEmail)(siteId, email, permission, userId);
        if (result.type === 'share') {
            const share = result.data;
            res.status(201).json({
                type: 'share',
                share: {
                    id: share.id,
                    userId: share.user_id,
                    permission: share.permission,
                },
                message: 'User has been granted access',
            });
        }
        else {
            const invitation = result.data;
            res.status(201).json({
                type: 'invitation',
                invitation: {
                    id: invitation.id,
                    email: invitation.email,
                    permission: invitation.permission,
                    expiresAt: invitation.expires_at,
                },
                message: 'Invitation sent',
            });
        }
    }
    catch (error) {
        console.error('Share site error:', error);
        const message = error instanceof Error ? error.message : 'Failed to share site';
        const isMemberLimit = message.includes('Member limit');
        res.status(isMemberLimit ? 403 : 400).json({
            error: message,
            code: isMemberLimit ? 'MEMBER_LIMIT_REACHED' : undefined,
        });
    }
});
/**
 * PATCH /api/sites/:siteId/shares/:shareId
 * Update share permission
 */
router.patch('/:siteId/shares/:shareId', site_middleware_js_1.loadSite, (0, site_middleware_js_1.requireSitePermission)('admin'), async (req, res) => {
    try {
        const { shareId } = req.params;
        const { permission } = req.body;
        if (!['viewer', 'editor', 'admin'].includes(permission)) {
            res.status(400).json({ error: 'Invalid permission level' });
            return;
        }
        const share = await (0, site_sharing_service_js_1.updateSharePermission)(shareId, permission);
        res.json({
            share: {
                id: share.id,
                userId: share.user_id,
                permission: share.permission,
            },
        });
    }
    catch (error) {
        console.error('Update share error:', error);
        const message = error instanceof Error ? error.message : 'Failed to update share';
        res.status(400).json({ error: message });
    }
});
/**
 * DELETE /api/sites/:siteId/shares/:shareId
 * Remove share (revoke access)
 */
router.delete('/:siteId/shares/:shareId', site_middleware_js_1.loadSite, (0, site_middleware_js_1.requireSitePermission)('admin'), async (req, res) => {
    try {
        const { shareId } = req.params;
        await (0, site_sharing_service_js_1.removeShare)(shareId);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Remove share error:', error);
        const message = error instanceof Error ? error.message : 'Failed to remove share';
        res.status(400).json({ error: message });
    }
});
// =============================================
// SITE INVITATIONS
// =============================================
/**
 * GET /api/sites/:siteId/invitations
 * Get pending invitations for this site
 */
router.get('/:siteId/invitations', site_middleware_js_1.loadSite, (0, site_middleware_js_1.requireSitePermission)('admin'), async (req, res) => {
    try {
        const siteReq = req;
        const siteId = siteReq.siteId;
        const invitations = await (0, site_sharing_service_js_1.getSiteInvitations)(siteId);
        res.json({
            invitations: invitations.map(i => ({
                id: i.id,
                email: i.email,
                permission: i.permission,
                status: i.status,
                invitedBy: i.inviter_name,
                expiresAt: i.expires_at,
                createdAt: i.created_at,
            })),
        });
    }
    catch (error) {
        console.error('Get invitations error:', error);
        res.status(500).json({ error: 'Failed to get invitations' });
    }
});
/**
 * POST /api/sites/:siteId/invitations
 * Create a new invitation
 */
router.post('/:siteId/invitations', site_middleware_js_1.loadSite, (0, site_middleware_js_1.requireSitePermission)('admin'), async (req, res) => {
    try {
        const siteReq = req;
        const siteId = siteReq.siteId;
        const userId = req.user.id;
        const { email, permission = 'viewer' } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }
        // Check if user already exists - if so, create direct share instead
        const existingUser = await (0, site_sharing_service_js_1.findUserByEmail)(email);
        if (existingUser) {
            res.status(400).json({
                error: 'User exists - use /shares endpoint instead',
                userId: existingUser.id,
            });
            return;
        }
        const invitation = await (0, site_sharing_service_js_1.createInvitation)({
            siteId,
            email,
            permission,
            invitedBy: userId,
        });
        res.status(201).json({
            invitation: {
                id: invitation.id,
                email: invitation.email,
                permission: invitation.permission,
                token: invitation.token,
                expiresAt: invitation.expires_at,
            },
        });
    }
    catch (error) {
        console.error('Create invitation error:', error);
        const message = error instanceof Error ? error.message : 'Failed to create invitation';
        const isMemberLimit = message.includes('Member limit');
        res.status(isMemberLimit ? 403 : 400).json({
            error: message,
            code: isMemberLimit ? 'MEMBER_LIMIT_REACHED' : undefined,
        });
    }
});
/**
 * DELETE /api/sites/:siteId/invitations/:invitationId
 * Cancel a pending invitation
 */
router.delete('/:siteId/invitations/:invitationId', site_middleware_js_1.loadSite, (0, site_middleware_js_1.requireSitePermission)('admin'), async (req, res) => {
    try {
        const siteReq = req;
        const siteId = siteReq.siteId;
        const { invitationId } = req.params;
        await (0, site_sharing_service_js_1.cancelInvitation)(invitationId, siteId);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Cancel invitation error:', error);
        const message = error instanceof Error ? error.message : 'Failed to cancel invitation';
        res.status(400).json({ error: message });
    }
});
// =============================================
// SITE VERIFICATION
// =============================================
/**
 * POST /api/sites/:siteId/verification-token
 * Generate a verification token (returns existing token unless regenerate=true)
 */
router.post('/:siteId/verification-token', site_middleware_js_1.loadSite, (0, site_middleware_js_1.requireSitePermission)('admin'), async (req, res) => {
    try {
        const siteReq = req;
        const siteId = siteReq.siteId;
        const { regenerate } = req.body;
        const token = await (0, site_service_js_1.generateVerificationToken)(siteId, regenerate === true);
        res.json({
            token,
            instructions: {
                dns: {
                    type: 'TXT',
                    name: '_kritano',
                    value: token,
                },
                file: {
                    path: `/.well-known/kritano-verification.txt`,
                    content: token,
                },
            },
        });
    }
    catch (error) {
        console.error('Generate token error:', error);
        res.status(500).json({ error: 'Failed to generate verification token' });
    }
});
/**
 * POST /api/sites/:siteId/extract-branding
 * Extract colors and fonts from the site's homepage
 */
router.post('/:siteId/extract-branding', site_middleware_js_1.loadSite, (0, site_middleware_js_1.requireSitePermission)('admin'), async (req, res) => {
    try {
        const siteReq = req;
        const site = siteReq.site;
        // Fetch the homepage
        const url = `https://${site.domain}`;
        let html;
        try {
            const response = await fetch(url, {
                signal: AbortSignal.timeout(15000),
                headers: {
                    'User-Agent': 'Kritano/1.0 (Branding Extractor)',
                },
            });
            if (!response.ok) {
                res.status(400).json({ error: `Failed to fetch site: ${response.status}` });
                return;
            }
            html = await response.text();
        }
        catch (fetchError) {
            res.status(400).json({ error: 'Could not reach the website' });
            return;
        }
        // Extract colors from CSS and inline styles
        const colorCounts = new Map();
        // Helper to normalize and count colors
        const addColor = (color) => {
            // Normalize to lowercase hex
            let normalized = color.toLowerCase().trim();
            // Convert 3-digit hex to 6-digit
            if (/^#[0-9a-f]{3}$/i.test(normalized)) {
                normalized = `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`;
            }
            // Skip if not valid hex
            if (!/^#[0-9a-f]{6}$/i.test(normalized))
                return;
            // Skip black, white, and near-black/white colors
            const r = parseInt(normalized.slice(1, 3), 16);
            const g = parseInt(normalized.slice(3, 5), 16);
            const b = parseInt(normalized.slice(5, 7), 16);
            // Skip very dark or very light colors
            const brightness = (r + g + b) / 3;
            if (brightness < 20 || brightness > 240)
                return;
            // Skip grays (where r, g, b are very close)
            const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
            if (maxDiff < 15)
                return;
            colorCounts.set(normalized, (colorCounts.get(normalized) || 0) + 1);
        };
        // Extract hex colors
        const hexPattern = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
        let match;
        while ((match = hexPattern.exec(html)) !== null) {
            addColor(match[0]);
        }
        // Extract rgb/rgba colors and convert to hex
        const rgbPattern = /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/gi;
        while ((match = rgbPattern.exec(html)) !== null) {
            const r = parseInt(match[1], 10);
            const g = parseInt(match[2], 10);
            const b = parseInt(match[3], 10);
            if (r <= 255 && g <= 255 && b <= 255) {
                const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                addColor(hex);
            }
        }
        // Sort by frequency and get top colors
        const sortedColors = [...colorCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([color]) => color);
        // Try to extract meta theme-color
        const themeColorMatch = html.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']theme-color["']/i);
        if (themeColorMatch) {
            const themeColor = themeColorMatch[1];
            // Add theme color as high priority
            if (themeColor.startsWith('#')) {
                // Move to front if it exists, or add it
                const idx = sortedColors.indexOf(themeColor.toLowerCase());
                if (idx > 0) {
                    sortedColors.splice(idx, 1);
                    sortedColors.unshift(themeColor.toLowerCase());
                }
                else if (idx === -1) {
                    sortedColors.unshift(themeColor.toLowerCase());
                }
            }
        }
        // Extract site title for company name suggestion
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const ogSiteNameMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i);
        let companyName = '';
        if (ogSiteNameMatch) {
            companyName = ogSiteNameMatch[1].trim();
        }
        else if (titleMatch) {
            // Clean up title (often has " - Company" or "| Company" format)
            let title = titleMatch[1].trim();
            // Take the last part after | or -
            const parts = title.split(/\s*[|\-–—]\s*/);
            if (parts.length > 1) {
                companyName = parts[parts.length - 1].trim();
            }
            else {
                companyName = title;
            }
        }
        // Assign colors to primary, secondary, accent
        const palette = {
            primary: sortedColors[0] || '#4f46e5',
            secondary: sortedColors[1] || sortedColors[0] || '#6366f1',
            accent: sortedColors[2] || sortedColors[1] || '#f59e0b',
        };
        res.json({
            palette,
            companyName,
            allColors: sortedColors.slice(0, 10), // Return top 10 for user to choose
        });
    }
    catch (error) {
        console.error('Extract branding error:', error);
        res.status(500).json({ error: 'Failed to extract branding' });
    }
});
/**
 * POST /api/sites/:siteId/verify
 * Verify site ownership
 */
router.post('/:siteId/verify', site_middleware_js_1.loadSite, (0, site_middleware_js_1.requireSitePermission)('admin'), async (req, res) => {
    try {
        const siteReq = req;
        const siteId = siteReq.siteId;
        const site = siteReq.site;
        const { method } = req.body;
        if (!['dns', 'file'].includes(method)) {
            res.status(400).json({ error: 'Method must be "dns" or "file"' });
            return;
        }
        // Check if already verified
        if (site.verified) {
            res.json({ verified: true, message: 'Site is already verified' });
            return;
        }
        if (!site.verification_token) {
            res.status(400).json({ error: 'No verification token generated. Generate one first.' });
            return;
        }
        // Increment attempt counter
        await (0, site_service_js_1.incrementVerificationAttempt)(siteId);
        let verified = false;
        if (method === 'dns') {
            // Check DNS TXT record
            try {
                const dns = await import('dns/promises');
                const records = await dns.resolveTxt(`_kritano.${site.domain}`);
                verified = records.some(r => r.join('').includes(site.verification_token));
            }
            catch {
                // DNS lookup failed
                verified = false;
            }
        }
        else {
            // Check file
            try {
                const url = `https://${site.domain}/.well-known/kritano-verification.txt`;
                const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
                if (response.ok) {
                    const text = await response.text();
                    verified = text.trim() === site.verification_token;
                }
            }
            catch {
                // File fetch failed
                verified = false;
            }
        }
        if (verified) {
            await (0, site_service_js_1.markSiteVerified)(siteId, method);
            res.json({
                verified: true,
                message: 'Site verified successfully!',
            });
        }
        else {
            res.json({
                verified: false,
                message: method === 'dns'
                    ? `Could not find verification TXT record at _kritano.${site.domain}`
                    : `Could not find verification file at https://${site.domain}/.well-known/kritano-verification.txt`,
            });
        }
    }
    catch (error) {
        console.error('Verify site error:', error);
        res.status(500).json({ error: 'Failed to verify site' });
    }
});
// =============================================
// SITE OWNERSHIP TRANSFER
// =============================================
/**
 * POST /api/sites/:siteId/transfer
 * Transfer site ownership to another user (by email)
 */
router.post('/:siteId/transfer', site_middleware_js_1.loadSite, site_middleware_js_1.requireSiteOwner, async (req, res) => {
    try {
        const siteReq = req;
        const siteId = siteReq.siteId;
        const currentOwnerId = req.user.id;
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email of the new owner is required' });
            return;
        }
        // Find target user
        const targetUser = await (0, site_sharing_service_js_1.findUserByEmail)(email);
        if (!targetUser) {
            res.status(404).json({ error: 'No user found with that email address' });
            return;
        }
        const updatedSite = await (0, site_service_js_1.transferSiteOwnership)(siteId, currentOwnerId, targetUser.id);
        res.json({
            site: {
                id: updatedSite.id,
                name: updatedSite.name,
                domain: updatedSite.domain,
                ownerId: updatedSite.owner_id,
            },
            message: `Ownership transferred to ${email}`,
        });
    }
    catch (error) {
        console.error('Transfer ownership error:', error);
        const message = error instanceof Error ? error.message : 'Failed to transfer ownership';
        res.status(400).json({ error: message });
    }
});
// =============================================
// PUBLIC BADGE TOGGLE
// =============================================
/**
 * PUT /api/sites/:siteId/badge
 * Toggle badge_enabled on/off (owner only, Starter+ tier)
 */
router.put('/:siteId/badge', site_middleware_js_1.loadSite, site_middleware_js_1.requireSiteOwner, async (req, res) => {
    try {
        const siteReq = req;
        const siteId = siteReq.siteId;
        const { enabled } = req.body;
        if (typeof enabled !== 'boolean') {
            res.status(400).json({ error: 'enabled must be a boolean' });
            return;
        }
        // Tier gate: Starter+ only
        const tierLimits = await (0, site_service_js_1.getSiteOwnerTierLimits)(siteId);
        const tier = tierLimits?.tier || 'free';
        if (tier === 'free') {
            res.status(403).json({ error: 'Public badges require a Starter plan or above.' });
            return;
        }
        await index_js_1.pool.query(`UPDATE sites SET badge_enabled = $1, updated_at = NOW() WHERE id = $2`, [enabled, siteId]);
        res.json({ success: true, badgeEnabled: enabled });
    }
    catch (error) {
        console.error('Toggle badge error:', error);
        res.status(500).json({ error: 'Failed to update badge setting' });
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map