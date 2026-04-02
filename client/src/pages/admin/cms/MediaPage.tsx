import { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { adminApi } from '../../../services/api';
import type { BlogMediaItem } from '../../../services/api';
import type { Pagination } from '../../../types/audit.types';
import {
  Upload,
  Image,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileImage,
  Save,
} from 'lucide-react';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function MediaPage() {
  const [media, setMedia] = useState<BlogMediaItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<BlogMediaItem | null>(null);
  const [altText, setAltText] = useState('');
  const [isSavingAlt, setIsSavingAlt] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const loadMedia = useCallback(async (page: number) => {
    try {
      setIsLoading(true);
      const { data } = await adminApi.listMedia({ page, limit: 24 });
      setMedia(data.media);
      setPagination(data.pagination);
    } catch {
      // Silently handle error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedia(currentPage);
  }, [currentPage, loadMedia]);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      setIsUploading(true);
      await adminApi.uploadMedia(file);
      await loadMedia(currentPage);
    } catch {
      // Silently handle error
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const openPreview = (item: BlogMediaItem) => {
    setSelectedMedia(item);
    setAltText(item.alt_text || '');
    setDeleteConfirmId(null);
  };

  const closePreview = () => {
    setSelectedMedia(null);
    setAltText('');
    setDeleteConfirmId(null);
  };

  const handleSaveAlt = async () => {
    if (!selectedMedia) return;
    try {
      setIsSavingAlt(true);
      const { data } = await adminApi.updateMediaAlt(selectedMedia.id, altText);
      setSelectedMedia(data.media);
      setMedia((prev) =>
        prev.map((m) => (m.id === data.media.id ? data.media : m))
      );
    } catch {
      // Silently handle error
    } finally {
      setIsSavingAlt(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await adminApi.deleteMedia(id);
      if (selectedMedia?.id === id) closePreview();
      setDeleteConfirmId(null);
      await loadMedia(currentPage);
    } catch {
      // Silently handle error
    } finally {
      setIsDeleting(false);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && pagination && page <= pagination.pages) {
      setCurrentPage(page);
    }
  };

  if (isLoading && media.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Helmet><title>Admin: Media | Kritano</title></Helmet>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-display">Media Library</h1>
          {pagination && (
            <p className="text-sm text-slate-500 mt-1">
              {pagination.total} {pagination.total === 1 ? 'file' : 'files'} total
            </p>
          )}
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Drag-and-drop zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative mb-6 border-2 border-dashed rounded-lg transition-colors ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-white/[0.06] bg-white/[0.01] hover:border-white/[0.1]'
        }`}
      >
        <div className="flex flex-col items-center justify-center py-8">
          <Upload
            className={`w-8 h-8 mb-3 ${
              isDragging ? 'text-indigo-400' : 'text-slate-500'
            }`}
          />
          <p className={`text-sm ${isDragging ? 'text-indigo-300' : 'text-slate-500'}`}>
            {isDragging
              ? 'Drop your image here to upload'
              : 'Drag and drop an image here, or click Upload above'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Supports JPEG, PNG, WebP, GIF, SVG
          </p>
        </div>
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/[0.02] rounded-lg">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <span className="text-sm text-indigo-300 font-medium">Uploading...</span>
            </div>
          </div>
        )}
      </div>

      {/* Media Grid */}
      {media.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mb-4">
            <FileImage className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No media yet</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-sm">
            Upload images to use in blog posts and pages. Images are automatically optimised for the web.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload your first image</span>
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map((item) => (
              <button
                key={item.id}
                onClick={() => openPreview(item)}
                className="group bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden text-left hover:border-indigo-500/50 hover:ring-1 hover:ring-indigo-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-white/[0.03] flex items-center justify-center overflow-hidden">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.alt_text || item.filename}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  ) : (
                    <Image className="w-10 h-10 text-slate-600" />
                  )}
                </div>
                {/* Info */}
                <div className="p-3">
                  <p className="text-sm text-white font-medium truncate" title={item.filename}>
                    {item.filename}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-slate-500">
                      {item.width && item.height
                        ? `${item.width}x${item.height}`
                        : 'Unknown'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatFileSize(item.file_size_bytes)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatDate(item.created_at)}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <p className="text-sm text-slate-500">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-white/[0.02] border border-white/[0.06] text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev
                </button>
                {/* Page number buttons */}
                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first, last, current, and neighbors
                    if (page === 1 || page === pagination.pages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .reduce<(number | 'ellipsis')[]>((acc, page, idx, arr) => {
                    if (idx > 0) {
                      const prev = arr[idx - 1];
                      if (page - prev > 1) acc.push('ellipsis');
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === 'ellipsis' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-slate-500">
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => goToPage(item)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          item === currentPage
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white/[0.02] border border-white/[0.06] text-slate-300 hover:text-white hover:bg-white/[0.06]'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= pagination.pages}
                  className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-white/[0.02] border border-white/[0.06] text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={closePreview}
          />
          <div className="relative bg-white/[0.02] border border-white/[0.06] rounded-lg shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-lg font-semibold text-white truncate pr-4">
                {selectedMedia.filename}
              </h3>
              <button
                onClick={closePreview}
                className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Image Preview */}
              <div className="bg-white/[0.03] rounded-lg flex items-center justify-center overflow-hidden mb-6">
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.alt_text || selectedMedia.filename}
                  className="max-w-full max-h-[50vh] object-contain"
                />
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/[0.03] rounded-lg p-3">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    Dimensions
                  </div>
                  <div className="text-sm text-white font-medium">
                    {selectedMedia.width && selectedMedia.height
                      ? `${selectedMedia.width} x ${selectedMedia.height}`
                      : 'Unknown'}
                  </div>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-3">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    File Size
                  </div>
                  <div className="text-sm text-white font-medium">
                    {formatFileSize(selectedMedia.file_size_bytes)}
                  </div>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-3">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    Type
                  </div>
                  <div className="text-sm text-white font-medium">
                    {selectedMedia.mime_type}
                  </div>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-3">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    Uploaded
                  </div>
                  <div className="text-sm text-white font-medium">
                    {formatDate(selectedMedia.created_at)}
                  </div>
                </div>
              </div>

              {/* Alt Text Edit */}
              <div className="mb-6">
                <label
                  htmlFor="alt-text"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Alt Text
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    id="alt-text"
                    type="text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Describe this image for accessibility..."
                    className="flex-1 px-3 py-2 rounded-md bg-white/[0.03] border border-white/[0.06] text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  />
                  <button
                    onClick={handleSaveAlt}
                    disabled={isSavingAlt || altText === (selectedMedia.alt_text || '')}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingAlt ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
              <div className="text-xs text-slate-500">
                ID: {selectedMedia.id}
              </div>
              {deleteConfirmId === selectedMedia.id ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-red-400">
                    Are you sure?
                  </span>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.06] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(selectedMedia.id)}
                    disabled={isDeleting}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span>Delete</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirmId(selectedMedia.id)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
