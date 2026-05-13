/**
 * Resources SSR Service
 *
 * Renders the three pages of the gated resource library as complete HTML
 * documents server-side. Mirrors the pattern of blog-ssr.service.ts and
 * compare-ssr.service.ts so the marketing surface stays consistent.
 *
 * See /docs/gated-resources.md for the feature plan.
 */
import type { GatedResource, ResourceSummary } from '../types/gated-resource.types.js';
export declare function renderResourcesList(resources: ResourceSummary[]): string;
interface RenderDetailOpts {
    resource: GatedResource;
    loggedIn: boolean;
}
export declare function renderResourceDetail(opts: RenderDetailOpts): string;
interface RenderThanksOpts {
    resource: GatedResource;
    token: string;
}
export declare function renderResourceThanks(opts: RenderThanksOpts): string;
export declare function renderResourceNotFound(): string;
interface RenderFormErrorOpts {
    resource: GatedResource;
    errorMessage: string;
}
export declare function renderFormError(opts: RenderFormErrorOpts): string;
export {};
//# sourceMappingURL=resources-ssr.service.d.ts.map