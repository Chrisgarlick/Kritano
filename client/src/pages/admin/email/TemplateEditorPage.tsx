/**
 * Email Template Editor
 *
 * Block-based editor with side panel for block settings and live preview.
 * Supports creating new templates and editing existing ones.
 */

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { adminApi } from '../../../services/api';
import {
  ArrowLeft, Save, Send, Eye, Monitor, Smartphone,
  Trash2, GripVertical, ChevronUp, ChevronDown,
  Type, Image, MousePointerClick, Columns2, Minus, Space,
  BarChart3, AlertTriangle, FileText,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'transactional', label: 'Transactional' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'upgrade', label: 'Upgrade' },
  { value: 'security', label: 'Security' },
  { value: 'win_back', label: 'Win Back' },
  { value: 'educational', label: 'Educational' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'digest', label: 'Digest' },
];

interface Block {
  type: string;
  [key: string]: unknown;
}

const BLOCK_TYPES = [
  { type: 'header', label: 'Header', icon: FileText },
  { type: 'text', label: 'Text', icon: Type },
  { type: 'button', label: 'Button', icon: MousePointerClick },
  { type: 'hero_image', label: 'Hero Image', icon: Image },
  { type: 'two_column', label: 'Two Column', icon: Columns2 },
  { type: 'divider', label: 'Divider', icon: Minus },
  { type: 'spacer', label: 'Spacer', icon: Space },
  { type: 'score_table', label: 'Score Table', icon: BarChart3 },
  { type: 'issues_summary', label: 'Issues', icon: AlertTriangle },
  { type: 'footer', label: 'Footer', icon: FileText },
];

function createDefaultBlock(type: string): Block {
  switch (type) {
    case 'header': return { type: 'header' };
    case 'text': return { type: 'text', content: 'Enter your text here...', fontSize: 'md', align: 'left' };
    case 'button': return { type: 'button', label: 'Click Here', href: '{{appUrl}}', align: 'center' };
    case 'hero_image': return { type: 'hero_image', src: '', alt: 'Hero image' };
    case 'two_column': return { type: 'two_column', left: [{ type: 'text', content: 'Left column' }], right: [{ type: 'text', content: 'Right column' }], ratio: '50:50' };
    case 'divider': return { type: 'divider' };
    case 'spacer': return { type: 'spacer', height: '20px' };
    case 'score_table': return { type: 'score_table' };
    case 'issues_summary': return { type: 'issues_summary' };
    case 'footer': return { type: 'footer', includeUnsubscribe: true };
    default: return { type };
  }
}

