"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BINARY_LINK_EXTENSIONS = exports.RESOURCE_TYPE_TO_CATEGORY = exports.EXTENSION_TO_CATEGORY = void 0;
// Map file extensions to asset categories
exports.EXTENSION_TO_CATEGORY = {
    // Images
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image',
    svg: 'image', ico: 'image', bmp: 'image', avif: 'image', tiff: 'image', tif: 'image',
    // Documents
    pdf: 'document', doc: 'document', docx: 'document', xls: 'document', xlsx: 'document',
    ppt: 'document', pptx: 'document', odt: 'document', ods: 'document', odp: 'document',
    csv: 'document', txt: 'document', rtf: 'document', epub: 'document',
    // Video
    mp4: 'video', webm: 'video', avi: 'video', mov: 'video', wmv: 'video',
    flv: 'video', mkv: 'video', ogv: 'video', m4v: 'video',
    // Audio
    mp3: 'audio', wav: 'audio', ogg: 'audio', flac: 'audio', aac: 'audio',
    wma: 'audio', m4a: 'audio', opus: 'audio',
    // Fonts
    woff: 'font', woff2: 'font', ttf: 'font', otf: 'font', eot: 'font',
    // Stylesheets
    css: 'stylesheet',
    // Scripts
    js: 'script', mjs: 'script',
    // Archives (categorize as "other")
    zip: 'other', rar: 'other', gz: 'other', tar: 'other', '7z': 'other',
};
// Map spider ResourceType to AssetCategory
exports.RESOURCE_TYPE_TO_CATEGORY = {
    image: 'image',
    media: 'video',
    font: 'font',
    stylesheet: 'stylesheet',
    script: 'script',
    other: 'other',
};
// Binary extensions that should be detected in <a href> links
exports.BINARY_LINK_EXTENSIONS = new Set([
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'zip', 'rar', 'gz', 'tar', '7z',
    'mp4', 'webm', 'avi', 'mov',
    'mp3', 'wav', 'ogg', 'flac',
    'epub', 'csv',
]);
//# sourceMappingURL=asset.types.js.map