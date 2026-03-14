import { GripVertical, X } from 'lucide-react';
import type { ContentBlock } from './BlockDisplay';

export interface DragHandleProps {
  [key: string]: unknown;
}

interface BlockWrapperProps {
  block: ContentBlock;
  onDelete: () => void;
  dragHandleProps?: DragHandleProps;
  children: React.ReactNode;
}

const typeLabels: Record<string, string> = {
  text: 'Text',
  heading: 'Heading',
  image: 'Image',
  callout: 'Callout',
  code: 'Code',
  quote: 'Quote',
  divider: 'Divider',
  embed: 'Embed',
  cta: 'CTA',
  stat_highlight: 'Stat',
  audit_link: 'Audit Link',
  two_column: 'Two Column',
};

export default function BlockWrapper({
  block,
  onDelete,
  dragHandleProps,
  children,
}: BlockWrapperProps) {
  return (
    <div className="group relative rounded-lg border border-slate-700 bg-slate-800 transition-colors hover:border-slate-600">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-700 px-3 py-1.5">
        <div className="flex items-center gap-2">
          {/* Drag handle */}
          <button
            type="button"
            className="cursor-grab touch-none rounded p-0.5 text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300 active:cursor-grabbing"
            {...dragHandleProps}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Type badge */}
          <span className="rounded bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-400">
            {typeLabels[block.type] || block.type}
          </span>
        </div>

        {/* Delete button */}
        <button
          type="button"
          onClick={() => onDelete()}
          className="rounded p-1 text-slate-500 opacity-0 transition-all hover:bg-red-900/30 hover:text-red-400 group-hover:opacity-100"
          title="Delete block"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Block content */}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
