import { useState, useEffect, useCallback, useMemo, useRef, Fragment } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  FileDown,
  Printer,
  Trash2,
  XCircle,
  ExternalLink,
  ChevronDown,
  CheckCircle,
  Share2,
  Copy,
  Link2Off,
  X,
  Clock,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { SkeletonScoreCards, SkeletonCard } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { Display, Heading, Body, Mono } from '../../components/ui/Typography';
import { CategoryScore } from '../../components/ui/ScoreDisplay';
import { StatusBadge, SeverityBadge } from '../../components/ui/StatusBadge';
import { MultiScoreChart, ChartLegend } from '../../components/ui/ScoreChart';
import { CategoryRadar, SeverityDonut, SeverityLegend } from '../../components/ui/CategoryRadar';
import { SecurityBlockedAlert, AuditErrorSummary, CQSBreakdown, FixSnippetAccordion } from '../../components/audit';
import { ComplianceBadgeInline } from '../../components/audit/ComplianceBadge';
import { SchemaTab } from '../../components/audit/SchemaTab';
import { IndexExposureTab } from '../../components/audit/IndexExposureTab';
import { FilesTab } from '../../components/audit/FilesTab';
import { ContentAnalysisPanel } from '../../components/audits/ContentAnalysisPanel';
import { auditsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { Audit, Finding, AuditPage, AuditProgress, Severity, FindingCategory, FixSnippet } from '../../types/audit.types';
import { formatDate, formatBytes } from '../../utils/format';
import { severityColors, categoryColors, getScoreColor } from '../../utils/constants';

// Grouped finding type
interface GroupedFinding {
  key: string;
  rule_id: string;
  rule_name: string;
  category: FindingCategory;
  severity: Severity;
  description: string | null;
  recommendation: string | null;
  help_url: string | null;
  dismissed: boolean;
  fixSnippet?: FixSnippet;
  affectedPages: {
    page_url: string | null;
    message: string; // Page-specific message (e.g., "score of 26/100")
    snippet: string | null;
    selector: string | null;
    device_type?: string;
  }[];
}

const severityOrder: Record<Severity, number> = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3,
  info: 4,
};

function groupFindings(findings: Finding[]): GroupedFinding[] {
  const map = new Map<string, GroupedFinding>();

  for (const f of findings) {
    // Group by rule_id only, not by message (messages may contain page-specific values)
    const key = f.rule_id;

    if (!map.has(key)) {
      map.set(key, {
        key,
        rule_id: f.rule_id,
        rule_name: f.rule_name,
        category: f.category,
        severity: f.severity,
        description: f.description,
        recommendation: f.recommendation,
        help_url: f.help_url,
        dismissed: f.status === 'dismissed',
        fixSnippet: f.fixSnippet,
        affectedPages: [],
      });
    }

    map.get(key)!.affectedPages.push({
      page_url: f.page_url || null,
      message: f.message,
      snippet: f.snippet || null,
      selector: f.selector || null,
      device_type: f.device_type || 'desktop',
    });
  }

  // Sort by severity then by affected page count (most affected first)
  return Array.from(map.values()).sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return b.affectedPages.length - a.affectedPages.length;
  });
}

// Using shared statusColors, severityColors, categoryColors from utils/constants
// Using shared formatDate from utils/format

function EnhancedScoreCard({ score, category, onClick }: { score: number | null; category: 'seo' | 'accessibility' | 'security' | 'performance' | 'content' | 'structured-data' | 'cqs'; onClick?: () => void }) {
  const categoryLabel = category === 'structured-data' ? 'Schema' : category;
  if (score === null) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 animate-reveal-up">
        <div className="text-center">
          <div className="text-2xl font-semibold text-slate-300 dark:text-slate-600">-</div>
          <div className="text-sm text-slate-500 dark:text-slate-500 mt-1 capitalize">{categoryLabel}</div>
        </div>
      </div>
    );
  }

  return (
    <CategoryScore
      score={score}
      category={category}
      className="animate-reveal-up"
      onClick={onClick}
    />
  );
}

