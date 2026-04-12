import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
/**
 * Middleware factory to validate request body against a Zod schema.
 * Returns 400 with detailed error messages if validation fails.
 */
export declare function validateBody<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware factory to validate request query against a Zod schema.
 */
export declare function validateQuery<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware factory to validate request params against a Zod schema.
 */
export declare function validateParams<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validate.middleware.d.ts.map