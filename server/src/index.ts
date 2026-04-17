import express from 'express';
import path from 'path';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import { configureSecurityMiddleware } from './middleware/security.middleware.js';
import { ensureCsrfToken, csrfProtection } from './middleware/csrf.middleware.js';
import { globalRateLimiter } from './middleware/rateLimit.middleware.js';
import { pool } from './db/index.js';
import { getPublishedPostsForSitemap } from './services/blog.service.js';
import { testRedisConnection } from './db/redis.js';
import { apiRouter, initializeRoutes } from './routes/index.js';
import { shutdownPdfBrowser } from './services/pdf-report.service.js';
import { shutdownPrerenderBrowser } from './services/prerender.service.js';
import { prerenderMiddleware } from './middleware/prerender.middleware.js';
import { resendWebhookRouter } from './routes/webhooks/resend.js';
import { initializeStripeWebhooks } from './routes/webhooks/stripe.js';
import { mcpHttpRouter } from './mcp/http.js';

// Load environment variables
dotenv.config();

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
initializeRoutes(pool);

const app = express();

// Trust first proxy (for correct req.ip behind reverse proxy)
app.set('trust proxy', 1);

// Response compression (gzip/brotli) — skip SSE streams
app.use(compression({
  filter: (req, res) => {
    if (req.headers.accept === 'text/event-stream') return false;
    return compression.filter(req, res);
  },
}));

// Security middleware (Helmet)
configureSecurityMiddleware(app);

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'mcp-session-id'],
    exposedHeaders: ['mcp-session-id'],
  })
);

// Webhook routes — registered BEFORE body parsers for raw body access
app.use('/api/webhooks/resend', express.raw({ type: 'application/json' }), resendWebhookRouter);
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }), initializeStripeWebhooks(pool));

// Static file serving for blog uploads
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads'), {
  maxAge: '7d',
  immutable: true,
}));

// Body parsing
app.use('/api/admin/cold-prospects/import-json', express.json({ limit: '10mb' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Cookie parser
app.use(cookieParser());

// Public stats (no auth, no CSRF, cached)
app.get('/api/stats/public', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM audit_jobs WHERE status = 'completed'`
    );
    const count = parseInt(result.rows[0].count, 10);
    res.set('Cache-Control', 'public, max-age=300');
    res.json({ auditsCompleted: count });
  } catch {
    res.json({ auditsCompleted: 0 });
  }
});

// MCP Streamable HTTP endpoint (API key auth, no CSRF)
app.use('/mcp', mcpHttpRouter);

// CSRF protection
app.use(ensureCsrfToken);
app.use('/api', csrfProtection);

// Global rate limiting
app.use('/api', globalRateLimiter);

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
    const posts = await getPublishedPostsForSitemap();

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
    res.removeHeader('Content-Security-Policy');
    res.send(xml);
  } catch (error) {
    console.error('Generate sitemap error:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
});

// API routes
app.use('/api', apiRouter);

// Pre-rendering for bot/crawler user agents (serves rendered HTML for SEO/AI citation)
app.use(prerenderMiddleware);

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
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
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
let serverRef: ReturnType<typeof app.listen> | null = null;

const startServer = (port: number, attempt: number = 1): void => {
  if (attempt > MAX_PORT_ATTEMPTS) {
    console.error(`❌ Failed to start server: all ports ${BASE_PORT}-${BASE_PORT + MAX_PORT_ATTEMPTS - 1} in use`);
    process.exit(1);
  }

  const server = app.listen(port);
  serverRef = server;

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${port} in use, trying ${port + 1}...`);
      startServer(port + 1, attempt + 1);
    } else {
      console.error('❌ Server error:', err);
      process.exit(1);
    }
  });

  server.on('listening', async () => {
    console.log(`🛡️  Kritano server running on http://localhost:${port}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    await testRedisConnection().catch(() => console.warn('⚠️  Redis not available — rate limiting will fail open'));
  });
};

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`\n📥 Received ${signal}, shutting down...`);

  // Force exit after 3 seconds if graceful shutdown fails
  setTimeout(() => {
    console.log('⚠️  Forcing exit...');
    process.exit(0);
  }, 3000).unref();

  if (serverRef) {
    serverRef.close(() => {
      Promise.all([pool.end(), shutdownPdfBrowser(), shutdownPrerenderBrowser()]).finally(() => {
        process.exit(0);
      });
    });
  } else {
    Promise.all([pool.end(), shutdownPdfBrowser(), shutdownPrerenderBrowser()]).finally(() => {
      process.exit(0);
    });
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer(BASE_PORT);

export default app;
