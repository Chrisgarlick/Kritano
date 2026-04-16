import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

type Method = 'GET' | 'POST' | 'DELETE' | 'PATCH';

interface Props {
  method: Method;
  path: string;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const METHOD_STYLES: Record<Method, string> = {
  GET: 'bg-emerald-100 text-emerald-700',
  POST: 'bg-indigo-100 text-indigo-700',
  DELETE: 'bg-red-100 text-red-700',
  PATCH: 'bg-amber-100 text-amber-700',
};

export default function EndpointCard({ method, path, description, children, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200 rounded-lg my-5 overflow-hidden hover:border-slate-300 transition-colors">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-3 w-full px-5 py-4 bg-slate-50 border-b border-slate-200 text-left"
      >
        <span className={`text-[11px] font-bold font-mono uppercase px-2.5 py-1 rounded ${METHOD_STYLES[method]}`}>
          {method}
        </span>
        <span className="font-mono text-sm font-medium text-slate-800">{path}</span>
        <span className="text-sm text-slate-600 ml-2 hidden sm:inline">{description}</span>
        <ChevronDown className={`w-4 h-4 text-slate-600 ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="p-5">
          <p className="text-slate-600 text-sm mb-4 sm:hidden">{description}</p>
          {children}
        </div>
      )}
    </div>
  );
}
