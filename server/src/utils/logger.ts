/**
 * Structured logger with JSON output for production
 * Replaces console.log with structured, leveled logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL = LOG_LEVELS[(process.env.LOG_LEVEL as LogLevel) || 'info'];
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

interface LogEntry {
  level: LogLevel;
  msg: string;
  timestamp: string;
  [key: string]: unknown;
}

function log(level: LogLevel, msg: string, meta?: Record<string, unknown>): void {
  if (LOG_LEVELS[level] < MIN_LEVEL) return;

  const entry: LogEntry = {
    level,
    msg,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  if (IS_PRODUCTION) {
    // JSON output for production log aggregators
    const output = JSON.stringify(entry);
    if (level === 'error') {
      process.stderr.write(output + '\n');
    } else {
      process.stdout.write(output + '\n');
    }
  } else {
    // Human-readable for development
    const prefix = { debug: '🔍', info: 'ℹ️ ', warn: '⚠️ ', error: '❌' }[level];
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    if (level === 'error') {
      console.error(`${prefix} ${msg}${metaStr}`);
    } else if (level === 'warn') {
      console.warn(`${prefix} ${msg}${metaStr}`);
    } else {
      console.log(`${prefix} ${msg}${metaStr}`);
    }
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),

  /** Create a child logger with preset context */
  child: (context: Record<string, unknown>) => ({
    debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, { ...context, ...meta }),
    info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, { ...context, ...meta }),
    warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, { ...context, ...meta }),
    error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, { ...context, ...meta }),
  }),
};
