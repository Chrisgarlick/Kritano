import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import type { CommonIssue, ResolvedIssue, NewIssue } from '../../types/analytics.types';
import { CATEGORY_COLORS, SEVERITY_COLORS } from '../../types/analytics.types';

interface IssueDiffTableProps {
  commonIssues: CommonIssue[];
  resolvedIssues: ResolvedIssue[];
  newIssues: NewIssue[];
  auditLabels?: Record<string, string>;
}

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#64748b';
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize"
      style={{
        backgroundColor: `${getCategoryColor(category)}15`,
        color: getCategoryColor(category),
      }}
    >
      {category}
    </span>
  );
}

function SeverityBadge({ severity }: { severity?: string }) {
  if (!severity) return null;
  const color = SEVERITY_COLORS[severity] || '#64748b';
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize"
      style={{
        backgroundColor: `${color}15`,
        color,
      }}
    >
      {severity}
    </span>
  );
}

export function IssueDiffTable({
  commonIssues,
  resolvedIssues,
  newIssues,
}: IssueDiffTableProps) {
  const hasAnyIssues = commonIssues.length > 0 || resolvedIssues.length > 0 || newIssues.length > 0;

  if (!hasAnyIssues) {
    return (
      <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 text-center">
        <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
        <p className="text-slate-600">No issues to compare between these audits</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resolved Issues */}
      {resolvedIssues.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <h4 className="text-sm font-medium text-slate-700">
              Resolved Issues ({resolvedIssues.length})
            </h4>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-emerald-100/50">
                  <th className="text-left py-2 px-4 text-xs font-medium text-emerald-800">
                    Issue
                  </th>
                  <th className="text-left py-2 px-4 text-xs font-medium text-emerald-800">
                    Severity
                  </th>
                  <th className="text-left py-2 px-4 text-xs font-medium text-emerald-800">
                    Category
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100">
                {resolvedIssues.map(issue => (
                  <tr key={issue.ruleId}>
                    <td className="py-2 px-4">
                      <span className="text-sm text-slate-700">{issue.ruleName}</span>
                      <span className="ml-2 text-xs text-slate-400 font-mono">{issue.ruleId}</span>
                    </td>
                    <td className="py-2 px-4">
                      <SeverityBadge severity={issue.severity} />
                    </td>
                    <td className="py-2 px-4">
                      <CategoryBadge category={issue.category} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Issues */}
      {newIssues.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h4 className="text-sm font-medium text-slate-700">
              New Issues ({newIssues.length})
            </h4>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-red-100/50">
                  <th className="text-left py-2 px-4 text-xs font-medium text-red-800">
                    Issue
                  </th>
                  <th className="text-left py-2 px-4 text-xs font-medium text-red-800">
                    Severity
                  </th>
                  <th className="text-left py-2 px-4 text-xs font-medium text-red-800">
                    Category
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {newIssues.map(issue => (
                  <tr key={issue.ruleId}>
                    <td className="py-2 px-4">
                      <span className="text-sm text-slate-700">{issue.ruleName}</span>
                      <span className="ml-2 text-xs text-slate-400 font-mono">{issue.ruleId}</span>
                    </td>
                    <td className="py-2 px-4">
                      <SeverityBadge severity={issue.severity} />
                    </td>
                    <td className="py-2 px-4">
                      <CategoryBadge category={issue.category} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Common Issues */}
      {commonIssues.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h4 className="text-sm font-medium text-slate-700">
              Persistent Issues ({commonIssues.length})
            </h4>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-amber-100/50">
                  <th className="text-left py-2 px-4 text-xs font-medium text-amber-800">
                    Issue
                  </th>
                  <th className="text-left py-2 px-4 text-xs font-medium text-amber-800">
                    Severity
                  </th>
                  <th className="text-left py-2 px-4 text-xs font-medium text-amber-800">
                    Category
                  </th>
                  <th className="text-left py-2 px-4 text-xs font-medium text-amber-800">
                    Present In
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {commonIssues.map(issue => (
                  <tr key={issue.ruleId}>
                    <td className="py-2 px-4">
                      <span className="text-sm text-slate-700">{issue.ruleName}</span>
                      <span className="ml-2 text-xs text-slate-400 font-mono">{issue.ruleId}</span>
                    </td>
                    <td className="py-2 px-4">
                      <SeverityBadge severity={issue.severity} />
                    </td>
                    <td className="py-2 px-4">
                      <CategoryBadge category={issue.category} />
                    </td>
                    <td className="py-2 px-4">
                      <span className="text-xs text-slate-500">
                        {issue.presentIn.length} audit{issue.presentIn.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
