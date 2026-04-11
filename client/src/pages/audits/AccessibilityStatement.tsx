import { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Download,
  FileText,
  Lock,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { Display, Heading, Body } from '../../components/ui/Typography';
import { useAuth } from '../../contexts/AuthContext';
import { auditsApi } from '../../services/api';
import { formatDate } from '../../utils/format';

interface StatementData {
  domain: string;
  auditDate: string;
  overallScore: number;
  conformanceLevel: 'Full' | 'Partial' | 'Non-conformant';
  standard: string;
  issuesByCategory: Record<string, Array<{ ruleName: string; count: number; description: string }>>;
  totalIssues: number;
  pagesAudited: number;
  categoriesChecked: string[];
}

interface ContactInfo {
  organisationName: string;
  email: string;
  phone: string;
}

const PRO_TIERS = ['pro', 'agency', 'enterprise'];

function conformanceIcon(level: string) {
  switch (level) {
    case 'Full':
      return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    case 'Partial':
      return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    default:
      return <XCircle className="w-5 h-5 text-red-500" />;
  }
}

function conformanceColour(level: string) {
  switch (level) {
    case 'Full':
      return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300';
    case 'Partial':
      return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300';
    default:
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300';
  }
}

function severityLabel(severity: string): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

function severityColour(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'text-red-700 dark:text-red-400';
    case 'serious':
      return 'text-orange-700 dark:text-orange-400';
    case 'moderate':
      return 'text-amber-700 dark:text-amber-400';
    case 'minor':
      return 'text-blue-700 dark:text-blue-400';
    default:
      return 'text-slate-700 dark:text-slate-400';
  }
}

