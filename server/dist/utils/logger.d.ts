/**
 * Structured logger with JSON output for production
 * Replaces console.log with structured, leveled logging
 */
export declare const logger: {
    debug: (msg: string, meta?: Record<string, unknown>) => void;
    info: (msg: string, meta?: Record<string, unknown>) => void;
    warn: (msg: string, meta?: Record<string, unknown>) => void;
    error: (msg: string, meta?: Record<string, unknown>) => void;
    /** Create a child logger with preset context */
    child: (context: Record<string, unknown>) => {
        debug: (msg: string, meta?: Record<string, unknown>) => void;
        info: (msg: string, meta?: Record<string, unknown>) => void;
        warn: (msg: string, meta?: Record<string, unknown>) => void;
        error: (msg: string, meta?: Record<string, unknown>) => void;
    };
};
//# sourceMappingURL=logger.d.ts.map