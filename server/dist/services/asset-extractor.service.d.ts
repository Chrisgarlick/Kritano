import type { ResourceInfo } from '../types/spider.types.js';
import { type DiscoveredAsset } from '../types/asset.types.js';
/**
 * Extract and merge assets from HTML content and network resources.
 * Returns deduplicated asset list.
 */
export declare function extractAssets(html: string, baseUrl: string, networkResources: ResourceInfo[]): DiscoveredAsset[];
//# sourceMappingURL=asset-extractor.service.d.ts.map