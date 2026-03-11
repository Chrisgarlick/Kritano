import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';

/**
 * Middleware factory to validate request body against a Zod schema.
 * Returns 400 with detailed error messages if validation fails.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Parse and transform the body
      const parsed = schema.parse(req.body);
      // Replace body with parsed (and transformed) data
      req.body = parsed;
      next();
    } catch (error) {
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
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.query);
      req.query = parsed as any;
      next();
    } catch (error) {
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
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.params);
      req.params = parsed as any;
      next();
    } catch (error) {
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
function isZodError(error: unknown): error is ZodError {
  return (error as ZodError)?.issues !== undefined;
}

/**
 * Format Zod errors into a user-friendly structure
 */
function formatZodErrors(error: ZodError): Array<{ field: string; message: string }> {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
  }));
}