function GroupedFindingCard({ group, onDismiss }: { group: GroupedFinding; auditId: string; onDismiss: (ruleId: string, message: string, status: 'dismissed' | 'active') => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const uniqueSnippets = new Set(group.affectedPages.map(p => p.snippet).filter(Boolean));
  const hasConsistentSnippet = uniqueSnippets.size === 1;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md ${group.dismissed ? 'opacity-60' : ''}`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center flex-wrap gap-2">
            <SeverityBadge severity={group.severity} />
            <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${categoryColors[group.category]}`}>
              {group.category === 'seo' ? 'SEO' : group.category.charAt(0).toUpperCase() + group.category.slice(1)}
            </span>
            {group.dismissed && (
              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                Dismissed
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-500 whitespace-nowrap tabular-nums">
              {group.affectedPages.length} page{group.affectedPages.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => onDismiss(group.rule_id, group.rule_name, group.dismissed ? 'active' : 'dismissed')}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                group.dismissed
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {group.dismissed ? 'Restore' : 'Dismiss'}
            </button>
          </div>
        </div>

        {/* Issue details */}
        <Heading size="xs" as="h4" className="text-slate-900 dark:text-white mb-1.5">
          {group.rule_name}
        </Heading>
        {group.description && (
          <Body size="sm" className="text-slate-600 dark:text-slate-500">
            {group.description}
          </Body>
        )}

        {group.recommendation && (
          <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
              <Body size="sm" className="text-indigo-800 dark:text-indigo-300">
                <span className="font-medium">How to fix:</span> {group.recommendation}
              </Body>
            </div>
          </div>
        )}

        {/* Fix Snippet Accordion */}
        {group.fixSnippet && (
          <FixSnippetAccordion fixSnippet={group.fixSnippet} />
        )}

        {/* Show snippet if consistent across all pages */}
        {hasConsistentSnippet && uniqueSnippets.size > 0 && (
          <pre className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs text-slate-600 dark:text-slate-500 overflow-x-auto font-mono border border-slate-100 dark:border-slate-700">
            {[...uniqueSnippets][0]}
          </pre>
        )}

        {group.help_url && (
          <a
            href={group.help_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Learn more about ${group.rule_name}`}
            className="mt-4 inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
          >
            Learn more
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Affected Pages Accordion */}
      <div className="border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls={`affected-pages-${group.key}`}
          className="w-full px-5 py-3 flex items-center justify-between text-sm text-slate-600 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <span className="font-medium">
            Affected Pages ({group.affectedPages.length})
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div id={`affected-pages-${group.key}`} className="px-5 pb-4 space-y-2">
            {group.affectedPages.map((page, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-t border-slate-50 dark:border-slate-800 first:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {page.page_url ? (
                      <a
                        href={page.page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline truncate font-mono"
                      >
                        {page.page_url}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-500 dark:text-slate-500">Site-level issue</span>
                    )}
                  </div>
                  {/* Show page-specific message (e.g., score details) */}
                  {page.message && (
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {page.message}
                    </p>
                  )}
                  {/* Show per-page snippet if snippets vary */}
                  {!hasConsistentSnippet && page.snippet && (
                    <pre className="mt-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded text-xs text-slate-500 dark:text-slate-500 overflow-x-auto font-mono">
                      {page.snippet}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type TabType = 'overview' | 'findings' | 'broken-links' | 'pages' | 'schema' | 'index-exposure' | 'files';

// Using shared formatBytes from utils/format

function PageAccordion({ page, auditId }: { page: AuditPage; auditId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const totalIssues = page.seo_issues + page.accessibility_issues + page.security_issues + page.performance_issues + page.content_issues;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header Row - Clickable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={`page-details-${page.id}`}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <div className="flex-1 min-w-0 text-left">
          <a
            href={page.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline truncate block"
          >
            {page.url}
          </a>
          {page.title && (
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{page.title}</div>
          )}
        </div>

        <div className="flex items-center space-x-6 ml-4">
          {/* Status Badge */}
          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
            page.crawl_status === 'crawled' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300' :
            page.crawl_status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
            'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
          }`}>
            {page.crawl_status}
          </span>

          {/* Response */}
          <div className="text-center w-16">
            <div className="text-sm text-slate-900 dark:text-white">{page.status_code || '-'}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{page.response_time_ms ? `${page.response_time_ms}ms` : ''}</div>
          </div>

          {/* Issues */}
          <div className="text-center w-12">
            <div className="text-sm font-medium text-slate-900 dark:text-white">{totalIssues}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">issues</div>
          </div>

          {/* Scores */}
          <div className="flex space-x-2 text-xs w-48 justify-end flex-wrap sm:flex-nowrap">
            <span className={getScoreColor(page.seo_score)}>S:{page.seo_score ?? '-'}</span>
            <span className={getScoreColor(page.accessibility_score)}>A:{page.accessibility_score ?? '-'}</span>
            <span className={getScoreColor(page.security_score)}>Sc:{page.security_score ?? '-'}</span>
            <span className={getScoreColor(page.performance_score)}>P:{page.performance_score ?? '-'}</span>
            <span className={getScoreColor(page.content_score)}>C:{page.content_score ?? '-'}</span>
          </div>

          {/* Chevron */}
          <svg
            className={`w-5 h-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div id={`page-details-${page.id}`} className="px-6 pb-6 border-t border-slate-100 dark:border-slate-700/50">
          <div className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Page Info */}
            <div>
              <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-3">Page Info</h4>
              <dl className="space-y-2">
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Status Code</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-white">{page.status_code || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Content Type</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-white">{page.content_type || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Page Size</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-white">{formatBytes(page.page_size_bytes)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Response Time</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-white">{page.response_time_ms ? `${page.response_time_ms}ms` : '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Depth</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-white">{page.depth}</dd>
                </div>
              </dl>
            </div>

            {/* Issues Breakdown */}
            <div>
              <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-3">Issues by Category</h4>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-purple-600">SEO</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-white">{page.seo_issues}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-emerald-600">Accessibility</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-white">{page.accessibility_issues}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-red-600">Security</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-white">{page.security_issues}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-indigo-600">Performance</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-white">{page.performance_issues}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-amber-600">Content</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-white">{page.content_issues}</dd>
                </div>
              </dl>
            </div>

            {/* Scores */}
            <div>
              <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-3">Scores</h4>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-600 dark:text-slate-400">SEO</dt>
                  <dd className={`text-sm font-bold ${getScoreColor(page.seo_score)}`}>{page.seo_score ?? '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-600 dark:text-slate-400">Accessibility</dt>
                  <dd className={`text-sm font-bold ${getScoreColor(page.accessibility_score)}`}>{page.accessibility_score ?? '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-600 dark:text-slate-400">Security</dt>
                  <dd className={`text-sm font-bold ${getScoreColor(page.security_score)}`}>{page.security_score ?? '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-600 dark:text-slate-400">Performance</dt>
                  <dd className={`text-sm font-bold ${getScoreColor(page.performance_score)}`}>{page.performance_score ?? '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-600 dark:text-slate-400">Content</dt>
                  <dd className={`text-sm font-bold ${getScoreColor(page.content_score)}`}>{page.content_score ?? '-'}</dd>
                </div>
              </dl>
            </div>

            {/* Actions */}
            <div className="flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-3">Actions</h4>
                <a
                  href={page.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                  Visit Page
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
              <button
                onClick={() => navigate(`/app/audits/${auditId}/pages/${page.id}`)}
                className="mt-4 w-full px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
              >
                View Full Details
              </button>
            </div>
          </div>

          {/* Content Analysis Panel (if content was analyzed) */}
          {page.content_score !== null && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/50">
              <ContentAnalysisPanel
                metrics={{
                  content_quality_score: page.content_quality_score,
                  content_readability_score: page.content_readability_score,
                  content_structure_score: page.content_structure_score,
                  content_engagement_score: page.content_engagement_score,
                  eeat_score: page.eeat_score,
                  eeat_experience_score: page.eeat_experience_score,
                  eeat_expertise_score: page.eeat_expertise_score,
                  eeat_authoritativeness_score: page.eeat_authoritativeness_score,
                  eeat_trustworthiness_score: page.eeat_trustworthiness_score,
                  has_author_bio: page.has_author_bio,
                  has_author_credentials: page.has_author_credentials,
                  citation_count: page.citation_count,
                  has_contact_info: page.has_contact_info,
                  has_privacy_policy: page.has_privacy_policy,
                  has_terms_of_service: page.has_terms_of_service,
                  eeat_tier: page.eeat_tier,
                  aeo_score: page.aeo_score,
                  aeo_nugget_score: page.aeo_nugget_score,
                  aeo_factual_density_score: page.aeo_factual_density_score,
                  aeo_source_authority_score: page.aeo_source_authority_score,
                  aeo_tier: page.aeo_tier,
                  aeo_nuggets: page.aeo_nuggets,
                  flesch_kincaid_grade: page.flesch_kincaid_grade,
                  flesch_reading_ease: page.flesch_reading_ease,
                  word_count: page.word_count,
                  reading_time_minutes: page.reading_time_minutes,
                  detected_content_type: page.detected_content_type,
                }}
                contentScore={page.content_score}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [pages, setPages] = useState<AuditPage[]>([]);
  const [brokenLinks, setBrokenLinks] = useState<Finding[]>([]);
  const [brokenLinksTotal, setBrokenLinksTotal] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [rerunning, setRerunning] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<Array<{ id: string; created_at: string; seo_score: number | null; accessibility_score: number | null; security_score: number | null; performance_score: number | null; content_score: number | null }>>([]);

  // CQS breakdown panel
  const [showCqsBreakdown, setShowCqsBreakdown] = useState(false);

  // Compliance status (fetched separately for badge)
  const [complianceStatus, setComplianceStatus] = useState<'compliant' | 'partially_compliant' | 'non_compliant' | 'not_assessed' | null>(null);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareExpiresAt, setShareExpiresAt] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auth context for tier check
  const { subscription } = useAuth();
  const userTier = subscription?.tier || 'free';
  const canShare = ['pro', 'agency', 'enterprise'].includes(userTier);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<FindingCategory | null>(null);
  const [severityFilter, setSeverityFilter] = useState<Severity | null>(null);
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'desktop' | 'mobile' | 'both'>('all');
  const [showDismissed, setShowDismissed] = useState(false);

  // Check if audit has mobile data
  const hasMobileData = audit?.include_mobile && audit?.mobile_accessibility_score != null;

  // Group and filter findings
  const allGrouped = useMemo(() => groupFindings(findings), [findings]);

  const filteredGroups = useMemo(() => {
    return allGrouped.filter(g => {
      if (categoryFilter && g.category !== categoryFilter) return false;
      if (severityFilter && g.severity !== severityFilter) return false;
      if (!showDismissed && g.dismissed) return false;
      if (deviceFilter !== 'all') {
        // Check if any affected page finding matches the device filter
        const hasMatchingDevice = g.affectedPages.some((p: { device_type?: string }) =>
          p.device_type === deviceFilter || p.device_type === 'both'
        );
        if (!hasMatchingDevice) return false;
      }
      return true;
    });
  }, [allGrouped, categoryFilter, severityFilter, deviceFilter, showDismissed]);

  // P1: Memoize category/severity counts to avoid recomputation on every render
  const categoryCounts = useMemo(() => {
    const counts: Record<FindingCategory, { filtered: number; total: number }> = {
      seo: { filtered: 0, total: 0 },
      accessibility: { filtered: 0, total: 0 },
      security: { filtered: 0, total: 0 },
      performance: { filtered: 0, total: 0 },
      content: { filtered: 0, total: 0 },
      'content-eeat': { filtered: 0, total: 0 },
      'content-aeo': { filtered: 0, total: 0 },
      'structured-data': { filtered: 0, total: 0 },
    };
    for (const g of allGrouped) {
      if (showDismissed || !g.dismissed) {
        counts[g.category].total++;
        if (!severityFilter || g.severity === severityFilter) {
          counts[g.category].filtered++;
        }
      }
    }
    return counts;
  }, [allGrouped, severityFilter, showDismissed]);

  const severityCounts = useMemo(() => {
    const counts: Record<Severity, { filtered: number; total: number }> = {
      critical: { filtered: 0, total: 0 },
      serious: { filtered: 0, total: 0 },
      moderate: { filtered: 0, total: 0 },
      minor: { filtered: 0, total: 0 },
      info: { filtered: 0, total: 0 },
    };
    for (const g of allGrouped) {
      if (showDismissed || !g.dismissed) {
        counts[g.severity].total++;
        if (!categoryFilter || g.category === categoryFilter) {
          counts[g.severity].filtered++;
        }
      }
    }
    return counts;
  }, [allGrouped, categoryFilter, showDismissed]);

  // Helper functions that use memoized counts
  const getCategoryCount = (cat: FindingCategory) => categoryCounts[cat].filtered;
  const getSeverityCount = (sev: Severity) => severityCounts[sev].filtered;
  const getTotalCategoryCount = (cat: FindingCategory) => categoryCounts[cat].total;
  const getTotalSeverityCount = (sev: Severity) => severityCounts[sev].total;

  // Total visible findings count for tab header
  const visibleFindingsCount = useMemo(() => {
    return allGrouped.filter(g => showDismissed || !g.dismissed).length;
  }, [allGrouped, showDismissed]);


  const fetchAudit = useCallback(async () => {
    if (!id) return;
    try {
      const response = await auditsApi.get(id);
      setAudit(response.data.audit);
    } catch (err) {
      setError('Failed to load audit details.');
      console.error('Failed to fetch audit:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchFindings = useCallback(async () => {
    if (!id) return;
    try {
      // Fetch all findings for client-side filtering with dynamic counts
      const response = await auditsApi.getFindings(id, { limit: 5000 });
      setFindings(response.data.findings);
    } catch (err) {
      console.error('Failed to fetch findings:', err);
    }
  }, [id]);

  const fetchPages = useCallback(async () => {
    if (!id) return;
    try {
      const response = await auditsApi.getPages(id);
      setPages(response.data.pages);
    } catch (err) {
      console.error('Failed to fetch pages:', err);
    }
  }, [id]);

  const fetchBrokenLinks = useCallback(async () => {
    if (!id) return;
    try {
      const response = await auditsApi.getBrokenLinks(id);
      setBrokenLinks(response.data.brokenLinks);
      setBrokenLinksTotal(response.data.total);
    } catch (err) {
      console.error('Failed to fetch broken links:', err);
    }
  }, [id]);

  // P2: Update findings in state instead of refetching all
  const handleDismiss = useCallback(async (ruleId: string, message: string, status: 'dismissed' | 'active') => {
    if (!id) return;
    try {
      await auditsApi.bulkDismiss(id, ruleId, message, status);
      toast(status === 'dismissed' ? 'Finding dismissed' : 'Finding restored', 'success');

      // Update findings in state directly instead of refetching
      setFindings(prev => prev.map(f =>
        f.rule_id === ruleId && f.message === message
          ? { ...f, status }
          : f
      ));
    } catch {
      toast('Failed to update finding', 'error');
    }
  }, [id, toast]);

  // Initial fetch
  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  // Fetch broken links count on load (for tab badge)
  useEffect(() => {
    if (audit && !['pending', 'discovering', 'ready', 'processing'].includes(audit.status)) {
      fetchBrokenLinks();
    }
  }, [audit?.status, fetchBrokenLinks]);

  // Fetch compliance status for badge
  useEffect(() => {
    if (id && audit && audit.status === 'completed') {
      auditsApi.getCompliance(id).then(res => {
        setComplianceStatus(res.data.status);
      }).catch(() => {
        setComplianceStatus('not_assessed');
      });
    }
  }, [id, audit?.status]);

  // Fetch score history
  useEffect(() => {
    if (id && audit && audit.status === 'completed') {
      auditsApi.getScoreHistory(id).then(res => {
        // Map to include content_score (may be missing in older API responses)
        setScoreHistory(res.data.history.map((h: any) => ({
          ...h,
          content_score: h.content_score ?? null,
        })));
      }).catch(() => {});
    }
  }, [id, audit?.status]);

  // Fetch findings once on load (needed for Overview stats and Findings tab)
  useEffect(() => {
    if (id) fetchFindings();
  }, [id, fetchFindings]);

  // Fetch pages/broken-links when their tabs become active
  useEffect(() => {
    if (activeTab === 'pages') fetchPages();
    if (activeTab === 'broken-links') fetchBrokenLinks();
  }, [activeTab, fetchPages, fetchBrokenLinks]);

  // Close export dropdown on outside click
  useEffect(() => {
    if (!showExportMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showExportMenu]);

  // Track if SSE error has been shown to avoid duplicate toasts
  const sseErrorShown = useRef(false);

  // SSE for real-time progress
  useEffect(() => {
    if (!id || !audit || !['pending', 'discovering', 'ready', 'processing'].includes(audit.status)) return;

    // Reset error flag when starting new connection
    sseErrorShown.current = false;
    const eventSource = auditsApi.createProgressStream(id);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'progress') {
          const progress: AuditProgress = data.data;
          setAudit(prev => prev ? {
            ...prev,
            status: progress.status,
            pages_found: progress.pagesFound,
            pages_crawled: progress.pagesCrawled,
            pages_audited: progress.pagesAudited,
            current_url: progress.currentUrl,
            total_issues: progress.totalIssues,
            critical_issues: progress.criticalIssues,
            seo_score: progress.seoScore,
            accessibility_score: progress.accessibilityScore,
            security_score: progress.securityScore,
            performance_score: progress.performanceScore,
            queue_position: progress.queuePosition,
            estimated_wait_seconds: progress.estimatedWaitSeconds,
          } : null);
        } else if (data.type === 'completed' || data.type === 'failed' || data.type === 'cancelled') {
          // Refetch full audit data
          fetchAudit();
          // Always fetch findings - needed for Overview stats
          fetchFindings();
          if (activeTab === 'pages') fetchPages();
          if (activeTab === 'broken-links') fetchBrokenLinks();
        }
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      // Only show error toast if audit is still running (not on natural completion close)
      if (!sseErrorShown.current) {
        // Check current audit status via DOM to avoid stale closure
        setAudit(prev => {
          if (prev && ['pending', 'discovering', 'ready', 'processing'].includes(prev.status)) {
            sseErrorShown.current = true;
            toast('Real-time updates disconnected. Refresh to see latest progress.', 'warning');
          }
          return prev;
        });
      }
    };

    return () => {
      eventSource.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, audit?.status, toast]);

  const handleCancel = async () => {
    if (!id || !confirm('Are you sure you want to cancel this audit?')) return;

    try {
      setCancelling(true);
      await auditsApi.cancel(id);
      toast('Audit cancelled', 'success');
      await fetchAudit();
    } catch (err) {
      setError('Failed to cancel audit.');
      console.error('Failed to cancel audit:', err);
    } finally {
      setCancelling(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this audit? This action cannot be undone.')) return;

    try {
      setDeleting(true);
      await auditsApi.delete(id);
      toast('Audit deleted', 'success');
      navigate('/app/audits');
    } catch (err) {
      setError('Failed to delete audit.');
      console.error('Failed to delete audit:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleRerun = async () => {
    if (!id) return;
    try {
      setRerunning(true);
      const response = await auditsApi.rerun(id);
      toast('New audit started', 'success');
      navigate(`/app/audits/${response.data.audit.id}`);
    } catch (err) {
      toast('Failed to start new audit', 'error');
      console.error('Failed to re-run audit:', err);
    } finally {
      setRerunning(false);
    }
  };

  const handleShare = async () => {
    if (!id) return;
    try {
      setSharing(true);
      const response = await auditsApi.share(id);
      setShareUrl(response.data.shareUrl);
      setShareExpiresAt(response.data.expiresAt);
      setShowShareModal(true);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to generate share link';
      toast(msg, 'error');
    } finally {
      setSharing(false);
    }
  };

  const handleRevokeShare = async () => {
    if (!id) return;
    try {
      setRevoking(true);
      await auditsApi.revokeShare(id);
      setShareUrl(null);
      setShareExpiresAt(null);
      setShowShareModal(false);
      toast('Share link revoked', 'success');
    } catch {
      toast('Failed to revoke share link', 'error');
    } finally {
      setRevoking(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast('Link copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Failed to copy link', 'error');
    }
  };

  // Deep link: set tab from hash
  useEffect(() => {
    const hash = location.hash.replace('#', '') as TabType;
    if (['overview', 'findings', 'broken-links', 'pages', 'schema', 'index-exposure'].includes(hash)) {
      setActiveTab(hash);
    }
  }, [location.hash]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <SkeletonScoreCards />
          <SkeletonCard />
        </div>
      </DashboardLayout>
    );
  }

  if (!audit) {
    return (
      <DashboardLayout>
        <Alert variant="error">
          Audit not found. <Link to="/app/audits" className="underline">Return to audits list</Link>
        </Alert>
      </DashboardLayout>
    );
  }

  const isRunning = ['pending', 'discovering', 'ready', 'processing'].includes(audit.status);

  return (
    <DashboardLayout>
      <Helmet><title>Audit Details | Kritano</title></Helmet>
      {/* Header */}
      <div className="mb-8 animate-reveal-up relative z-10">
        {/* Back link */}
        <Link
          to="/app/sites"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 mb-4 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Sites
        </Link>

        {/* Title row */}
        <div className="flex items-center gap-3 mb-1">
          <Display size="sm" as="h1" className="text-slate-900 dark:text-white">
            {audit.target_domain}
          </Display>
          <StatusBadge status={audit.status} />
          {complianceStatus && complianceStatus !== 'not_assessed' && (
            <ComplianceBadgeInline status={complianceStatus} />
          )}
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Mono size="sm">{audit.target_url}</Mono>
          {audit.completed_at && (
            <Body size="sm" muted>
              &middot; Completed {formatDate(audit.completed_at)}
            </Body>
          )}
        </div>

        {/* Action toolbar */}
        <div className="flex items-center gap-2 no-print">
          {!isRunning && (
            <>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className="w-4 h-4" />}
                onClick={handleRerun}
                isLoading={rerunning}
              >
                Re-run
              </Button>
              <div className="relative" ref={exportDropdownRef}>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<FileDown className="w-4 h-4" />}
                  rightIcon={<ChevronDown className="w-3.5 h-3.5" />}
                  onClick={() => setShowExportMenu(prev => !prev)}
                >
                  Export
                </Button>
                {showExportMenu && (
                  <div className="absolute left-0 top-full mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1" style={{ zIndex: 9999 }}>
                    {[
                      { label: 'CSV', ext: 'csv', fn: () => auditsApi.exportCsv(id!) },
                      { label: 'Markdown', ext: 'md', fn: () => auditsApi.exportMarkdown(id!) },
                      { label: 'HTML', ext: 'html', fn: () => auditsApi.exportHtml(id!) },
                      { label: 'JSON', ext: 'json', fn: () => auditsApi.exportJson(id!) },
                    ].map(item => (
                      <button
                        key={item.ext}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                        onClick={() => {
                          setShowExportMenu(false);
                          item.fn().then((res: { data: Blob }) => {
                            const url = URL.createObjectURL(res.data);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `audit-${audit.target_domain}.${item.ext}`;
                            a.click();
                            URL.revokeObjectURL(url);
                            toast(`${item.label} exported`, 'success');
                          }).catch(() => toast('Export failed', 'error'));
                        }}
                      >
                        <FileDown className="w-4 h-4 text-slate-400" />
                        {item.label}
                      </button>
                    ))}
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                      onClick={() => {
                        setShowExportMenu(false);
                        toast('Generating PDF...', 'info');
                        auditsApi.exportPdf(id!).then(res => {
                          const url = URL.createObjectURL(res.data);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `audit-${audit.target_domain}.pdf`;
                          a.click();
                          URL.revokeObjectURL(url);
                          toast('PDF exported', 'success');
                        }).catch(() => toast('PDF export failed', 'error'));
                      }}
                    >
                      <FileDown className="w-4 h-4 text-slate-400" />
                      PDF
                    </button>
                    <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                      onClick={() => {
                        setShowExportMenu(false);
                        window.print();
                      }}
                    >
                      <Printer className="w-4 h-4 text-slate-400" />
                      Print
                    </button>
                  </div>
                )}
              </div>
              {canShare && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Share2 className="w-4 h-4" />}
                  onClick={handleShare}
                  isLoading={sharing}
                >
                  Share
                </Button>
              )}
              {['pro', 'agency', 'enterprise'].includes(userTier) && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<FileText className="w-4 h-4" />}
                  onClick={() => navigate(`/app/audits/${id}/statement`)}
                >
                  Accessibility Statement
                </Button>
              )}
              {['pro', 'agency', 'enterprise'].includes(userTier) && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ShieldCheck className="w-4 h-4" />}
                  onClick={() => navigate(`/app/audits/${id}/compliance`)}
                >
                  EAA Compliance
                </Button>
              )}

              <div className="flex-1" />

              <Button
                variant="outline"
                size="sm"
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={handleDelete}
                isLoading={deleting}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
              >
                Delete
              </Button>
            </>
          )}
          {isRunning && (
            <Button
              variant="outline"
              leftIcon={<XCircle className="w-4 h-4" />}
              onClick={handleCancel}
              isLoading={cancelling}
            >
              Cancel Audit
            </Button>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowShareModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 animate-reveal-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-600" />
                <Heading size="sm" as="h3" className="text-slate-900 dark:text-white">Share Report</Heading>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {shareUrl ? (
              <div className="space-y-4">
                <div>
                  <Body size="sm" muted className="mb-2">
                    Anyone with this link can view a summary of this audit report.
                  </Body>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 font-mono truncate focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Copy className="w-4 h-4" />}
                      onClick={handleCopyShareLink}
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>

                {shareExpiresAt && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>Link expires in 48 hours ({new Date(shareExpiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })})</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Link2Off className="w-4 h-4" />}
                    onClick={handleRevokeShare}
                    isLoading={revoking}
                    className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                  >
                    Revoke Link
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Security Blocked Alert - Show for failed audits with security blocking or completed with blocked pages */}
      {(() => {
        const isSecurityBlocked = audit.error_message?.includes('security protection') ||
          audit.error_message?.includes('Cloudflare') ||
          audit.error_message?.includes('WAF');
        const hasBlockedPages = audit.pages_blocked && audit.pages_blocked > 0;

        if (audit.status === 'failed' && isSecurityBlocked) {
          return (
            <SecurityBlockedAlert
              reason="This website's security protection (e.g., Cloudflare, WAF) is blocking automated crawling. The audit could not complete."
              suggestion="To audit this website, you'll need to whitelist the crawler's IP address or temporarily disable bot protection features like Cloudflare's 'Bot Fight Mode' or 'Under Attack Mode'."
              pagesBlocked={audit.pages_blocked || 0}
              totalPages={audit.pages_found}
              isFatal
            />
          );
        }

        if (!isRunning && hasBlockedPages) {
          return (
            <SecurityBlockedAlert
              reason="This website has security measures that blocked some pages from being crawled."
              suggestion="Consider contacting the website owner to whitelist our crawler IP address, or temporarily disable bot protection features like Cloudflare's 'Bot Fight Mode'."
              pagesBlocked={audit.pages_blocked!}
              totalPages={audit.pages_found}
            />
          );
        }

        return null;
      })()}

      {/* Progress Section (shown when running) */}
      {isRunning && (() => {
        const isPreProcessing = ['pending', 'discovering', 'ready'].includes(audit.status);
        const maxPages = audit.pages_found || 1;
        const progress = Math.min(100, Math.round((audit.pages_crawled / maxPages) * 100));

        // Format estimated wait
        const formatWait = (seconds: number | null | undefined): string => {
          if (!seconds || seconds <= 10) return 'Starting shortly...';
          if (seconds < 60) return `~${seconds} seconds`;
          const mins = Math.ceil(seconds / 60);
          return mins === 1 ? '~1 minute' : `~${mins} minutes`;
        };

        // Determine current step: 0=Submitted, 1=Discovering, 2=Queued, 3=Scanning, 4=Complete
        const currentStep =
          audit.status === 'pending' ? 0 :
          audit.status === 'discovering' ? 1 :
          audit.status === 'ready' ? 2 :
          audit.status === 'processing' ? 3 : 4;

        const steps = [
          { label: 'Submitted', icon: 'check' },
          { label: 'Discovering', icon: 'search' },
          { label: 'Queued', icon: 'clock' },
          { label: 'Scanning', icon: 'scan' },
          { label: 'Complete', icon: 'check' },
        ];

        const renderStepIcon = (stepIndex: number, icon: string) => {
          if (stepIndex < currentStep) {
            // Completed step
            return (
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
            );
          }
          if (stepIndex === currentStep) {
            // Active step
            return (
              <div className="w-7 h-7 rounded-full border-2 border-indigo-600 bg-white dark:bg-slate-900 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              </div>
            );
          }
          // Future step
          return (
            <div className="w-7 h-7 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center">
              <svg className="w-4 h-4 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                {icon === 'search' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                ) : icon === 'clock' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                )}
              </svg>
            </div>
          );
        };

        if (isPreProcessing) {
          const position = audit.queue_position ?? null;
          const waitSeconds = audit.estimated_wait_seconds ?? null;

          // Status-specific messaging
          const statusTitle =
            audit.status === 'pending' ? 'Your audit is queued' :
            audit.status === 'discovering' ? 'Discovering pages...' :
            'Ready for scanning';

          const statusDescription =
            audit.status === 'pending' ? (
              position !== null && position > 0 ? (
                <>Position <span className="font-medium text-slate-700 dark:text-slate-300">#{position}</span> in queue</>
              ) : 'Waiting for an available slot...'
            ) :
            audit.status === 'discovering' ? 'Checking sitemaps, robots.txt, and exposed files...' :
            position !== null && position > 0 ? (
              <>Ready for scanning - Position <span className="font-medium text-slate-700 dark:text-slate-300">#{position}</span></>
            ) : 'Waiting for an available scanner slot...';

          const statusIconColor =
            audit.status === 'discovering' ? 'bg-sky-50 dark:bg-sky-950/50' : 'bg-indigo-50 dark:bg-indigo-950/50';

          const statusDotColor =
            audit.status === 'discovering' ? 'bg-sky-400' : 'bg-amber-400';

          return (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${statusIconColor} flex items-center justify-center`}>
                  <div className="relative">
                    {audit.status === 'discovering' ? (
                      <svg className="w-6 h-6 text-sky-600 dark:text-sky-400 animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    )}
                    <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 ${statusDotColor} rounded-full animate-pulse`} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                    {statusTitle}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-500">
                    {statusDescription}
                  </p>
                  {(audit.status === 'pending' || audit.status === 'ready') && waitSeconds !== null && (
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-0.5">
                      Estimated wait: <span className="font-medium text-slate-700 dark:text-slate-300">{formatWait(waitSeconds)}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* 5-step indicator */}
              <div className="mt-5 flex items-center gap-2">
                {steps.map((step, i) => (
                  <Fragment key={step.label}>
                    {i > 0 && <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />}
                    <div className="flex items-center gap-1.5">
                      {renderStepIcon(i, step.icon)}
                      <span className={`text-xs ${
                        i < currentStep ? 'font-medium text-slate-700 dark:text-slate-300' :
                        i === currentStep ? 'font-medium text-indigo-600 dark:text-indigo-400' :
                        'text-slate-500 dark:text-slate-500'
                      }`}>{step.label}</span>
                    </div>
                  </Fragment>
                ))}
              </div>

              <div className="mt-5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  We'll email you when your audit is complete. You can safely leave this page - your audit will continue running in the background.
                </p>
              </div>
            </div>
          );
        }

        // ── Processing State ──
        return (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-6">
            <div className="flex items-start gap-4 mb-4">
              {/* Animated scan icon */}
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center">
                <svg className="animate-spin h-6 w-6 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                  Scanning your site
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  Crawling pages and running audit checks...
                </p>
              </div>
              <span className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                {progress}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-4">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.max(2, progress)}%` }}
              />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="text-center">
                <div className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums">
                  {audit.pages_crawled}<span className="text-slate-500 dark:text-slate-500 font-normal text-sm">/{audit.pages_found || '?'}</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-500">Pages crawled</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums">
                  {audit.pages_audited}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-500">Pages audited</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-slate-900 dark:text-white tabular-nums">
                  {audit.total_issues}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-500">Issues found</div>
              </div>
            </div>

            {/* Current URL */}
            {audit.current_url && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                <svg className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
                <span className="truncate">{audit.current_url}</span>
              </div>
            )}

            {/* Queue steps indicator */}
            <div className="mt-5 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Submitted</span>
              </div>
              <div className="flex-1 h-px bg-indigo-600" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">In queue</span>
              </div>
              <div className="flex-1 h-px bg-indigo-600" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full border-2 border-indigo-600 bg-white dark:bg-slate-900 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                </div>
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Scanning</span>
              </div>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center">
                  <svg className="w-4 h-4 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-500">Complete</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Score Cards */}
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 ${showCqsBreakdown && audit.cqs_score !== null ? 'mb-4' : 'mb-8'} animate-reveal-up stagger-1`}>
        <EnhancedScoreCard score={audit.seo_score} category="seo" />
        <EnhancedScoreCard score={audit.accessibility_score} category="accessibility" />
        <EnhancedScoreCard score={audit.security_score} category="security" />
        <EnhancedScoreCard score={audit.performance_score} category="performance" />
        <EnhancedScoreCard score={audit.content_score} category="content" />
        <EnhancedScoreCard
          score={audit.cqs_score}
          category="cqs"
          onClick={() => setShowCqsBreakdown(prev => !prev)}
        />
      </div>

      {/* Mobile Score Cards */}
      {hasMobileData && (
        <div className="grid grid-cols-2 gap-4 mb-4 animate-reveal-up stagger-1">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Mobile Accessibility</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full font-medium">Mobile</span>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(audit.mobile_accessibility_score ?? null)}`}>
              {audit.mobile_accessibility_score ?? '-'}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Mobile Performance</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full font-medium">Mobile</span>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(audit.mobile_performance_score ?? null)}`}>
              {audit.mobile_performance_score ?? '-'}
            </div>
          </div>
        </div>
      )}

      {/* CQS Breakdown Panel */}
      {showCqsBreakdown && audit.cqs_score !== null && (
        <div className="mb-8 animate-reveal-up motion-reduce:animate-none" aria-live="polite">
          <CQSBreakdown auditId={audit.id} cqsScore={audit.cqs_score} />
        </div>
      )}

      {/* Tabs */}
      <div className="relative border-b border-slate-200 dark:border-slate-800 mb-8 animate-reveal-up stagger-2">
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-slate-950 to-transparent z-10 md:hidden" />
        <nav className="-mb-px flex space-x-1 overflow-x-auto">
          {(['overview', 'findings', 'broken-links', 'pages', 'schema', 'index-exposure', ...(audit.check_file_extraction ? ['files'] : [])] as TabType[]).map((tab) => {
            const tabLabels: Record<TabType, string> = {
              overview: 'Overview',
              findings: 'Findings',
              'broken-links': 'Broken Links',
              pages: 'Pages',
              schema: 'Schema',
              'index-exposure': 'Index Exposure',
              files: 'Files',
            };
            const isActive = activeTab === tab;
            const count = tab === 'findings' && !isRunning ? visibleFindingsCount :
                         tab === 'broken-links' && !isRunning ? brokenLinksTotal :
                         tab === 'pages' && !isRunning ? audit.pages_crawled : null;
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); window.location.hash = tab; }}
                className={`relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {tabLabels[tab]}
                {count !== null && (
                  <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                    isActive
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500'
                  }`}>
                    {count}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Executive Summary with Charts */}
          {!isRunning && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-reveal-up stagger-3">
              {/* Overall Score + Radar */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <Heading size="sm" className="text-slate-900 dark:text-white mb-4">
                  Category Breakdown
                </Heading>
                <div className="flex justify-center">
                  <CategoryRadar
                    scores={{
                      seo: audit.seo_score,
                      accessibility: audit.accessibility_score,
                      security: audit.security_score,
                      performance: audit.performance_score,
                      content: audit.content_score,
                    }}
                    size={220}
                  />
                </div>
              </div>

              {/* Issue Severity Distribution */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <Heading size="sm" className="text-slate-900 dark:text-white mb-4">
                  Issue Severity
                </Heading>
                <div className="flex items-center justify-center gap-6">
                  <SeverityDonut
                    data={{
                      critical: allGrouped.filter(g => g.severity === 'critical').length,
                      serious: allGrouped.filter(g => g.severity === 'serious').length,
                      moderate: allGrouped.filter(g => g.severity === 'moderate').length,
                      minor: allGrouped.filter(g => g.severity === 'minor').length,
                      info: allGrouped.filter(g => g.severity === 'info').length,
                    }}
                    size={140}
                  />
                  <SeverityLegend
                    data={{
                      critical: allGrouped.filter(g => g.severity === 'critical').length,
                      serious: allGrouped.filter(g => g.severity === 'serious').length,
                      moderate: allGrouped.filter(g => g.severity === 'moderate').length,
                      minor: allGrouped.filter(g => g.severity === 'minor').length,
                      info: allGrouped.filter(g => g.severity === 'info').length,
                    }}
                  />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <Heading size="sm" className="text-slate-900 dark:text-white mb-4">
                  Audit Summary
                </Heading>
                <div className="space-y-4">
                  {[
                    { label: 'Pages Analyzed', value: audit.pages_crawled, icon: '📄' },
                    { label: 'Unique Issues', value: allGrouped.length, icon: '⚠️' },
                    { label: 'Critical Issues', value: allGrouped.filter(g => g.severity === 'critical').length, icon: '🚨', danger: true },
                    { label: 'URLs Discovered', value: audit.pages_found, icon: '🔗' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.icon}</span>
                        <Body size="sm" className="text-slate-600 dark:text-slate-500">{item.label}</Body>
                      </div>
                      <span className={`text-lg font-semibold tabular-nums ${item.danger ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error Summary (if there were crawl errors) */}
          {audit.error_summary && (
            <AuditErrorSummary
              totalErrors={(audit.pages_blocked || 0) + (audit.pages_timeout || 0) + (audit.pages_server_error || 0)}
              errorSummary={audit.error_summary}
            />
          )}

          {/* Score Trend Chart */}
          {scoreHistory.length >= 2 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 animate-reveal-up stagger-4">
              <div className="flex items-center justify-between mb-4">
                <Heading size="sm" className="text-slate-900 dark:text-white">
                  Score History
                </Heading>
                <ChartLegend />
              </div>
              <MultiScoreChart
                data={scoreHistory.map(h => ({
                  date: h.created_at,
                  seo: h.seo_score,
                  accessibility: h.accessibility_score,
                  security: h.security_score,
                  performance: h.performance_score,
                  content: h.content_score,
                }))}
                height={200}
              />
            </div>
          )}

          {/* Audit Details */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 animate-reveal-up stagger-5">
            <Heading size="sm" className="text-slate-900 dark:text-white mb-4">
              Audit Details
            </Heading>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1">Target URL</dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-white truncate">{audit.target_url}</dd>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1">Domain</dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-white">{audit.target_domain}</dd>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1">Started</dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(audit.started_at)}</dd>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1">Completed</dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(audit.completed_at)}</dd>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1">URLs Discovered</dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-white">{audit.pages_found}</dd>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1">Pages Crawled</dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-white">
                  {audit.pages_crawled}
                  {audit.pages_found > audit.pages_crawled && (
                    <span className="text-xs text-slate-500 dark:text-slate-500 ml-1">(max limit)</span>
                  )}
                </dd>
              </div>
            </dl>

            {audit.error_message && !(
              audit.error_message.includes('security protection') ||
              audit.error_message.includes('Cloudflare') ||
              audit.error_message.includes('WAF')
            ) && (
              <Alert variant="error" className="mt-6">
                <strong>Error:</strong> {audit.error_message}
              </Alert>
            )}
          </div>
        </div>
      )}

      {activeTab === 'findings' && (
        <div>
          {/* Filters */}
          {findings.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
              {/* Category Filter - Button Style */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setCategoryFilter(null)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    categoryFilter === null ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All
                </button>
                {(['seo', 'accessibility', 'security', 'performance', 'content', 'content-eeat', 'content-aeo', 'structured-data'] as FindingCategory[]).map(cat => {
                  const count = getCategoryCount(cat);
                  const totalCount = getTotalCategoryCount(cat);
                  if (totalCount === 0) return null;
                  const label = cat === 'seo' ? 'SEO' : cat === 'content-eeat' ? 'E-E-A-T' : cat === 'content-aeo' ? 'AEO' : cat === 'structured-data' ? 'Structured Data' : cat.charAt(0).toUpperCase() + cat.slice(1);
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        categoryFilter === cat ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      } ${count === 0 && severityFilter ? 'opacity-50' : ''}`}
                    >
                      {label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Severity Filter - Dropdown */}
              <select
                value={severityFilter || ''}
                onChange={(e) => setSeverityFilter(e.target.value as Severity || null)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Severities</option>
                {(['critical', 'serious', 'moderate', 'minor', 'info'] as Severity[]).map(sev => {
                  const totalCount = getTotalSeverityCount(sev);
                  if (totalCount === 0) return null;
                  const count = getSeverityCount(sev);
                  return (
                    <option key={sev} value={sev}>
                      {sev.charAt(0).toUpperCase() + sev.slice(1)} ({count})
                    </option>
                  );
                })}
              </select>

              {/* Device Filter - only shown when mobile data exists */}
              {hasMobileData && (
                <select
                  value={deviceFilter}
                  onChange={(e) => setDeviceFilter(e.target.value as 'all' | 'desktop' | 'mobile' | 'both')}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Devices</option>
                  <option value="desktop">Desktop Only</option>
                  <option value="mobile">Mobile Only</option>
                  <option value="both">Both Devices</option>
                </select>
              )}

              {/* Show dismissed toggle */}
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDismissed}
                  onChange={(e) => setShowDismissed(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 rounded"
                />
                Show dismissed
              </label>

              {/* Results count */}
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {filteredGroups.length} unique {filteredGroups.length === 1 ? 'issue' : 'issues'}
              </div>
            </div>
          )}

          {/* Grouped Findings List */}
          {findings.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 dark:text-slate-400">
              No issues found in this audit.
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 dark:text-slate-400">
              No findings match your filters.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGroups.map((group) => (
                <GroupedFindingCard key={group.key} group={group} auditId={id!} onDismiss={handleDismiss} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'broken-links' && (
        <div>
          {brokenLinks.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
              <div className="text-4xl mb-3">🔗</div>
              <p className="text-slate-900 dark:text-white font-medium">0 broken links</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">No broken links were detected during this audit.</p>
            </div>
          ) : (
            <div>
              <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                Found {brokenLinks.length} broken {brokenLinks.length === 1 ? 'link' : 'links'}
              </div>
              <div className="space-y-3">
                {brokenLinks.map((link) => (
                  <div key={link.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${severityColors[link.severity]}`}>
                          {link.severity}
                        </span>
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          link.rule_id === 'broken-link' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300' : 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300'
                        }`}>
                          {link.rule_id === 'broken-link' ? 'Internal' : 'External'}
                        </span>
                      </div>
                    </div>

                    {/* Broken URL */}
                    <div className="mb-2">
                      <a
                        href={link.selector || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-red-600 hover:text-red-800 hover:underline break-all"
                      >
                        {link.selector}
                      </a>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{link.message}</p>

                    {link.recommendation && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{link.recommendation}</p>
                    )}

                    {/* Source page */}
                    {link.page_url && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Found on: </span>
                        <a
                          href={link.page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline"
                        >
                          {link.page_url}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pages' && (
        <div>
          {pages.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 dark:text-slate-400">
              No pages crawled yet.
            </div>
          ) : (
            <div className="space-y-2">
              {pages.map((page) => (
                <PageAccordion key={page.id} page={page} auditId={id!} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'schema' && id && (
        <SchemaTab auditId={id} />
      )}

      {activeTab === 'index-exposure' && id && (
        <IndexExposureTab auditId={id} />
      )}

      {activeTab === 'files' && id && (
        <FilesTab auditId={id} />
      )}
    </DashboardLayout>
  );
}
