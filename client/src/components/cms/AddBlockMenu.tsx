import { useState } from 'react';
import {
  Plus,
  Type,
  Heading,
  Image,
  MessageSquareQuote,
  Code,
  Quote,
  Minus,
  Play,
  MousePointerClick,
  BarChart3,
  Link2,
  Columns2,
} from 'lucide-react';

interface AddBlockMenuProps {
  onAdd: (type: string) => void;
}

const blockTypes = [
  { type: 'text', label: 'Text', icon: Type, description: 'Markdown rich text' },
  { type: 'heading', label: 'Heading', icon: Heading, description: 'Section heading' },
  { type: 'image', label: 'Image', icon: Image, description: 'Image with caption' },
  { type: 'callout', label: 'Callout', icon: MessageSquareQuote, description: 'Tip, warning, or info box' },
  { type: 'code', label: 'Code', icon: Code, description: 'Code block with syntax' },
  { type: 'quote', label: 'Quote', icon: Quote, description: 'Blockquote with attribution' },
  { type: 'divider', label: 'Divider', icon: Minus, description: 'Horizontal rule' },
  { type: 'embed', label: 'Embed', icon: Play, description: 'YouTube or Vimeo video' },
  { type: 'cta', label: 'CTA', icon: MousePointerClick, description: 'Call-to-action button' },
  { type: 'stat_highlight', label: 'Stat', icon: BarChart3, description: 'Large stat number' },
  { type: 'audit_link', label: 'Audit Link', icon: Link2, description: 'Link to audit rule' },
  { type: 'two_column', label: 'Two Column', icon: Columns2, description: 'Side-by-side layout' },
] as const;

export default function AddBlockMenu({ onAdd }: AddBlockMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAdd = (type: string) => {
    onAdd(type);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-600 bg-slate-800/50 px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:border-indigo-500 hover:bg-slate-800 hover:text-indigo-400"
      >
        <Plus className="h-4 w-4" />
        Add Block
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute left-0 right-0 z-20 mt-2 rounded-lg border border-slate-700 bg-slate-800 p-3 shadow-xl">
            <div className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-slate-500">
              Block Types
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
              {blockTypes.map(({ type, label, icon: Icon, description }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleAdd(type)}
                  title={description}
                  className="flex flex-col items-center gap-1.5 rounded-md px-2 py-3 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                >
                  <Icon className="h-5 w-5 text-slate-400" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
