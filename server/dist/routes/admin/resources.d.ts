/**
 * Admin routes for the gated resource library.
 *
 *   GET    /api/admin/resources             — list with stats
 *   POST   /api/admin/resources             — create a resource
 *   GET    /api/admin/resources/:id         — read one
 *   PATCH  /api/admin/resources/:id         — update metadata / publish toggle
 *   POST   /api/admin/resources/:id/regenerate — recompute content_hash from disk
 *   GET    /api/admin/resources/:id/leads   — paginated lead list
 *   GET    /api/admin/resources/:id/leads.csv — full export (CSV)
 *
 * Mounted at /api/admin/resources. Auth + super-admin enforced upstream by
 * routes/admin/index.ts (`router.use(authenticate, requireSuperAdmin)`).
 */
export declare const adminResourcesRouter: import("express-serve-static-core").Router;
//# sourceMappingURL=resources.d.ts.map