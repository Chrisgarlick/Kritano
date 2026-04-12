"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
exports.validateParams = validateParams;
/**
 * Middleware factory to validate request body against a Zod schema.
 * Returns 400 with detailed error messages if validation fails.
 */
function validateBody(schema) {
    return (req, res, next) => {
        try {
            // Parse and transform the body
            const parsed = schema.parse(req.body);
            // Replace body with parsed (and transformed) data
            req.body = parsed;
            next();
        }
        catch (error) {
            if (isZodError(error)) {
                res.status(400).json({
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: formatZodErrors(error),
                });
                return;
            }
            next(error);
        }
    };
}
/**
 * Middleware factory to validate request query against a Zod schema.
 */
function validateQuery(schema) {
    return (req, res, next) => {
        try {
            const parsed = schema.parse(req.query);
            req.query = parsed;
            next();
        }
        catch (error) {
            if (isZodError(error)) {
                res.status(400).json({
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: formatZodErrors(error),
                });
                return;
            }
            next(error);
        }
    };
}
/**
 * Middleware factory to validate request params against a Zod schema.
 */
function validateParams(schema) {
    return (req, res, next) => {
        try {
            const parsed = schema.parse(req.params);
            req.params = parsed;
            next();
        }
        catch (error) {
            if (isZodError(error)) {
                res.status(400).json({
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: formatZodErrors(error),
                });
                return;
            }
            next(error);
        }
    };
}
/**
 * Type guard for ZodError
 */
function isZodError(error) {
    return error?.issues !== undefined;
}
/**
 * Format Zod errors into a user-friendly structure
 */
function formatZodErrors(error) {
    return error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
    }));
}
//# sourceMappingURL=validate.middleware.js.map