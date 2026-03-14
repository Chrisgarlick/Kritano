import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Upload, Loader2, ImageIcon } from 'lucide-react';
import { adminApi, type BlogMediaItem } from '../../services/api';

interface MediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, alt: string) => void;
}

export default function MediaPicker({ isOpen, onClose, onSelect }: MediaPickerProps) {
  const [media, setMedia] = useState<BlogMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ----------------------------------------------------------------
  // Load media library
  // ----------------------------------------------------------------
  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await adminApi.listMedia({ limit: 100 });
      setMedia(data.media);
    } catch {
      setError('Failed to load media library');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen, fetchMedia]);

  // ----------------------------------------------------------------
  // Upload
  // ----------------------------------------------------------------
  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Only image files are supported');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const { data } = await adminApi.uploadMedia(file);
      // Select the newly uploaded image immediately
      onSelect(data.url, '');
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  // ----------------------------------------------------------------
  // Drag and drop
  // ----------------------------------------------------------------
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  // ----------------------------------------------------------------
  // Select existing media
  // ----------------------------------------------------------------
  const handleSelect = (item: BlogMediaItem) => {
    onSelect(item.url, item.alt_text || '');
  };

  // ----------------------------------------------------------------
  // Close on escape
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Select Image</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Upload zone */}
        <div className="border-b border-slate-700 px-6 py-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-6 text-center transition-colors ${
              isDragging
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-600 bg-slate-900/50 hover:border-slate-500'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                <p className="text-sm text-slate-400">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-slate-500" />
                <p className="text-sm text-slate-400">
                  Drag and drop an image, or{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="font-medium text-indigo-400 hover:text-indigo-300"
                  >
                    browse files
                  </button>
                </p>
                <p className="text-xs text-slate-500">PNG, JPG, GIF, WebP, SVG</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 rounded-md bg-red-900/30 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Media grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : media.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-500">
              <ImageIcon className="h-10 w-10" />
              <p className="text-sm">No media uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {media.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-slate-700 bg-slate-900 transition-all hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500/30"
                >
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={item.alt_text || item.filename}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="w-full truncate px-2 py-1.5 text-xs text-white">
                      {item.filename}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
