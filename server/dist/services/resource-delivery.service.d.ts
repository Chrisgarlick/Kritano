/**
 * Resource Delivery Service
 *
 * Resolves the bytes for a given gated resource and format:
 *   - md   → source Markdown file from server/src/data/resources/<slug>/
 *   - pdf  → rendered via typeset, cached to server/uploads/resources/<slug>/
 *   - html → rendered via typeset, cached to server/uploads/resources/<slug>/
 *   - docx → reserved for when typeset supports it
 *
 * Cache key is the resource's content_hash, so editing the source MD and
 * recomputing the hash invalidates the cache automatically.
 *
 * See /docs/gated-resources.md for the feature plan.
 */
import type { GatedResource, ResourceFormat, DeliveredFormat } from '../types/gated-resource.types.js';
export declare function deliverFormat(resource: GatedResource, format: ResourceFormat): Promise<DeliveredFormat>;
//# sourceMappingURL=resource-delivery.service.d.ts.map