"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const Sentry = __importStar(require("@sentry/node"));
const security_middleware_js_1 = require("./middleware/security.middleware.js");
const csrf_middleware_js_1 = require("./middleware/csrf.middleware.js");
const rateLimit_middleware_js_1 = require("./middleware/rateLimit.middleware.js");
const index_js_1 = require("./db/index.js");
const blog_service_js_1 = require("./services/blog.service.js");
const redis_js_1 = require("./db/redis.js");
const index_js_2 = require("./routes/index.js");
const pdf_report_service_js_1 = require("./services/pdf-report.service.js");
const prerender_service_js_1 = require("./services/prerender.service.js");
const prerender_middleware_js_1 = require("./middleware/prerender.middleware.js");
const resend_js_1 = require("./routes/webhooks/resend.js");
const stripe_js_1 = require("./routes/webhooks/stripe.js");
// Load environment variables
dotenv_1.default.config();
// Initialize Sentry (#68)
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        integrations: [
            Sentry.httpIntegration(),
            Sentry.expressIntegration(),
        ],
        beforeSend(event) {
            // Filter out sensitive data
            if (event.request?.cookies) {
                delete event.request.cookies;
            }
            return event;
        },
    });
    console.log('🔍 Sentry error tracking enabled');
}
// Production safety checks
if (process.env.NODE_ENV === 'production') {
    if (!process.env.RESEND_WEBHOOK_SECRET) {
        console.error('❌ RESEND_WEBHOOK_SECRET must be set in production. Exiting.');
        process.exit(1);
    }
}
// Initialize route dependencies (uses shared pool from db/index.ts)
(0, index_js_2.initializeRoutes)(index_js_1.pool);
const app = (0, express_1.default)();
// Trust first proxy (for correct req.ip behind reverse proxy)
app.set('trust proxy', 1);
// Response compression (gzip/brotli) — skip SSE streams
app.use((0, compression_1.default)({
    filter: (req, res) => {
        if (req.headers.accept === 'text/event-stream')
            return false;
        return compression_1.default.filter(req, res);
    },
}));
// Security middleware (Helmet)
(0, security_middleware_js_1.configureSecurityMiddleware)(app);
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
}));
// Webhook routes — registered BEFORE body parsers for raw body access
app.use('/api/webhooks/resend', express_1.default.raw({ type: 'application/json' }), resend_js_1.resendWebhookRouter);
app.use('/api/webhooks/stripe', express_1.default.raw({ type: 'application/json' }), (0, stripe_js_1.initializeStripeWebhooks)(index_js_1.pool));
// Static file serving for blog uploads
app.use('/uploads', express_1.default.static(path_1.default.resolve(__dirname, '..', 'uploads'), {
    maxAge: '7d',
    immutable: true,
}));
// Body parsing
app.use('/api/admin/cold-prospects/import-json', express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.json({ limit: '2mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '2mb' }));
// Cookie parser
app.use((0, cookie_parser_1.default)());
// Public stats (no auth, no CSRF, cached)
app.get('/api/stats/public', async (_req, res) => {
    try {
        const result = await index_js_1.pool.query(`SELECT COUNT(*) as count FROM audit_jobs WHERE status = 'completed'`);
        const count = parseInt(result.rows[0].count, 10);
        res.set('Cache-Control', 'public, max-age=300');
        res.json({ auditsCompleted: count });
    }
    catch {
        res.json({ auditsCompleted: 0 });
    }
});
// CSRF protection
app.use(csrf_middleware_js_1.ensureCsrfToken);
app.use('/api', csrf_middleware_js_1.csrfProtection);
// Global rate limiting
app.use('/api', rateLimit_middleware_js_1.globalRateLimiter);
// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'kritano', timestamp: new Date().toISOString() });
});
// API version endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'Kritano API',
        version: '1.0.0',
        documentation: '/api/docs',
    });
});
// Dynamic sitemap (static pages + blog posts)
app.get('/sitemap.xml', async (_req, res) => {
    try {
        const baseUrl = (process.env.APP_URL || 'https://kritano.com').replace(/^http:\/\//, 'https://');
        const posts = await (0, blog_service_js_1.getPublishedPostsForSitemap)();
        const staticPages = [
            { loc: '/', changefreq: 'weekly', priority: '1.0' },
            { loc: '/about', changefreq: 'monthly', priority: '0.7' },
            { loc: '/services', changefreq: 'monthly', priority: '0.8' },
            { loc: '/services/seo', changefreq: 'monthly', priority: '0.7' },
            { loc: '/services/accessibility', changefreq: 'monthly', priority: '0.7' },
            { loc: '/services/security', changefreq: 'monthly', priority: '0.7' },
            { loc: '/services/performance', changefreq: 'monthly', priority: '0.7' },
            { loc: '/pricing', changefreq: 'monthly', priority: '0.9' },
            { loc: '/faq', changefreq: 'monthly', priority: '0.8' },
            { loc: '/contact', changefreq: 'monthly', priority: '0.5' },
            { loc: '/author/chris-garlick', changefreq: 'monthly', priority: '0.6' },
            { loc: '/blog', changefreq: 'daily', priority: '0.8' },
            { loc: '/docs', changefreq: 'monthly', priority: '0.6' },
            { loc: '/docs/authentication', changefreq: 'monthly', priority: '0.5' },
            { loc: '/docs/endpoints', changefreq: 'monthly', priority: '0.5' },
            { loc: '/docs/objects', changefreq: 'monthly', priority: '0.5' },
            { loc: '/docs/rate-limits', changefreq: 'monthly', priority: '0.5' },
            { loc: '/docs/errors', changefreq: 'monthly', priority: '0.5' },
        ];
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        for (const page of staticPages) {
            xml += '  <url>\n';
            xml += `    <loc>${baseUrl}${page.loc}</loc>\n`;
            xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
            xml += `    <priority>${page.priority}</priority>\n`;
            xml += '  </url>\n';
        }
        for (const post of posts) {
            xml += '  <url>\n';
            xml += `    <loc>${baseUrl}/blog/${post.slug}</loc>\n`;
            xml += `    <lastmod>${new Date(post.updated_at).toISOString()}</lastmod>\n`;
            xml += '    <changefreq>monthly</changefreq>\n';
            xml += '    <priority>0.6</priority>\n';
            xml += '  </url>\n';
        }
        xml += '</urlset>';
        res.set('Content-Type', 'application/xml');
        res.set('Cache-Control', 'public, max-age=3600');
        res.send(xml);
    }
    catch (error) {
        console.error('Generate sitemap error:', error);
        res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
    }
});
// Sitemap XSL stylesheet (makes sitemap human-readable in browsers)
app.get('/sitemap.xsl', (_req, res) => {
    const xsl = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" indent="yes" encoding="UTF-8" />
  <xsl:template match="/">
    <html lang="en">
      <head>
        <title>Sitemap — Kritano</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #334155; background: #f8fafc; padding: 2rem; }
          .header { max-width: 960px; margin: 0 auto 2rem; }
          .header h1 { font-size: 1.5rem; color: #4f46e5; margin-bottom: 0.25rem; }
          .header p { color: #64748b; font-size: 0.875rem; }
          table { max-width: 960px; margin: 0 auto; width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
          th { background: #4f46e5; color: #fff; text-align: left; padding: 0.75rem 1rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
          td { padding: 0.6rem 1rem; border-bottom: 1px solid #e2e8f0; font-size: 0.875rem; }
          tr:last-child td { border-bottom: none; }
          tr:hover td { background: #f1f5f9; }
          a { color: #4f46e5; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .priority { text-align: center; }
          .freq { text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Kritano Sitemap</h1>
          <p><xsl:value-of select="count(sitemap:urlset/sitemap:url)" /> URLs</p>
        </div>
        <table>
          <tr>
            <th>URL</th>
            <th>Last Modified</th>
            <th class="freq">Frequency</th>
            <th class="priority">Priority</th>
          </tr>
          <xsl:for-each select="sitemap:urlset/sitemap:url">
            <tr>
              <td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc" /></a></td>
              <td><xsl:value-of select="substring(sitemap:lastmod, 1, 10)" /></td>
              <td class="freq"><xsl:value-of select="sitemap:changefreq" /></td>
              <td class="priority"><xsl:value-of select="sitemap:priority" /></td>
            </tr>
          </xsl:for-each>
        </table>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>`;
    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(xsl);
});
// API routes
app.use('/api', index_js_2.apiRouter);
// Pre-rendering for bot/crawler user agents (serves rendered HTML for SEO/AI citation)
app.use(prerender_middleware_js_1.prerenderMiddleware);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        code: 'NOT_FOUND',
        path: req.path,
    });
});
// Sentry error handler (must be before other error handlers)
if (process.env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
}
// Error handler
app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err);
    // Capture error in Sentry if not already captured
    if (process.env.SENTRY_DSN) {
        Sentry.captureException(err);
    }
    // Don't expose internal errors in production
    const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
    res.status(500).json({
        error: message,
        code: 'INTERNAL_ERROR',
    });
});
// Start server with port retry logic
const BASE_PORT = parseInt(process.env.PORT || '3001', 10);
const MAX_PORT_ATTEMPTS = 10;
let serverRef = null;
const startServer = (port, attempt = 1) => {
    if (attempt > MAX_PORT_ATTEMPTS) {
        console.error(`❌ Failed to start server: all ports ${BASE_PORT}-${BASE_PORT + MAX_PORT_ATTEMPTS - 1} in use`);
        process.exit(1);
    }
    const server = app.listen(port);
    serverRef = server;
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`⚠️  Port ${port} in use, trying ${port + 1}...`);
            startServer(port + 1, attempt + 1);
        }
        else {
            console.error('❌ Server error:', err);
            process.exit(1);
        }
    });
    server.on('listening', async () => {
        console.log(`🛡️  Kritano server running on http://localhost:${port}`);
        console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
        await (0, redis_js_1.testRedisConnection)().catch(() => console.warn('⚠️  Redis not available — rate limiting will fail open'));
    });
};
// Graceful shutdown
const shutdown = (signal) => {
    console.log(`\n📥 Received ${signal}, shutting down...`);
    // Force exit after 3 seconds if graceful shutdown fails
    setTimeout(() => {
        console.log('⚠️  Forcing exit...');
        process.exit(0);
    }, 3000).unref();
    if (serverRef) {
        serverRef.close(() => {
            Promise.all([index_js_1.pool.end(), (0, pdf_report_service_js_1.shutdownPdfBrowser)(), (0, prerender_service_js_1.shutdownPrerenderBrowser)()]).finally(() => {
                process.exit(0);
            });
        });
    }
    else {
        Promise.all([index_js_1.pool.end(), (0, pdf_report_service_js_1.shutdownPdfBrowser)(), (0, prerender_service_js_1.shutdownPrerenderBrowser)()]).finally(() => {
            process.exit(0);
        });
    }
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
startServer(BASE_PORT);
exports.default = app;
//# sourceMappingURL=index.js.map