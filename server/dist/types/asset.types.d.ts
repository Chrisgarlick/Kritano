export type AssetCategory = 'image' | 'document' | 'video' | 'audio' | 'font' | 'stylesheet' | 'script' | 'other';
export interface DiscoveredAsset {
    url: string;
    urlHash: string;
    assetType: AssetCategory;
    mimeType: string | null;
    fileExtension: string | null;
    fileName: string | null;
    fileSizeBytes: number | null;
    source: 'network' | 'html' | 'both';
    httpStatus: number | null;
    htmlElement: string | null;
    htmlAttribute: string | null;
}
export declare const EXTENSION_TO_CATEGORY: Record<string, AssetCategory>;
export declare const RESOURCE_TYPE_TO_CATEGORY: Record<string, AssetCategory>;
export declare const BINARY_LINK_EXTENSIONS: Set<string>;
//# sourceMappingURL=asset.types.d.ts.map