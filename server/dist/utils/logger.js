"use strict";
/**
 * Structured logger with JSON output for production
 * Replaces console.log with structured, leveled logging
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
const MIN_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL || 'info'];
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
function log(level, msg, meta) {
    if (LOG_LEVELS[level] < MIN_LEVEL)
        return;
    const entry = {
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
        }
        else {
            process.stdout.write(output + '\n');
        }
    }
    else {
        // Human-readable for development
        const prefix = { debug: '🔍', info: 'ℹ️ ', warn: '⚠️ ', error: '❌' }[level];
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
        if (level === 'error') {
            console.error(`${prefix} ${msg}${metaStr}`);
        }
        else if (level === 'warn') {
            console.warn(`${prefix} ${msg}${metaStr}`);
        }
        else {
            console.log(`${prefix} ${msg}${metaStr}`);
        }
    }
}
exports.logger = {
    debug: (msg, meta) => log('debug', msg, meta),
    info: (msg, meta) => log('info', msg, meta),
    warn: (msg, meta) => log('warn', msg, meta),
    error: (msg, meta) => log('error', msg, meta),
    /** Create a child logger with preset context */
    child: (context) => ({
        debug: (msg, meta) => log('debug', msg, { ...context, ...meta }),
        info: (msg, meta) => log('info', msg, { ...context, ...meta }),
        warn: (msg, meta) => log('warn', msg, { ...context, ...meta }),
        error: (msg, meta) => log('error', msg, { ...context, ...meta }),
    }),
};
//# sourceMappingURL=logger.js.map