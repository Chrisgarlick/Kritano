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
import { testRedisConnection } from './db/redis.js';
import { apiRouter, initializeRoutes } from './routes/index.js';
import { shutdownPdfBrowser } from './services/pdf-report.service.js';
import { resendWebhookRouter } from './routes/webhooks/resend.js';
import { initializeStripeWebhooks } from './routes/webhooks/stripe.js';

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
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  })
);

// Webhook routes — registered BEFORE body parsers for raw body access
app.use('/api/webhooks/resend', express.raw({ type: 'application/json' }), resendWebhookRouter);
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }), initializeStripeWebhooks(pool));

// Static file serving for blog uploads
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads'), {
  maxAge: '7d',
  immutable: true,
}));

// Body parsing — larger limit for admin JSON imports
app.use('/api/admin/cold-prospects/import-json', express.json({ limit: '10mb' }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie parser
app.use(cookieParser());

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

// API routes
app.use('/api', apiRouter);

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
      Promise.all([pool.end(), shutdownPdfBrowser()]).finally(() => {
        process.exit(0);
      });
    });
  } else {
    Promise.all([pool.end(), shutdownPdfBrowser()]).finally(() => {
      process.exit(0);
    });
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer(BASE_PORT);

export default app;
