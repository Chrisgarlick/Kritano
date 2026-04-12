/**
 * Blog Media Service
 *
 * Upload handling, Sharp image processing (resize, WebP, thumbnail),
 * local file storage, deletion.
 */
import type { BlogMedia } from '../types/blog.types.js';
export interface UploadResult {
    id: string;
    url: string;
    thumbnailUrl: string;
    webpUrl: string;
    width: number;
    height: number;
    fileSizeBytes: number;
}
export declare function uploadMedia(file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
}, uploadedBy: string): Promise<UploadResult>;
export declare function deleteMedia(mediaId: string): Promise<boolean>;
export declare function listMedia(page?: number, limit?: number): Promise<{
    media: (BlogMedia & {
        url: string;
        thumbnailUrl: string;
    })[];
    total: number;
}>;
export declare function updateMediaAltText(mediaId: string, altText: string): Promise<BlogMedia | null>;
export declare function renameMedia(mediaId: string, newName: string): Promise<(BlogMedia & {
    url: string;
    thumbnailUrl: string;
    webpUrl: string;
}) | null>;
//# sourceMappingURL=blog-media.service.d.ts.map