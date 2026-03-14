import type { ContentBlock } from './BlockDisplay';

interface BlockRendererProps {
  block: ContentBlock;
  onUpdate: (props: Record<string, unknown>) => void;
}

// ----------------------------------------------------------------
// Shared input styling
// ----------------------------------------------------------------
const inputClasses =
  'w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';

const textareaClasses =
  'w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 font-mono transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y';

const selectClasses =
  'rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';

const labelClasses = 'block text-xs font-medium text-slate-400 mb-1';

export default function BlockRenderer({ block, onUpdate }: BlockRendererProps) {
  const { type, props } = block;

  const updateProp = (key: string, value: unknown) => {
    onUpdate({ ...props, [key]: value });
  };

  switch (type) {
    // ============================================================
    // TEXT
    // ============================================================
    case 'text': {
      return (
        <div>
          <label className={labelClasses}>Markdown Content</label>
          <textarea
            className={textareaClasses}
            rows={6}
            value={(props.content as string) || ''}
            onChange={(e) => updateProp('content', e.target.value)}
            placeholder="Write your content in Markdown..."
          />
        </div>
      );
    }

    // ============================================================
    // HEADING
    // ============================================================
    case 'heading': {
      return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className={labelClasses}>Heading Text</label>
            <input
              type="text"
              className={inputClasses}
              value={(props.text as string) || ''}
              onChange={(e) => updateProp('text', e.target.value)}
              placeholder="Section heading..."
            />
          </div>
          <div className="w-24 shrink-0">
            <label className={labelClasses}>Level</label>
            <select
              className={`${selectClasses} w-full`}
              value={(props.level as number) || 2}
              onChange={(e) => updateProp('level', parseInt(e.target.value, 10))}
            >
              <option value={2}>H2</option>
              <option value={3}>H3</option>
              <option value={4}>H4</option>
            </select>
          </div>
        </div>
      );
    }

    // ============================================================
    // IMAGE
    // ============================================================
    case 'image': {
      return (
        <div className="flex flex-col gap-3">
          <div>
            <label className={labelClasses}>Image URL</label>
            <input
              type="text"
              className={inputClasses}
              value={(props.src as string) || ''}
              onChange={(e) => updateProp('src', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClasses}>Alt Text</label>
              <input
                type="text"
                className={inputClasses}
                value={(props.alt as string) || ''}
                onChange={(e) => updateProp('alt', e.target.value)}
                placeholder="Describe the image..."
              />
            </div>
            <div>
              <label className={labelClasses}>Caption</label>
              <input
                type="text"
                className={inputClasses}
                value={(props.caption as string) || ''}
                onChange={(e) => updateProp('caption', e.target.value)}
                placeholder="Optional caption text"
              />
            </div>
          </div>
          <div className="w-40">
            <label className={labelClasses}>Width</label>
            <select
              className={`${selectClasses} w-full`}
              value={(props.width as string) || 'content'}
              onChange={(e) => updateProp('width', e.target.value)}
            >
              <option value="content">Content</option>
              <option value="wide">Wide</option>
              <option value="full">Full</option>
            </select>
          </div>
        </div>
      );
    }

    // ============================================================
    // CALLOUT
    // ============================================================
    case 'callout': {
      return (
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClasses}>Type</label>
              <select
                className={`${selectClasses} w-full`}
                value={(props.type as string) || 'info'}
                onChange={(e) => updateProp('type', e.target.value)}
              >
                <option value="tip">Tip</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
                <option value="example">Example</option>
              </select>
            </div>
            <div>
              <label className={labelClasses}>Title</label>
              <input
                type="text"
                className={inputClasses}
                value={(props.title as string) || ''}
                onChange={(e) => updateProp('title', e.target.value)}
                placeholder="Callout title..."
              />
            </div>
          </div>
          <div>
            <label className={labelClasses}>Body (Markdown)</label>
            <textarea
              className={textareaClasses}
              rows={4}
              value={(props.body as string) || ''}
              onChange={(e) => updateProp('body', e.target.value)}
              placeholder="Callout body content..."
            />
          </div>
        </div>
      );
    }

    // ============================================================
    // CODE
    // ============================================================
    case 'code': {
      return (
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClasses}>Language</label>
              <input
                type="text"
                className={inputClasses}
                value={(props.language as string) || ''}
                onChange={(e) => updateProp('language', e.target.value)}
                placeholder="javascript, python, html..."
              />
            </div>
            <div>
              <label className={labelClasses}>Filename</label>
              <input
                type="text"
                className={inputClasses}
                value={(props.filename as string) || ''}
                onChange={(e) => updateProp('filename', e.target.value)}
                placeholder="Optional filename"
              />
            </div>
          </div>
          <div>
            <label className={labelClasses}>Code</label>
            <textarea
              className={textareaClasses}
              rows={8}
              value={(props.code as string) || ''}
              onChange={(e) => updateProp('code', e.target.value)}
              placeholder="Paste your code here..."
            />
          </div>
        </div>
      );
    }

    // ============================================================
    // QUOTE
    // ============================================================
    case 'quote': {
      return (
        <div className="flex flex-col gap-3">
          <div>
            <label className={labelClasses}>Quote Text</label>
            <textarea
              className={textareaClasses}
              rows={3}
              value={(props.text as string) || ''}
              onChange={(e) => updateProp('text', e.target.value)}
              placeholder="Enter the quote..."
            />
          </div>
          <div>
            <label className={labelClasses}>Attribution</label>
            <input
              type="text"
              className={inputClasses}
              value={(props.attribution as string) || ''}
              onChange={(e) => updateProp('attribution', e.target.value)}
              placeholder="Who said this?"
            />
          </div>
        </div>
      );
    }

    // ============================================================
    // DIVIDER
    // ============================================================
    case 'divider': {
      return (
        <div className="flex items-center gap-3 py-1">
          <hr className="flex-1 border-slate-600" />
          <span className="text-xs text-slate-500">Horizontal Rule</span>
          <hr className="flex-1 border-slate-600" />
        </div>
      );
    }

    // ============================================================
    // EMBED
    // ============================================================
    case 'embed': {
      return (
        <div>
          <label className={labelClasses}>Video URL</label>
          <input
            type="text"
            className={inputClasses}
            value={(props.url as string) || ''}
            onChange={(e) => updateProp('url', e.target.value)}
            placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
          />
          <p className="mt-1 text-xs text-slate-500">Supports YouTube and Vimeo URLs</p>
        </div>
      );
    }

    // ============================================================
    // CTA
    // ============================================================
    case 'cta': {
      return (
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClasses}>Button Text</label>
              <input
                type="text"
                className={inputClasses}
                value={(props.text as string) || ''}
                onChange={(e) => updateProp('text', e.target.value)}
                placeholder="Learn more"
              />
            </div>
            <div>
              <label className={labelClasses}>URL</label>
              <input
                type="text"
                className={inputClasses}
                value={(props.url as string) || ''}
                onChange={(e) => updateProp('url', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="w-40">
            <label className={labelClasses}>Variant</label>
            <select
              className={`${selectClasses} w-full`}
              value={(props.variant as string) || 'primary'}
              onChange={(e) => updateProp('variant', e.target.value)}
            >
              <option value="primary">Primary (Indigo)</option>
              <option value="secondary">Secondary (Slate)</option>
            </select>
          </div>
        </div>
      );
    }

    // ============================================================
    // STAT HIGHLIGHT
    // ============================================================
    case 'stat_highlight': {
      return (
        <div className="flex flex-col gap-3">
          <div>
            <label className={labelClasses}>Stat Value</label>
            <input
              type="text"
              className={inputClasses}
              value={(props.stat as string) || ''}
              onChange={(e) => updateProp('stat', e.target.value)}
              placeholder="93% or 10x or $1.2M"
            />
          </div>
          <div>
            <label className={labelClasses}>Description</label>
            <textarea
              className={textareaClasses}
              rows={2}
              value={(props.description as string) || ''}
              onChange={(e) => updateProp('description', e.target.value)}
              placeholder="Describe what this stat means..."
            />
          </div>
          <div>
            <label className={labelClasses}>Source (optional)</label>
            <input
              type="text"
              className={inputClasses}
              value={(props.source as string) || ''}
              onChange={(e) => updateProp('source', e.target.value)}
              placeholder="Where this data comes from"
            />
          </div>
        </div>
      );
    }

    // ============================================================
    // AUDIT LINK
    // ============================================================
    case 'audit_link': {
      return (
        <div className="flex flex-col gap-3">
          <div>
            <label className={labelClasses}>Rule ID</label>
            <input
              type="text"
              className={inputClasses}
              value={(props.ruleId as string) || ''}
              onChange={(e) => updateProp('ruleId', e.target.value)}
              placeholder="e.g. seo-missing-meta-description"
            />
          </div>
          <div>
            <label className={labelClasses}>Custom Text</label>
            <input
              type="text"
              className={inputClasses}
              value={(props.customText as string) || ''}
              onChange={(e) => updateProp('customText', e.target.value)}
              placeholder="Display text for the link"
            />
          </div>
        </div>
      );
    }

    // ============================================================
    // TWO COLUMN
    // ============================================================
    case 'two_column': {
      return (
        <div className="flex items-center gap-3 rounded-md border border-dashed border-slate-600 bg-slate-900/50 px-4 py-6">
          <div className="flex-1 text-center text-sm text-slate-500">
            Two column layout — nested block editing coming soon
          </div>
        </div>
      );
    }

    // ============================================================
    // UNKNOWN
    // ============================================================
    default: {
      return (
        <div className="rounded-md border border-dashed border-slate-600 bg-slate-900/50 p-4 text-sm text-slate-500">
          No editor available for block type: <code className="text-slate-400">{type}</code>
        </div>
      );
    }
  }
}
