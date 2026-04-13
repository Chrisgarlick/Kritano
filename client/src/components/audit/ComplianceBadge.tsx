import { CheckCircle, AlertTriangle, XCircle, HelpCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

type ComplianceStatus = 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_assessed';

interface StatusConfig {
  label: string;
  icon: typeof CheckCircle;
  pillClasses: string;
  iconClasses: string;
}

const statusConfigs: Record<ComplianceStatus, StatusConfig> = {
  compliant: {
    label: 'Compliant',
    icon: CheckCircle,
    pillClasses: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300',
    iconClasses: 'text-emerald-600 dark:text-emerald-400',
  },
  partially_compliant: {
    label: 'Partially Compliant',
    icon: AlertTriangle,
    pillClasses: 'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
    iconClasses: 'text-amber-600 dark:text-amber-400',
  },
  non_compliant: {
    label: 'Non-Compliant',
    icon: XCircle,
    pillClasses: 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    iconClasses: 'text-red-600 dark:text-red-400',
  },
  not_assessed: {
    label: 'Not Assessed',
    icon: HelpCircle,
    pillClasses: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    iconClasses: 'text-slate-400 dark:text-slate-500',
  },
};

// ─── Inline Badge (for headers/cards) ──────────────────────────────

interface InlineBadgeProps {
  status: ComplianceStatus;
  label?: string;
  className?: string;
}

export function ComplianceBadgeInline({ status, label, className = '' }: InlineBadgeProps) {
  const config = statusConfigs[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.pillClasses} ${className}`}
    >
      <Icon className={`w-3.5 h-3.5 ${config.iconClasses}`} />
      {label ? `${label} ${config.label}` : config.label}
    </span>
  );
}

// ─── Widget Card (for site detail / audit detail) ──────────────────

interface WidgetCardProps {
  status: ComplianceStatus;
  failingClauses?: number;
  totalClauses?: number;
  auditId: string;
  className?: string;
}

export function ComplianceWidget({
  status,
  failingClauses = 0,
  totalClauses = 0,
  auditId,
  className = '',
}: WidgetCardProps) {
  return (
    <div
      className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-4 ${className}`}
    >
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
        EAA Compliance
      </p>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <ComplianceBadgeInline status={status} />
          {status !== 'not_assessed' && totalClauses > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {failingClauses === 0
                ? `All ${totalClauses} clauses passing`
                : `${failingClauses} of ${totalClauses} clauses failing`}
            </p>
          )}
        </div>
        <Link
          to={`/app/audits/${auditId}/compliance`}
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 rounded"
        >
          View Report
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