export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);

  // Template form state
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [category, setCategory] = useState('transactional');
  const [variables, setVariables] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([
    { type: 'header' },
    { type: 'text', content: 'Hi {{firstName}},', fontSize: 'lg' },
    { type: 'text', content: 'Enter your email content here.' },
    { type: 'divider' },
    { type: 'footer', includeUnsubscribe: true },
  ]);
  const [isSystem, setIsSystem] = useState(false);

  // Load existing template
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data: res } = await adminApi.getTemplate(id);
        const t = res.template;
        setSlug(t.slug);
        setName(t.name);
        setDescription(t.description || '');
        setSubject(t.subject);
        setPreviewText(t.preview_text || '');
        setCategory(t.category);
        setVariables((t.variables || []).join(', '));
        setBlocks(t.blocks as Block[]);
        setIsSystem(t.is_system);
      } catch (err) {
        console.error('Failed to load template:', err);
        navigate('/admin/email/templates');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSave = async () => {
    if (!name || !subject || !slug) {
      alert('Name, slug, and subject are required.');
      return;
    }
    setSaving(true);
    try {
      const data = {
        slug,
        name,
        description: description || undefined,
        subject,
        preview_text: previewText || undefined,
        blocks,
        category,
        variables: variables ? variables.split(',').map(v => v.trim()).filter(Boolean) : [],
      };

      if (isNew) {
        const { data: res } = await adminApi.createTemplate(data);
        navigate(`/admin/email/templates/${res.template.id}`);
      } else {
        await adminApi.updateTemplate(id!, data);
      }
    } catch (err) {
      alert('Failed to save template. Check that the slug is unique.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!id && isNew) {
      alert('Save the template first to preview it.');
      return;
    }
    try {
      const { data: res } = await adminApi.previewTemplate(id!);
      setPreviewHtml(res.html);
      setShowPreview(true);
    } catch (err) {
      alert('Failed to generate preview.');
    }
  };

  const handleTestSend = async () => {
    if (!id) {
      alert('Save the template first to send a test.');
      return;
    }
    setTesting(true);
    try {
      const { data: res } = await adminApi.testSendTemplate(id);
      alert(`Test email sent to ${res.sentTo}`);
    } catch (err) {
      alert('Failed to send test email.');
    } finally {
      setTesting(false);
    }
  };

  const addBlock = (type: string) => {
    const newBlock = createDefaultBlock(type);
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlockIndex(blocks.length);
  };

  const removeBlock = (index: number) => {
    setBlocks(prev => prev.filter((_, i) => i !== index));
    setSelectedBlockIndex(null);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    setBlocks(newBlocks);
    setSelectedBlockIndex(newIndex);
  };

  const updateBlock = (index: number, updates: Partial<Block>) => {
    setBlocks(prev => prev.map((b, i) => i === index ? { ...b, ...updates } : b));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-white/[0.02] rounded" />
          <div className="h-96 bg-white/[0.02] rounded-lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Helmet><title>Admin: Template Editor | Kritano</title></Helmet>
      <div className="space-y-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/email/templates"
              className="p-2 text-slate-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-tight font-display">
              {isNew ? 'New Template' : `Edit: ${name}`}
            </h1>
            {isSystem && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-500">
                System
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isNew && (
              <>
                <button
                  onClick={handlePreview}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 hover:text-white border border-white/[0.06] rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={handleTestSend}
                  disabled={testing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 hover:text-white border border-white/[0.06] rounded-lg transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {testing ? 'Sending...' : 'Send Test'}
                </button>
              </>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Main Layout: Settings + Canvas */}
        <div className="flex gap-4">
          {/* Left Panel: Settings + Block Palette */}
          <div className="w-72 flex-shrink-0 space-y-4">
            {/* Template Settings */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">Template Settings</h3>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Welcome Email"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Slug</label>
                <input
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                  disabled={!isNew && isSystem}
                  className="w-full px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded text-sm text-white font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  placeholder="welcome_email"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Subject</label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Welcome to Kritano, {{firstName}}"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Preview Text</label>
                <input
                  value={previewText}
                  onChange={e => setPreviewText(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Shown in email client inbox"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Variables (comma-separated)</label>
                <input
                  value={variables}
                  onChange={e => setVariables(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                  placeholder="firstName, domain, auditUrl"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                  placeholder="When is this template used?"
                />
              </div>
            </div>

            {/* Block Palette */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Add Block</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {BLOCK_TYPES.map(bt => {
                  const Icon = bt.icon;
                  return (
                    <button
                      key={bt.type}
                      onClick={() => addBlock(bt.type)}
                      className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-slate-500 hover:text-white hover:bg-white/[0.04] rounded transition-colors"
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      {bt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Block Settings (when selected) */}
            {selectedBlockIndex !== null && blocks[selectedBlockIndex] && (
              <BlockSettings
                block={blocks[selectedBlockIndex]}
                onChange={(updates) => updateBlock(selectedBlockIndex, updates)}
              />
            )}
          </div>

          {/* Right: Block Canvas */}
          <div className="flex-1 min-w-0">
            {showPreview && previewHtml ? (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewMode('desktop')}
                      className={`p-1.5 rounded ${previewMode === 'desktop' ? 'text-white bg-white/[0.06]' : 'text-slate-500'}`}
                    >
                      <Monitor className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPreviewMode('mobile')}
                      className={`p-1.5 rounded ${previewMode === 'mobile' ? 'text-white bg-white/[0.06]' : 'text-slate-500'}`}
                    >
                      <Smartphone className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-xs text-slate-500 hover:text-white"
                  >
                    Back to Editor
                  </button>
                </div>
                <div className="flex justify-center p-6 bg-white/[0.03] min-h-[600px]">
                  <iframe
                    srcDoc={previewHtml}
                    className="bg-white rounded shadow-lg"
                    style={{
                      width: previewMode === 'desktop' ? '600px' : '320px',
                      height: '800px',
                      border: 'none',
                    }}
                    title="Email Preview"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Blocks ({blocks.length})
                </h3>
                <div className="space-y-2">
                  {blocks.map((block, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedBlockIndex(index)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                        selectedBlockIndex === index
                          ? 'border-indigo-500 bg-indigo-600/10'
                          : 'border-white/[0.06] hover:border-white/[0.1] bg-white/[0.02]'
                      }`}
                    >
                      <GripVertical className="w-4 h-4 text-slate-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300 font-mono">
                            {block.type}
                          </span>
                          {block.type === 'text' && (
                            <span className="text-xs text-slate-500 truncate">
                              {String(block.content || '').substring(0, 40)}
                            </span>
                          )}
                          {block.type === 'button' && (
                            <span className="text-xs text-slate-500 truncate">
                              {String(block.label || '')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveBlock(index, 'up'); }}
                          disabled={index === 0}
                          className="p-1 text-slate-500 hover:text-white disabled:opacity-20"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveBlock(index, 'down'); }}
                          disabled={index === blocks.length - 1}
                          className="p-1 text-slate-500 hover:text-white disabled:opacity-20"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeBlock(index); }}
                          className="p-1 text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {blocks.length === 0 && (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      No blocks yet. Add blocks from the palette on the left.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

/**
 * Per-block settings panel — shows context-aware form fields based on block type.
 */
function BlockSettings({ block, onChange }: { block: Block; onChange: (updates: Partial<Block>) => void }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-white">
        Block Settings: <span className="font-mono text-indigo-300">{block.type}</span>
      </h3>

      {block.type === 'text' && (
        <>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Content</label>
            <textarea
              value={String(block.content || '')}
              onChange={e => onChange({ content: e.target.value })}
              rows={4}
              className="w-full px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-indigo-500 resize-none font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Font Size</label>
              <select
                value={String(block.fontSize || 'md')}
                onChange={e => onChange({ fontSize: e.target.value })}
                className="w-full px-2 py-1 bg-white/[0.03] border border-white/[0.06] rounded text-xs text-white"
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
                <option value="xl">Extra Large</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Align</label>
              <select
                value={String(block.align || 'left')}
                onChange={e => onChange({ align: e.target.value })}
                className="w-full px-2 py-1 bg-white/[0.03] border border-white/[0.06] rounded text-xs text-white"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Color</label>
            <input
              value={String(block.color || '')}
              onChange={e => onChange({ color: e.target.value || undefined })}
              className="w-full px-3 py-1 bg-white/[0.03] border border-white/[0.06] rounded text-xs text-white font-mono"
              placeholder="#334155 (default)"
            />
          </div>
        </>
      )}

      {block.type === 'button' && (
        <>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Label</label>
            <input
              value={String(block.label || '')}
              onChange={e => onChange({ label: e.target.value })}
              className="w-full px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">URL (supports {'{{variables}}'})</label>
            <input
              value={String(block.href || '')}
              onChange={e => onChange({ href: e.target.value })}
              className="w-full px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Align</label>
            <select
              value={String(block.align || 'center')}
              onChange={e => onChange({ align: e.target.value })}
              className="w-full px-2 py-1 bg-white/[0.03] border border-white/[0.06] rounded text-xs text-white"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </>
      )}

      {block.type === 'hero_image' && (
        <>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Image URL</label>
            <input
              value={String(block.src || '')}
              onChange={e => onChange({ src: e.target.value })}
              className="w-full px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Alt Text</label>
            <input
              value={String(block.alt || '')}
              onChange={e => onChange({ alt: e.target.value })}
              className="w-full px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Link (optional)</label>
            <input
              value={String(block.href || '')}
              onChange={e => onChange({ href: e.target.value || undefined })}
              className="w-full px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </>
      )}

      {block.type === 'header' && (
        <>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Company Name (leave blank for branding default)</label>
            <input
              value={String(block.companyName || '')}
              onChange={e => onChange({ companyName: e.target.value || undefined })}
              className="w-full px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Background Color</label>
            <input
              value={String(block.backgroundColor || '')}
              onChange={e => onChange({ backgroundColor: e.target.value || undefined })}
              className="w-full px-3 py-1 bg-white/[0.03] border border-white/[0.06] rounded text-xs text-white font-mono"
              placeholder="#4f46e5 (default)"
            />
          </div>
        </>
      )}

      {block.type === 'footer' && (
        <>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Footer Text</label>
            <input
              value={String(block.text || '')}
              onChange={e => onChange({ text: e.target.value || undefined })}
              className="w-full px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded text-sm text-white focus:outline-none focus:border-indigo-500"
              placeholder="Powered by Kritano (default)"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
              <input
                type="checkbox"
                checked={block.includeUnsubscribe as boolean}
                onChange={e => onChange({ includeUnsubscribe: e.target.checked })}
                className="rounded border-white/[0.06] bg-white/[0.03] text-indigo-600 focus:ring-indigo-500"
              />
              Include unsubscribe link
            </label>
          </div>
        </>
      )}

      {block.type === 'spacer' && (
        <div>
          <label className="block text-xs text-slate-500 mb-1">Height</label>
          <input
            value={String(block.height || '20px')}
            onChange={e => onChange({ height: e.target.value })}
            className="w-full px-3 py-1 bg-white/[0.03] border border-white/[0.06] rounded text-xs text-white font-mono"
            placeholder="20px"
          />
        </div>
      )}

      {(block.type === 'score_table' || block.type === 'issues_summary') && (
        <p className="text-xs text-slate-500">
          This block is rendered dynamically from audit data at send time. No configuration needed.
        </p>
      )}
    </div>
  );
}
