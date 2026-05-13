"use strict";
/**
 * Gated Resource type definitions.
 *
 * See /docs/gated-resources.md for the feature plan and
 * /docs/gated_resources.md for the resource catalogue and ranking.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypesetRenderError = exports.TypesetNotConfiguredError = exports.UnsupportedFormatError = exports.FORMAT_EXTENSION = exports.FORMAT_MIME = exports.ALL_FORMATS = void 0;
exports.ALL_FORMATS = ['md', 'pdf', 'html', 'docx'];
exports.FORMAT_MIME = {
    md: 'text/markdown; charset=utf-8',
    pdf: 'application/pdf',
    html: 'text/html; charset=utf-8',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};
exports.FORMAT_EXTENSION = {
    md: 'md',
    pdf: 'pdf',
    html: 'html',
    docx: 'docx',
};
class UnsupportedFormatError extends Error {
    constructor(format) {
        super(`Unsupported resource format: ${format}`);
        this.name = 'UnsupportedFormatError';
    }
}
exports.UnsupportedFormatError = UnsupportedFormatError;
class TypesetNotConfiguredError extends Error {
    constructor() {
        super('Typeset rendering is not enabled in this environment');
        this.name = 'TypesetNotConfiguredError';
    }
}
exports.TypesetNotConfiguredError = TypesetNotConfiguredError;
class TypesetRenderError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'TypesetRenderError';
    }
}
exports.TypesetRenderError = TypesetRenderError;
//# sourceMappingURL=gated-resource.types.js.map