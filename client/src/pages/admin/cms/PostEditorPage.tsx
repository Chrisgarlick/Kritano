/**
 * Post Editor Page
 *
 * Smart routing:
 * - /admin/cms/posts/new → Create new post
 * - /admin/cms/posts/:id/edit → Edit existing post
 *
 * Block-based editor with auto-save, preview toggle, and publish controls.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { adminApi } from '../../../services/api';
import type {
  BlogPostDetail,
  BlogPostSummary,
  BlogContentBlock,
  BlogPostCategory,
  CreateBlogPostInput,
} from '../../../services/api';
import BlockDisplay from '../../../components/cms/BlockDisplay';
import BlockRenderer from '../../../components/cms/BlockRenderer';
import BlockWrapper from '../../../components/cms/BlockWrapper';
import AddBlockMenu from '../../../components/cms/AddBlockMenu';
import MediaPicker from '../../../components/cms/MediaPicker';
import {
  Save, Eye, EyeOff, Send, ArrowLeft, ChevronDown, ChevronUp,
  Image as ImageIcon, Clock, FileText, ExternalLink, Search, X, Link2,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const CATEGORIES: { value: BlogPostCategory; label: string }[] = [
  { value: 'seo', label: 'SEO' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'security', label: 'Security' },
  { value: 'performance', label: 'Performance' },
  { value: 'content-quality', label: 'Content Quality' },
  { value: 'structured-data', label: 'Structured Data' },
  { value: 'eeat', label: 'E-E-A-T' },
  { value: 'aeo', label: 'AEO' },
  { value: 'guides', label: 'Guides' },
  { value: 'case-studies', label: 'Case Studies' },
  { value: 'product-updates', label: 'Product Updates' },
];

const AUTO_SAVE_DELAY = 10000; // 10 seconds

function SortableBlock({
  block,
  onUpdate,
  onDelete,
}: {
  block: BlogContentBlock;
  onUpdate: (props: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <BlockWrapper
        block={block}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      >
        <BlockRenderer block={block} onUpdate={onUpdate} />
      </BlockWrapper>
    </div>
  );
}

export default function PostEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'idle'>('idle');
  const [post, setPost] = useState<BlogPostDetail | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState<BlogPostCategory>('guides');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [blocks, setBlocks] = useState<BlogContentBlock[]>([]);
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [featuredImageAlt, setFeaturedImageAlt] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Related posts state
  const [relatedPostIds, setRelatedPostIds] = useState<string[]>([]);
  const [relatedPostDetails, setRelatedPostDetails] = useState<BlogPostSummary[]>([]);
  const [relatedSearch, setRelatedSearch] = useState('');
  const [relatedSearchResults, setRelatedSearchResults] = useState<BlogPostSummary[]>([]);
  const [relatedSearching, setRelatedSearching] = useState(false);
  const relatedSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load existing post
  useEffect(() => {
    if (id) {
      loadPost(id);
    }
  }, [id]);

  // Track changes for auto-save
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!isNew && post) {
      setHasChanges(true);
      setSaveStatus('unsaved');
    }
  }, [title, subtitle, excerpt, category, tags, blocks, featuredImageUrl, featuredImageAlt, seoTitle, seoDescription, relatedPostIds]);

  // Auto-save
  useEffect(() => {
    if (hasChanges && post && post.status === 'draft') {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        handleSave(true);
      }, AUTO_SAVE_DELAY);
    }
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [hasChanges, title, subtitle, excerpt, category, tags, blocks]);

  // Warn on navigation with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasChanges]);

  const loadPost = async (postId: string) => {
    try {
      const { data } = await adminApi.getPost(postId);
      const p = data.post;
      setPost(p);
      setTitle(p.title);
      setSubtitle(p.subtitle || '');
      setExcerpt(p.excerpt);
      setCategory(p.category);
      setTags(p.tags);
      setBlocks(p.content);
      setFeaturedImageUrl(p.featured_image_url || '');
      setFeaturedImageAlt(p.featured_image_alt || '');
      setSeoTitle(p.seo_title || '');
      setSeoDescription(p.seo_description || '');
      const ids = p.related_post_ids || [];
      setRelatedPostIds(ids);
      // Load details for selected related posts
      if (ids.length > 0) {
        const { data: listData } = await adminApi.listPosts({ limit: 100 });
        setRelatedPostDetails(
          ids
            .map(rid => listData.posts.find((lp: BlogPostSummary) => lp.id === rid))
            .filter((lp): lp is BlogPostSummary => !!lp)
        );
      }
    } catch (err) {
      console.error('Failed to load post:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = useCallback(async (isAutoSave = false) => {
    if (saving) return;
    setSaving(true);
    setSaveStatus('saving');

    try {
      const postData: CreateBlogPostInput = {
        title,
        subtitle: subtitle || null,
        excerpt,
        category,
        tags,
        content: blocks,
        featured_image_url: featuredImageUrl || null,
        featured_image_alt: featuredImageAlt || null,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
      };

      if (isNew) {
        const { data } = await adminApi.createPost(postData);
        setPost(data.post);
        setHasChanges(false);
        setSaveStatus('saved');
        navigate(`/admin/cms/posts/${data.post.id}/edit`, { replace: true });
      } else if (post) {
        const { data } = await adminApi.updatePost(post.id, {
          ...postData,
          related_post_ids: relatedPostIds,
          revision_note: isAutoSave ? 'Auto-save' : undefined,
        });
        setPost(data.post);
        setHasChanges(false);
        setSaveStatus('saved');
      }
    } catch (err) {
      console.error('Failed to save post:', err);
      setSaveStatus('unsaved');
    } finally {
      setSaving(false);
    }
  }, [title, subtitle, excerpt, category, tags, blocks, featuredImageUrl, featuredImageAlt, seoTitle, seoDescription, relatedPostIds, isNew, post, saving, navigate]);

  const handlePublish = async () => {
    if (!post) return;
    // Save first
    await handleSave();
    try {
      const { data } = await adminApi.publishPost(post.id);
      setPost(data.post);
    } catch (err) {
      console.error('Failed to publish:', err);
    }
  };

  const handleUnpublish = async () => {
    if (!post) return;
    try {
      const { data } = await adminApi.unpublishPost(post.id);
      setPost(data.post);
    } catch (err) {
      console.error('Failed to unpublish:', err);
    }
  };

  // Block operations
  const addBlock = (type: string) => {
    const newBlock: BlogContentBlock = {
      id: crypto.randomUUID(),
      type: type as BlogContentBlock['type'],
      props: getDefaultProps(type),
    };
    setBlocks(prev => [...prev, newBlock]);
  };

  const updateBlock = (blockId: string, props: Record<string, unknown>) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, props: { ...b.props, ...props } } : b));
  };

  const deleteBlock = (blockId: string) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks(prev => {
        const oldIndex = prev.findIndex(b => b.id === active.id);
        const newIndex = prev.findIndex(b => b.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags(prev => [...prev, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  // Related posts search (debounced)
  const handleRelatedSearch = (query: string) => {
    setRelatedSearch(query);
    if (relatedSearchTimer.current) clearTimeout(relatedSearchTimer.current);
    if (!query.trim()) {
      setRelatedSearchResults([]);
      return;
    }
    relatedSearchTimer.current = setTimeout(async () => {
      setRelatedSearching(true);
      try {
        const { data } = await adminApi.listPosts({ search: query, limit: 10 });
        // Filter out current post and already-selected posts
        setRelatedSearchResults(
          data.posts.filter((p: BlogPostSummary) => p.id !== id && !relatedPostIds.includes(p.id))
        );
      } catch {
        setRelatedSearchResults([]);
      } finally {
        setRelatedSearching(false);
      }
    }, 300);
  };

  const addRelatedPost = (p: BlogPostSummary) => {
    if (relatedPostIds.length >= 5) return;
    setRelatedPostIds(prev => [...prev, p.id]);
    setRelatedPostDetails(prev => [...prev, p]);
    setRelatedSearch('');
    setRelatedSearchResults([]);
  };

  const removeRelatedPost = (postId: string) => {
    setRelatedPostIds(prev => prev.filter(rid => rid !== postId));
    setRelatedPostDetails(prev => prev.filter(p => p.id !== postId));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <div className="h-10 bg-white/[0.02] rounded animate-pulse" />
          <div className="h-64 bg-white/[0.02] rounded animate-pulse" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Helmet><title>Admin: Post Editor | PagePulser</title></Helmet>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/cms/posts"
              className="p-2 text-slate-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
                {isNew ? 'New Post' : 'Edit Post'}
              </h1>
              {post && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    post.status === 'published' ? 'bg-green-500/20 text-green-300' :
                    post.status === 'archived' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-slate-500/20 text-slate-300'
                  }`}>
                    {post.status}
                  </span>
                  {saveStatus !== 'idle' && (
                    <span className={`text-xs ${
                      saveStatus === 'saved' ? 'text-green-400' :
                      saveStatus === 'saving' ? 'text-amber-400' :
                      'text-red-400'
                    }`}>
                      {saveStatus === 'saved' ? 'Saved' :
                       saveStatus === 'saving' ? 'Saving...' :
                       'Unsaved changes'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white border border-white/[0.06] rounded-lg transition-colors"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/[0.06] hover:bg-white/[0.06] rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            {post?.status === 'published' && post.slug && (
              <a
                href={`/blog/${post.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white border border-white/[0.06] rounded-lg transition-colors"
                title="View published post"
              >
                <ExternalLink className="w-4 h-4" />
                View
              </a>
            )}
            {post?.status === 'published' ? (
              <button
                onClick={handleUnpublish}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 rounded-lg transition-colors"
              >
                Unpublish
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={!title || !excerpt}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Publish
              </button>
            )}
          </div>
        </div>

        {showPreview ? (
          /* Preview Mode */
          <div className="bg-white rounded-lg p-8 max-w-3xl mx-auto">
            <article className="prose prose-lg max-w-none">
              {featuredImageUrl && (
                <img src={featuredImageUrl} alt={featuredImageAlt} className="w-full rounded-lg mb-6" />
              )}
              <h1 className="text-3xl font-bold text-slate-900">{title || 'Untitled'}</h1>
              {subtitle && <p className="text-xl text-slate-500 mt-2">{subtitle}</p>}
              <div className="mt-8 space-y-6">
                {blocks.map(block => (
                  <BlockDisplay key={block.id} block={block} />
                ))}
              </div>
            </article>
          </div>
        ) : (
          /* Editor Mode */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-4">
              {/* Title */}
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Post title..."
                className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-lg text-xl font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />

              {/* Subtitle */}
              <input
                type="text"
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                placeholder="Subtitle (optional)..."
                className="w-full px-4 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />

              {/* Blocks */}
              <div className="space-y-3">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={blocks.map(b => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {blocks.map(block => (
                      <SortableBlock
                        key={block.id}
                        block={block}
                        onUpdate={(props) => updateBlock(block.id, props)}
                        onDelete={() => deleteBlock(block.id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                {blocks.length === 0 && (
                  <div className="text-center py-12 bg-white/[0.02] border border-white/[0.06] border-dashed rounded-lg">
                    <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">
                      Add your first content block to get started
                    </p>
                  </div>
                )}

                <AddBlockMenu onAdd={addBlock} />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Excerpt */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
                <label className="text-xs font-medium text-slate-500 mb-2 block">Excerpt</label>
                <textarea
                  value={excerpt}
                  onChange={e => setExcerpt(e.target.value)}
                  placeholder="Brief description for cards and meta..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
                <div className="text-xs text-slate-500 mt-1 text-right">{excerpt.length}/500</div>
              </div>

              {/* Category */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
                <label className="text-xs font-medium text-slate-500 mb-2 block">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as BlogPostCategory)}
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
                <label className="text-xs font-medium text-slate-500 mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-full flex items-center gap-1"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-white">
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tag..."
                    maxLength={30}
                    className="flex-1 px-3 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <button
                    onClick={addTag}
                    disabled={!tagInput.trim() || tags.length >= 10}
                    className="px-3 py-1.5 text-xs font-medium text-indigo-400 border border-indigo-500/30 rounded hover:bg-indigo-500/10 disabled:opacity-50 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Related Posts */}
              {!isNew && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
                  <label className="text-xs font-medium text-slate-500 mb-2 block">
                    <Link2 className="w-3.5 h-3.5 inline mr-1" />
                    Related Posts
                  </label>
                  {relatedPostDetails.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {relatedPostDetails.map(rp => (
                        <div key={rp.id} className="flex items-center justify-between gap-2 px-2 py-1.5 bg-white/[0.03] rounded text-sm">
                          <span className={`text-slate-200 truncate ${rp.status !== 'published' ? 'line-through opacity-60' : ''}`}>
                            {rp.title}
                          </span>
                          <button onClick={() => removeRelatedPost(rp.id)} className="text-slate-500 hover:text-red-400 flex-shrink-0">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {relatedPostIds.length < 5 && (
                    <div className="relative">
                      <div className="flex items-center gap-1 px-3 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded text-sm">
                        <Search className="w-3.5 h-3.5 text-slate-500" />
                        <input
                          type="text"
                          value={relatedSearch}
                          onChange={e => handleRelatedSearch(e.target.value)}
                          placeholder="Search posts..."
                          className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none"
                        />
                      </div>
                      {relatedSearchResults.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white/[0.02] border border-white/[0.08] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {relatedSearchResults.map(rp => (
                            <button
                              key={rp.id}
                              onClick={() => addRelatedPost(rp)}
                              className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-white/[0.06] transition-colors truncate"
                            >
                              {rp.title}
                              {rp.status !== 'published' && (
                                <span className="ml-1.5 text-xs text-amber-400">({rp.status})</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      {relatedSearching && relatedSearch && (
                        <div className="absolute z-10 mt-1 w-full bg-white/[0.02] border border-white/[0.08] rounded-lg p-3 text-xs text-slate-500">
                          Searching...
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    Leave empty for automatic selection. Max 5.
                  </p>
                </div>
              )}

              {/* Featured Image */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
                <label className="text-xs font-medium text-slate-500 mb-2 block">Featured Image</label>
                {featuredImageUrl ? (
                  <div className="space-y-2">
                    <img src={featuredImageUrl} alt={featuredImageAlt} className="w-full rounded" />
                    <button
                      onClick={() => { setFeaturedImageUrl(''); setFeaturedImageAlt(''); }}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowMediaPicker(true)}
                    className="w-full py-8 border border-dashed border-white/[0.08] rounded-lg text-slate-500 hover:text-white hover:border-slate-500 transition-colors flex flex-col items-center gap-2"
                  >
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-xs">Choose image</span>
                  </button>
                )}
                {featuredImageUrl && (
                  <input
                    type="text"
                    value={featuredImageAlt}
                    onChange={e => setFeaturedImageAlt(e.target.value)}
                    placeholder="Alt text..."
                    className="w-full mt-2 px-3 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                )}
              </div>

              {/* SEO */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
                <button
                  onClick={() => setShowSeo(!showSeo)}
                  className="flex items-center justify-between w-full text-sm font-medium text-slate-300"
                >
                  SEO Settings
                  {showSeo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showSeo && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">SEO Title</label>
                      <input
                        type="text"
                        value={seoTitle}
                        onChange={e => setSeoTitle(e.target.value)}
                        placeholder={title || 'Override page title...'}
                        maxLength={200}
                        className="w-full px-3 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Meta Description</label>
                      <textarea
                        value={seoDescription}
                        onChange={e => setSeoDescription(e.target.value)}
                        placeholder={excerpt || 'Override meta description...'}
                        rows={3}
                        maxLength={400}
                        className="w-full px-3 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Post Info */}
              {post && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{post.reading_time_minutes} min read</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{post.view_count} views</span>
                  </div>
                  {post.published_at && (
                    <div className="text-xs text-slate-500">
                      Published {new Date(post.published_at).toLocaleDateString()}
                    </div>
                  )}
                  <div className="text-xs text-slate-500">
                    Updated {new Date(post.updated_at).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Media picker modal */}
        <MediaPicker
          isOpen={showMediaPicker}
          onClose={() => setShowMediaPicker(false)}
          onSelect={(url, alt) => {
            setFeaturedImageUrl(url);
            setFeaturedImageAlt(alt);
            setShowMediaPicker(false);
          }}
        />
      </div>
    </AdminLayout>
  );
}

function getDefaultProps(type: string): Record<string, unknown> {
  switch (type) {
    case 'text': return { markdown: '' };
    case 'heading': return { text: '', level: 2 };
    case 'image': return { src: '', alt: '', caption: '', width: 'content' };
    case 'callout': return { type: 'tip', title: '', markdown: '' };
    case 'code': return { language: 'javascript', code: '', filename: '' };
    case 'quote': return { text: '', attribution: '' };
    case 'divider': return {};
    case 'embed': return { url: '', caption: '' };
    case 'cta': return { text: '', url: '', variant: 'primary' };
    case 'stat_highlight': return { stat: '', description: '', source: '' };
    case 'audit_link': return { ruleId: '', customText: '' };
    case 'two_column': return { left: [], right: [] };
    default: return {};
  }
}
