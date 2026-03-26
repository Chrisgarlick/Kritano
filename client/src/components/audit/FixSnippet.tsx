import { useState, useId } from 'react';
import { ChevronDown, Copy, Check, ExternalLink, Lock } from 'lucide-react';
import { Body } from '../ui/Typography';
import type { FixSnippet as FixSnippetType } from '../../types/audit.types';

interface FixSnippetProps {
  fixSnippet: FixSnippetType;
}

/**
 * Lightweight regex-based syntax highlighting for code snippets.
 * Uses design system colours: indigo-400 (keywords), emerald-400 (strings), slate-500 (comments).
 */
export function highlightCode(code: string, language: string): string {
  // Escape HTML first
  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Comments (must run before strings to avoid partial matches inside comments)
  // HTML comments
  html = html.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span style="color:#64748b">$1</span>');
  // Single-line comments (// and #)
  html = html.replace(/(\/\/.*$|#.*$)/gm, '<span style="color:#64748b">$1</span>');
  // Multi-line comments
  html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#64748b">$1</span>');

  // Strings (double and single quoted)
  html = html.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span style="color:#34d399">$1</span>');

  if (language === 'html' || language === 'config') {
    // HTML tags and attributes
    html = html.replace(/(&lt;\/?)([\w-]+)/g, '$1<span style="color:#818cf8">$2</span>');
    html = html.replace(/\b(class|id|href|src|alt|type|rel|name|content|charset|lang|role|aria-[\w-]+)(=)/g,
      '<span style="color:#818cf8">$1</span>$2');
  } else if (language === 'css') {
    // CSS properties
    html = html.replace(/\b(display|margin|padding|color|background|font-size|font-weight|border|width|height|position|top|left|right|bottom|flex|grid|gap|align-items|justify-content|text-align|overflow|opacity|z-index|transition|transform|content|outline|box-shadow|border-radius)(\s*:)/gi,
      '<span style="color:#818cf8">$1</span>$2');
  } else if (language === 'javascript' || language === 'json') {
    // JS keywords
    html = html.replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|new|this|true|false|null|undefined|async|await)\b/g,
      '<span style="color:#818cf8">$1</span>');
  }

  return html;
}

const effortConfig = {
  small: {
    label: 'Quick fix',
    classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  medium: {
    label: 'Medium effort',
    classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  large: {
    label: 'Significant effort',
    classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
} as const;

export function FixSnippetAccordion({ fixSnippet }: FixSnippetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const panelId = useId();
  const triggerId = useId();

  const effort = effortConfig[fixSnippet.effort];
  const hasCode = !!fixSnippet.code;

  const handleCopy = async () => {
    if (!fixSnippet.code) return;
    try {
      await navigator.clipboard.writeText(fixSnippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = fixSnippet.code;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Trigger */}
      <button
        id={triggerId}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 motion-reduce:transition-none ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
        <span>How to Fix</span>
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${effort.classes}`}
        >
          {effort.label}
        </span>
      </button>

      {/* Panel */}
      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        className={`grid transition-all duration-200 ease-out motion-reduce:transition-none ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
        <div className="px-4 pb-4 pt-1 space-y-3">
          {/* Explanation */}
          <Body size="sm" className="text-slate-600 dark:text-slate-400">
            {fixSnippet.explanation}
          </Body>

          {/* Code block (Starter+ only) */}
          {hasCode ? (
            <div className="relative group">
              <pre className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-slate-100 overflow-x-auto whitespace-pre-wrap break-words">
                <code dangerouslySetInnerHTML={{ __html: highlightCode(fixSnippet.code!, fixSnippet.language) }} />
              </pre>

              {/* Copy button */}
              <button
                type="button"
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label={copied ? 'Copied' : 'Copy code to clipboard'}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                ) : (
                  <Copy className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          ) : (
            /* Free tier: upgrade nudge instead of code */
            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
              <Body size="xs" className="text-slate-500 dark:text-slate-500">
                Upgrade to Starter to see the code fix snippet.
              </Body>
            </div>
          )}

          {/* Learn more link */}
          {fixSnippet.learnMoreUrl && (
            <a
              href={fixSnippet.learnMoreUrl}
              target={fixSnippet.learnMoreUrl.startsWith('/') ? undefined : '_blank'}
              rel={fixSnippet.learnMoreUrl.startsWith('/') ? undefined : 'noopener noreferrer'}
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
            >
              Learn more
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
