import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import {
  Lightbulb,
  AlertTriangle,
  Info,
  BookOpen,
  ExternalLink,
} from 'lucide-react';

export interface ContentBlock {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

interface BlockDisplayProps {
  block: ContentBlock;
}

// ----------------------------------------------------------------
// Callout icon/colour map
// ----------------------------------------------------------------
const calloutConfig: Record<
  string,
  { icon: React.ElementType; bg: string; border: string; iconColor: string; titleColor: string }
> = {
  tip: {
    icon: Lightbulb,
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    iconColor: 'text-emerald-600',
    titleColor: 'text-emerald-900',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-900',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-900',
  },
  example: {
    icon: BookOpen,
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    iconColor: 'text-purple-600',
    titleColor: 'text-purple-900',
  },
};

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

/** Extract a YouTube or Vimeo video embed URL from a raw URL string. */
function getEmbedUrl(raw: string): string | null {
  try {
    const url = new URL(raw);

    // YouTube
    if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
      let videoId: string | null = null;
      if (url.hostname.includes('youtu.be')) {
        videoId = url.pathname.slice(1);
      } else {
        videoId = url.searchParams.get('v');
      }
      if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}`;
    }

    // Vimeo
    if (url.hostname.includes('vimeo.com')) {
      const match = url.pathname.match(/\/(\d+)/);
      if (match) return `https://player.vimeo.com/video/${match[1]}`;
    }
  } catch {
    // invalid URL – fall through
  }
  return null;
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------

