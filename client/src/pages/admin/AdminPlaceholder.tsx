/**
 * Admin Placeholder Page
 *
 * Used for Phase 0 route stubs — replaced with real implementations in later phases.
 */

import { Helmet } from 'react-helmet-async';
import { AdminLayout } from '../../components/layout/AdminLayout';
import type { LucideIcon } from 'lucide-react';

interface AdminPlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  phase?: string;
}

export default function AdminPlaceholder({ title, description, icon: Icon, phase }: AdminPlaceholderProps) {
  return (
    <AdminLayout>
      <Helmet><title>{`Admin: ${title} | Kritano`}</title></Helmet>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-6">
          <Icon className="w-8 h-8 text-slate-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
        <p className="text-slate-500 max-w-md mb-4">{description}</p>
        {phase && (
          <span className="text-xs px-3 py-1 rounded-full bg-indigo-600/20 text-indigo-300 font-medium">
            {phase}
          </span>
        )}
      </div>
    </AdminLayout>
  );
}
