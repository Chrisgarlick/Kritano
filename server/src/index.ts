import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { configureSecurityMiddleware } from './middleware/security.middleware.js';
import { ensureCsrfToken, csrfProtection } from './middleware/csrf.middleware.js';
import { globalRateLimiter } from './middleware/rateLimit.middleware.js';
import { testRedisConnection } from './db/redis.js';
import { authRouter } from './routes/auth/index.js';
import { auditsRouter, setPool as setAuditsPool } from './routes/audits/index.js';
import sitesRouter from './routes/sites/index.js';
import { cookieConsentRouter } from './routes/consent/cookie-consent.js';
import { billingRouter } from './routes/billing/index.js';
import { initializeStripeWebhooks } from './routes/webhooks/stripe.js';
import { setPool as setSiteServicePool } from './services/site.service.js';
import { setPool as setDomainVerificationPool } from './services/domain-verification.service.js';
import { setPool as setConsentServicePool } from './services/consent.service.js';
import { setPool as setSiteMiddlewarePool } from './middleware/site.middleware.js';
import { setPool as setSystemSettingsPool } from './services/system-settings.service.js';
import { createTrialWorker } from './services/queue/trial-worker.service.js';

// Load environment variables
dotenv.config();

// Database connection - require DATABASE_URL (no hardcoded credentials)
if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
});

const app = express();

// Security middleware (Helmet)
configureSecurityMiddleware(app);

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  })
);

// Stripe webhook route — must use raw body BEFORE express.json()
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }), initializeStripeWebhooks(pool));

// Body parsing
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
  res.json({ status: 'ok', service: 'pagepulser', timestamp: new Date().toISOString() });
});

// API version endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'PagePulser API',
    version: '1.0.0',
    documentation: '/api/docs',
  });
});

// Auth routes
app.use('/api/auth', authRouter);

// Audit routes (inject pool)
setAuditsPool(pool);
app.use('/api/audits', auditsRouter);

// Site routes (inject pool into services and middleware)
setSiteServicePool(pool);
setDomainVerificationPool(pool);
setConsentServicePool(pool);
setSiteMiddlewarePool(pool);
app.use('/api/sites', sitesRouter);

// Consent routes (public, no auth required for cookie consent)
app.use('/api/consent/cookies', cookieConsentRouter);

// Billing, subscription, early access, and coming soon routes
setSystemSettingsPool(pool);
app.use('/api', billingRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    code: 'NOT_FOUND',
    path: req.path,
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);

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
    console.error(`Failed to start server: all ports ${BASE_PORT}-${BASE_PORT + MAX_PORT_ATTEMPTS - 1} in use`);
    process.exit(1);
  }

  const server = app.listen(port);
  serverRef = server;

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} in use, trying ${port + 1}...`);
      startServer(port + 1, attempt + 1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });

  server.on('listening', async () => {
    console.log(`PagePulser server running on http://localhost:${port}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    await testRedisConnection().catch(() => console.warn('Redis not available — rate limiting will fail open'));

    // Start trial expiry worker
    const trialWorker = createTrialWorker({ pool });
    trialWorker.start().catch((err) => console.error('Trial worker failed to start:', err));
  });
};

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`\nReceived ${signal}, shutting down...`);

  setTimeout(() => {
    console.log('Forcing exit...');
    process.exit(0);
  }, 3000).unref();

  if (serverRef) {
    serverRef.close(() => {
      pool.end().finally(() => {
        process.exit(0);
      });
    });
  } else {
    pool.end().finally(() => {
      process.exit(0);
    });
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer(BASE_PORT);

export default app;