export default function BlockDisplay({ block }: BlockDisplayProps) {
  const { type, props } = block;

  switch (type) {
    // ============================================================
    // TEXT (Markdown)
    // ============================================================
    case 'text': {
      const content = (props.content as string) || '';
      return (
        <div className="prose prose-slate max-w-none prose-headings:font-sans prose-a:text-indigo-600 prose-code:text-indigo-700 prose-code:bg-indigo-50 prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:before:content-[''] prose-code:after:content-[''] prose-img:rounded-lg">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
            {content}
          </ReactMarkdown>
        </div>
      );
    }

    // ============================================================
    // HEADING
    // ============================================================
    case 'heading': {
      const text = (props.text as string) || '';
      const level = (props.level as number) || 2;
      const classes = 'font-sans font-semibold text-slate-900';
      if (level === 2) return <h2 className={`${classes} text-2xl mt-10 mb-4`}>{text}</h2>;
      if (level === 3) return <h3 className={`${classes} text-xl mt-8 mb-3`}>{text}</h3>;
      return <h4 className={`${classes} text-lg mt-6 mb-2`}>{text}</h4>;
    }

    // ============================================================
    // IMAGE
    // ============================================================
    case 'image': {
      const src = (props.src as string) || '';
      const alt = (props.alt as string) || '';
      const caption = (props.caption as string) || '';
      const width = (props.width as string) || 'content';

      const widthClass =
        width === 'full' ? 'w-full' : width === 'wide' ? 'max-w-4xl mx-auto' : 'max-w-2xl mx-auto';

      return (
        <figure className={`my-8 ${widthClass}`}>
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className="w-full rounded-lg shadow-sm"
          />
          {caption && (
            <figcaption className="mt-2 text-center text-sm text-slate-500">{caption}</figcaption>
          )}
        </figure>
      );
    }

    // ============================================================
    // CALLOUT
    // ============================================================
    case 'callout': {
      const calloutType = (props.type as string) || 'info';
      const title = (props.title as string) || '';
      const body = (props.body as string) || '';
      const cfg = calloutConfig[calloutType] || calloutConfig.info;
      const Icon = cfg.icon;

      return (
        <div
          className={`my-6 rounded-lg border-l-4 ${cfg.border} ${cfg.bg} p-5`}
        >
          <div className="flex items-start gap-3">
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${cfg.iconColor}`} />
            <div className="min-w-0 flex-1">
              {title && (
                <p className={`mb-1 font-semibold ${cfg.titleColor}`}>{title}</p>
              )}
              <div className="prose prose-sm max-w-none text-slate-700">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                  {body}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ============================================================
    // CODE
    // ============================================================
    case 'code': {
      const language = (props.language as string) || '';
      const code = (props.code as string) || '';
      const filename = (props.filename as string) || '';

      return (
        <div className="my-6 overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
          {filename && (
            <div className="border-b border-slate-700 bg-slate-800 px-4 py-2 text-xs font-mono text-slate-500">
              {filename}
            </div>
          )}
          <pre className="overflow-x-auto p-4">
            <code className={`text-sm font-mono text-slate-100 ${language ? `language-${language}` : ''}`}>
              {code}
            </code>
          </pre>
        </div>
      );
    }

    // ============================================================
    // QUOTE
    // ============================================================
    case 'quote': {
      const text = (props.text as string) || '';
      const attribution = (props.attribution as string) || '';

      return (
        <blockquote className="my-8 border-l-4 border-indigo-300 bg-indigo-50/50 py-4 pl-6 pr-4">
          <p className="text-lg italic text-slate-700">{text}</p>
          {attribution && (
            <cite className="mt-2 block text-sm font-medium not-italic text-slate-500">
              -- {attribution}
            </cite>
          )}
        </blockquote>
      );
    }

    // ============================================================
    // DIVIDER
    // ============================================================
    case 'divider': {
      return <hr className="my-10 border-t border-slate-200" />;
    }

    // ============================================================
    // EMBED (YouTube / Vimeo)
    // ============================================================
    case 'embed': {
      const rawUrl = (props.url as string) || '';
      const embedUrl = getEmbedUrl(rawUrl);

      if (!embedUrl) {
        return (
          <div className="my-6 rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Unsupported embed URL
          </div>
        );
      }

      return (
        <div className="my-8 aspect-video w-full overflow-hidden rounded-lg shadow-sm">
          <iframe
            src={embedUrl}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Embedded video"
          />
        </div>
      );
    }

    // ============================================================
    // CTA
    // ============================================================
    case 'cta': {
      const text = (props.text as string) || 'Learn more';
      const url = (props.url as string) || '#';
      const variant = (props.variant as string) || 'primary';

      const btnClasses =
        variant === 'primary'
          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50';

      return (
        <div className="my-8 text-center">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-semibold transition-colors ${btnClasses}`}
          >
            {text}
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      );
    }

    // ============================================================
    // STAT HIGHLIGHT
    // ============================================================
    case 'stat_highlight': {
      const stat = (props.stat as string) || '';
      const description = (props.description as string) || '';
      const source = (props.source as string) || '';

      return (
        <div className="my-8 rounded-lg border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-8 text-center">
          <p className="font-display text-5xl font-normal text-indigo-600">{stat}</p>
          <p className="mt-3 text-base text-slate-700">{description}</p>
          {source && (
            <p className="mt-2 text-xs text-slate-500">Source: {source}</p>
          )}
        </div>
      );
    }

    // ============================================================
    // AUDIT LINK
    // ============================================================
    case 'audit_link': {
      const ruleId = (props.ruleId as string) || '';
      const customText = (props.customText as string) || `View rule: ${ruleId}`;

      return (
        <div className="my-6 flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
            <ExternalLink className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-900">{customText}</p>
            <p className="truncate text-sm text-slate-500">{ruleId}</p>
          </div>
        </div>
      );
    }

    // ============================================================
    // TWO COLUMN
    // ============================================================
    case 'two_column': {
      const left = (props.left as ContentBlock[]) || [];
      const right = (props.right as ContentBlock[]) || [];

      return (
        <div className="my-8 grid gap-8 md:grid-cols-2">
          <div>
            {left.map((child) => (
              <BlockDisplay key={child.id} block={child} />
            ))}
          </div>
          <div>
            {right.map((child) => (
              <BlockDisplay key={child.id} block={child} />
            ))}
          </div>
        </div>
      );
    }

    // ============================================================
    // UNKNOWN
    // ============================================================
    default: {
      return (
        <div className="my-4 rounded border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
          Unknown block type: <code>{type}</code>
        </div>
      );
    }
  }
}