function generateStatementDate(dateStr: string): string {
  try {
    return formatDate(dateStr);
  } catch {
    return new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}

function buildPlainText(data: StatementData, contact: ContactInfo): string {
  const lines: string[] = [];
  const date = generateStatementDate(data.auditDate);

  lines.push(`Accessibility Statement for ${data.domain}`);
  lines.push('');
  lines.push('Commitment to Accessibility');
  lines.push(
    `${contact.organisationName || '[Organisation Name]'} is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.`
  );
  lines.push('');
  lines.push('Standards');
  lines.push(
    `This website aims to conform to ${data.standard}. These guidelines explain how to make web content more accessible for people with disabilities and more user-friendly for everyone.`
  );
  lines.push('');
  lines.push('Conformance Status');
  if (data.conformanceLevel === 'Full') {
    lines.push(
      `This website is fully conformant with ${data.standard}. Our automated assessment identified no significant accessibility issues.`
    );
  } else if (data.conformanceLevel === 'Partial') {
    lines.push(
      `This website is partially conformant with ${data.standard}. We are aware of some areas that do not yet fully conform and are actively working to address them.`
    );
  } else {
    lines.push(
      `This website is not yet conformant with ${data.standard}. We recognise there are accessibility barriers and are committed to resolving them.`
    );
  }
  lines.push(`Accessibility score: ${data.overallScore}/100`);
  lines.push('');

  const severities = ['critical', 'serious', 'moderate', 'minor'];
  const hasIssues = severities.some(
    (s) => data.issuesByCategory[s]?.length > 0
  );

  if (hasIssues) {
    lines.push('Known Issues');
    for (const sev of severities) {
      const issues = data.issuesByCategory[sev] || [];
      if (issues.length === 0) continue;
      lines.push('');
      lines.push(`${severityLabel(sev)} Issues:`);
      for (const issue of issues) {
        lines.push(`  - ${issue.ruleName}${issue.description ? ': ' + issue.description : ''}`);
      }
    }
    lines.push('');
  }

  lines.push('Assessment Method');
  lines.push(
    `This assessment was conducted using Kritano automated testing on ${date}. ${data.pagesAudited} page${data.pagesAudited !== 1 ? 's were' : ' was'} audited, identifying ${data.totalIssues} unique accessibility issue${data.totalIssues !== 1 ? 's' : ''}.`
  );
  lines.push('');
  lines.push(
    'Please note that automated testing can detect many, but not all, accessibility issues. We recommend supplementing automated results with manual testing and user feedback.'
  );
  lines.push('');

  lines.push('Contact Information');
  if (contact.organisationName) {
    lines.push(`Organisation: ${contact.organisationName}`);
  }
  if (contact.email) {
    lines.push(`Email: ${contact.email}`);
  }
  if (contact.phone) {
    lines.push(`Phone: ${contact.phone}`);
  }
  if (!contact.organisationName && !contact.email && !contact.phone) {
    lines.push('[Please provide your contact details]');
  }
  lines.push('');
  lines.push(
    'We welcome your feedback on the accessibility of this website. Please let us know if you encounter any accessibility barriers.'
  );
  lines.push('');
  lines.push(`This statement was prepared on ${date}.`);

  return lines.join('\n');
}

function buildHtml(data: StatementData, contact: ContactInfo): string {
  const date = generateStatementDate(data.auditDate);
  const severities = ['critical', 'serious', 'moderate', 'minor'];
  const hasIssues = severities.some(
    (s) => data.issuesByCategory[s]?.length > 0
  );

  let conformanceText = '';
  if (data.conformanceLevel === 'Full') {
    conformanceText = `This website is fully conformant with ${data.standard}. Our automated assessment identified no significant accessibility issues.`;
  } else if (data.conformanceLevel === 'Partial') {
    conformanceText = `This website is partially conformant with ${data.standard}. We are aware of some areas that do not yet fully conform and are actively working to address them.`;
  } else {
    conformanceText = `This website is not yet conformant with ${data.standard}. We recognise there are accessibility barriers and are committed to resolving them.`;
  }

  let issuesHtml = '';
  if (hasIssues) {
    issuesHtml = '<h2>Known Issues</h2>\n';
    for (const sev of severities) {
      const issues = data.issuesByCategory[sev] || [];
      if (issues.length === 0) continue;
      issuesHtml += `<h3>${severityLabel(sev)} Issues</h3>\n<ul>\n`;
      for (const issue of issues) {
        issuesHtml += `  <li><strong>${escapeHtml(issue.ruleName)}</strong>${issue.description ? ': ' + escapeHtml(issue.description) : ''}</li>\n`;
      }
      issuesHtml += '</ul>\n';
    }
  }

  const contactParts: string[] = [];
  if (contact.organisationName) {
    contactParts.push(`<p><strong>Organisation:</strong> ${escapeHtml(contact.organisationName)}</p>`);
  }
  if (contact.email) {
    contactParts.push(
      `<p><strong>Email:</strong> <a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a></p>`
    );
  }
  if (contact.phone) {
    contactParts.push(
      `<p><strong>Phone:</strong> <a href="tel:${escapeHtml(contact.phone)}">${escapeHtml(contact.phone)}</a></p>`
    );
  }
  if (contactParts.length === 0) {
    contactParts.push('<p>[Please provide your contact details]</p>');
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Statement for ${escapeHtml(data.domain)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; color: #334155; }
    h1 { color: #1e293b; border-bottom: 2px solid #4f46e5; padding-bottom: 0.5rem; }
    h2 { color: #1e293b; margin-top: 2rem; }
    h3 { color: #475569; }
    ul { padding-left: 1.5rem; }
    li { margin-bottom: 0.5rem; }
    a { color: #4f46e5; }
    .score { font-size: 1.25rem; font-weight: 600; }
    .note { background: #f8fafc; border-left: 4px solid #4f46e5; padding: 1rem; margin: 1rem 0; font-style: italic; }
  </style>
</head>
<body>
  <h1>Accessibility Statement for ${escapeHtml(data.domain)}</h1>

  <h2>Commitment to Accessibility</h2>
  <p>${escapeHtml(contact.organisationName || '[Organisation Name]')} is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.</p>

  <h2>Standards</h2>
  <p>This website aims to conform to ${escapeHtml(data.standard)}. These guidelines explain how to make web content more accessible for people with disabilities and more user-friendly for everyone.</p>

  <h2>Conformance Status</h2>
  <p>${conformanceText}</p>
  <p class="score">Accessibility score: ${data.overallScore}/100</p>

  ${issuesHtml}

  <h2>Assessment Method</h2>
  <p>This assessment was conducted using Kritano automated testing on ${escapeHtml(date)}. ${data.pagesAudited} page${data.pagesAudited !== 1 ? 's were' : ' was'} audited, identifying ${data.totalIssues} unique accessibility issue${data.totalIssues !== 1 ? 's' : ''}.</p>
  <p class="note">Please note that automated testing can detect many, but not all, accessibility issues. We recommend supplementing automated results with manual testing and user feedback.</p>

  <h2>Contact Information</h2>
  ${contactParts.join('\n  ')}
  <p>We welcome your feedback on the accessibility of this website. Please let us know if you encounter any accessibility barriers.</p>

  <hr>
  <p><small>This statement was prepared on ${escapeHtml(date)}.</small></p>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function AccessibilityStatementPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { subscription } = useAuth();

  const [data, setData] = useState<StatementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contact, setContact] = useState<ContactInfo>({
    organisationName: '',
    email: '',
    phone: '',
  });

  const isProPlus = subscription && PRO_TIERS.includes(subscription.tier);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await auditsApi.getStatementData(id);
      setData(res.data);
    } catch (err: any) {
      if (err?.response?.status === 403 && err?.response?.data?.code === 'TIER_REQUIRED') {
        setError('TIER_REQUIRED');
      } else if (err?.response?.status === 404) {
        setError('Audit not found.');
      } else {
        setError('Failed to load statement data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isProPlus) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [fetchData, isProPlus]);

  const plainText = useMemo(() => {
    if (!data) return '';
    return buildPlainText(data, contact);
  }, [data, contact]);

  const htmlContent = useMemo(() => {
    if (!data) return '';
    return buildHtml(data, contact);
  }, [data, contact]);

  const handleCopyHtml = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      toast('HTML copied to clipboard', 'success');
    } catch {
      toast('Failed to copy to clipboard', 'error');
    }
  }, [htmlContent, toast]);

  const handleCopyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      toast('Plain text copied to clipboard', 'success');
    } catch {
      toast('Failed to copy to clipboard', 'error');
    }
  }, [plainText, toast]);

  const handleDownloadHtml = useCallback(() => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-statement-${data?.domain || 'website'}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast('HTML file downloaded', 'success');
  }, [htmlContent, data, toast]);

  // Pro feature gate
  if (!isProPlus && !loading) {
    return (
      <DashboardLayout>
        <Helmet>
          <title>Accessibility Statement | Kritano</title>
        </Helmet>
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Link
              to={`/app/audits/${id}`}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to audit
            </Link>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <Display size="sm" className="text-slate-900 dark:text-white mb-3">
              Pro Feature
            </Display>
            <Body className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
              The Accessibility Statement Generator is available on Pro, Agency, and Enterprise plans. Upgrade to generate WCAG-conformant accessibility statements from your audit results.
            </Body>
            <Button
              variant="primary"
              onClick={() => navigate('/app/settings/billing')}
            >
              Upgrade Plan
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>
          {data ? `Accessibility Statement — ${data.domain}` : 'Accessibility Statement'} | Kritano
        </title>
      </Helmet>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={`/app/audits/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to audit
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Display size="sm" className="text-slate-900 dark:text-white">
              Accessibility Statement
            </Display>
            {data && (
              <Body className="text-slate-500 dark:text-slate-400 mt-1">
                Generated from audit of {data.domain}
              </Body>
            )}
          </div>
          {data && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Copy className="w-4 h-4" />}
                onClick={handleCopyHtml}
              >
                Copy as HTML
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={handleDownloadHtml}
              >
                Download HTML
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<FileText className="w-4 h-4" />}
                onClick={handleCopyText}
              >
                Copy as Text
              </Button>
            </div>
          )}
        </div>

        {loading && (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {error && error !== 'TIER_REQUIRED' && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {error === 'TIER_REQUIRED' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <Display size="sm" className="text-slate-900 dark:text-white mb-3">
              Pro Feature
            </Display>
            <Body className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
              The Accessibility Statement Generator requires a Pro, Agency, or Enterprise plan.
            </Body>
            <Button
              variant="primary"
              onClick={() => navigate('/app/settings/billing')}
            >
              Upgrade Plan
            </Button>
          </div>
        )}

        {data && !error && (
          <>
            {/* Contact Information Editor */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm p-6 mb-6">
              <Heading size="sm" className="text-slate-900 dark:text-white mb-4">
                Contact Information
              </Heading>
              <Body size="sm" className="text-slate-500 dark:text-slate-400 mb-4">
                Fill in your details below. These will be included in the generated statement.
              </Body>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="org-name"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Organisation Name
                  </label>
                  <input
                    id="org-name"
                    type="text"
                    value={contact.organisationName}
                    onChange={(e) =>
                      setContact((prev) => ({
                        ...prev,
                        organisationName: e.target.value,
                      }))
                    }
                    placeholder="Your Organisation"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={contact.email}
                    onChange={(e) =>
                      setContact((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="accessibility@example.com"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-phone"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Phone Number
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    value={contact.phone}
                    onChange={(e) =>
                      setContact((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="+44 20 1234 5678"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Statement Preview */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm p-6 sm:p-8">
              {/* Title */}
              <Display size="sm" className="text-slate-900 dark:text-white mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                Accessibility Statement for {data.domain}
              </Display>

              {/* Commitment */}
              <section className="mb-8">
                <Heading size="sm" className="text-slate-900 dark:text-white mb-3">
                  Commitment to Accessibility
                </Heading>
                <Body className="text-slate-600 dark:text-slate-400">
                  {contact.organisationName || '[Organisation Name]'} is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
                </Body>
              </section>

              {/* Standards */}
              <section className="mb-8">
                <Heading size="sm" className="text-slate-900 dark:text-white mb-3">
                  Standards
                </Heading>
                <Body className="text-slate-600 dark:text-slate-400">
                  This website aims to conform to {data.standard}. These guidelines explain how to make web content more accessible for people with disabilities and more user-friendly for everyone.
                </Body>
              </section>

              {/* Conformance Status */}
              <section className="mb-8">
                <Heading size="sm" className="text-slate-900 dark:text-white mb-3">
                  Conformance Status
                </Heading>
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border mb-4 ${conformanceColour(data.conformanceLevel)}`}
                >
                  {conformanceIcon(data.conformanceLevel)}
                  <span className="font-semibold">{data.conformanceLevel} Conformance</span>
                </div>
                <Body className="text-slate-600 dark:text-slate-400 mb-3">
                  {data.conformanceLevel === 'Full' &&
                    `This website is fully conformant with ${data.standard}. Our automated assessment identified no significant accessibility issues.`}
                  {data.conformanceLevel === 'Partial' &&
                    `This website is partially conformant with ${data.standard}. We are aware of some areas that do not yet fully conform and are actively working to address them.`}
                  {data.conformanceLevel === 'Non-conformant' &&
                    `This website is not yet conformant with ${data.standard}. We recognise there are accessibility barriers and are committed to resolving them.`}
                </Body>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">
                    Accessibility score: {data.overallScore}/100
                  </span>
                </div>
              </section>

              {/* Known Issues */}
              {(() => {
                const severities = ['critical', 'serious', 'moderate', 'minor'];
                const hasIssues = severities.some(
                  (s) => data.issuesByCategory[s]?.length > 0
                );
                if (!hasIssues) return null;
                return (
                  <section className="mb-8">
                    <Heading size="sm" className="text-slate-900 dark:text-white mb-4">
                      Known Issues
                    </Heading>
                    <div className="space-y-4">
                      {severities.map((sev) => {
                        const issues = data.issuesByCategory[sev] || [];
                        if (issues.length === 0) return null;
                        return (
                          <div key={sev}>
                            <Heading
                              size="xs"
                              className={`mb-2 ${severityColour(sev)}`}
                            >
                              {severityLabel(sev)} Issues ({issues.length})
                            </Heading>
                            <ul className="space-y-2 pl-5">
                              {issues.map((issue, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-slate-600 dark:text-slate-400 list-disc"
                                >
                                  <span className="font-medium text-slate-800 dark:text-slate-200">
                                    {issue.ruleName}
                                  </span>
                                  {issue.description && (
                                    <span>: {issue.description}</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })()}

              {/* Assessment Method */}
              <section className="mb-8">
                <Heading size="sm" className="text-slate-900 dark:text-white mb-3">
                  Assessment Method
                </Heading>
                <Body className="text-slate-600 dark:text-slate-400 mb-3">
                  This assessment was conducted using Kritano automated testing on{' '}
                  {generateStatementDate(data.auditDate)}.{' '}
                  {data.pagesAudited} page{data.pagesAudited !== 1 ? 's were' : ' was'} audited, identifying{' '}
                  {data.totalIssues} unique accessibility issue{data.totalIssues !== 1 ? 's' : ''}.
                </Body>
                <div className="bg-slate-50 dark:bg-slate-800/50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
                  <Body size="sm" className="text-slate-600 dark:text-slate-400 italic">
                    Please note that automated testing can detect many, but not all, accessibility issues. We recommend supplementing automated results with manual testing and user feedback.
                  </Body>
                </div>
              </section>

              {/* Contact Information */}
              <section className="mb-8">
                <Heading size="sm" className="text-slate-900 dark:text-white mb-3">
                  Contact Information
                </Heading>
                {(contact.organisationName || contact.email || contact.phone) ? (
                  <div className="space-y-1 mb-3">
                    {contact.organisationName && (
                      <Body className="text-slate-600 dark:text-slate-400">
                        <span className="font-medium text-slate-800 dark:text-slate-200">Organisation:</span>{' '}
                        {contact.organisationName}
                      </Body>
                    )}
                    {contact.email && (
                      <Body className="text-slate-600 dark:text-slate-400">
                        <span className="font-medium text-slate-800 dark:text-slate-200">Email:</span>{' '}
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {contact.email}
                        </a>
                      </Body>
                    )}
                    {contact.phone && (
                      <Body className="text-slate-600 dark:text-slate-400">
                        <span className="font-medium text-slate-800 dark:text-slate-200">Phone:</span>{' '}
                        {contact.phone}
                      </Body>
                    )}
                  </div>
                ) : (
                  <Body className="text-slate-400 dark:text-slate-500 italic mb-3">
                    [Please provide your contact details above]
                  </Body>
                )}
                <Body className="text-slate-600 dark:text-slate-400">
                  We welcome your feedback on the accessibility of this website. Please let us know if you encounter any accessibility barriers.
                </Body>
              </section>

              {/* Date */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <Body size="sm" className="text-slate-500 dark:text-slate-500">
                  This statement was prepared on {generateStatementDate(data.auditDate)}.
                </Body>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
