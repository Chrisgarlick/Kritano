import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Crosshair, Globe, Mail, User, Shield, ExternalLink,
  RotateCcw, Trash2, Loader2, ArrowLeft, Code, MessageSquare,
  Facebook, Linkedin, Twitter, Instagram, Youtube,
} from 'lucide-react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { coldProspectsApi, type ColdProspectItem } from '../../../services/api';
import { useToast } from '../../../components/ui/Toast';

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-slate-600/20 text-slate-400' },
  checking: { label: 'Checking', className: 'bg-indigo-600/20 text-indigo-400' },
  live: { label: 'Live', className: 'bg-sky-600/20 text-sky-400' },
  extracting: { label: 'Extracting', className: 'bg-violet-600/20 text-violet-400' },
  qualified: { label: 'Qualified', className: 'bg-emerald-600/20 text-emerald-400' },
  contacted: { label: 'Contacted', className: 'bg-amber-600/20 text-amber-400' },
  converted: { label: 'Converted', className: 'bg-green-600/20 text-green-400' },
  dead: { label: 'Dead', className: 'bg-red-600/20 text-red-400' },
};

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
};

export default function ColdProspectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prospect, setProspect] = useState<ColdProspectItem | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await coldProspectsApi.get(id);
      setProspect(res.data.prospect);
    } catch {
      toast('Failed to load prospect', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRetry = async () => {
    if (!id) return;
    try {
      await coldProspectsApi.retry(id);
      toast('Queued for retry', 'success');
      fetchData();
    } catch {
      toast('Failed to retry', 'error');
    }
  };

  const handleExclude = async () => {
    if (!id) return;
    try {
      await coldProspectsApi.exclude(id, 'Manually excluded');
      toast('Prospect excluded', 'success');
      navigate('/admin/cold-prospects/list');
    } catch {
      toast('Failed to exclude', 'error');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!prospect) {
    return (
      <AdminLayout>
        <div className="p-6 text-center text-slate-400">Prospect not found</div>
      </AdminLayout>
    );
  }

  const badge = STATUS_BADGES[prospect.status] || STATUS_BADGES.pending;

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin/cold-prospects/list" className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/[0.06]">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Globe className="w-5 h-5 text-indigo-400" />
          <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>{prospect.domain}</h1>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}>
            {badge.label}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <a
              href={`https://${prospect.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm bg-white/[0.06] text-slate-300 rounded-lg hover:bg-white/[0.06]"
            >
              <ExternalLink className="w-4 h-4" />
              Visit Site
            </a>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-white/[0.06] text-slate-300 rounded-lg hover:bg-white/[0.06]"
            >
              <RotateCcw className="w-4 h-4" />
              Retry
            </button>
            <button
              onClick={handleExclude}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30"
            >
              <Trash2 className="w-4 h-4" />
              Exclude
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Domain Info */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              Domain Info
            </h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-xs text-slate-400">Domain</dt>
                <dd className="text-sm text-white">{prospect.domain}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-xs text-slate-400">TLD</dt>
                <dd className="text-sm text-white">.{prospect.tld}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-xs text-slate-400">Registered</dt>
                <dd className="text-sm text-white">{prospect.registered_at || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-xs text-slate-400">SSL</dt>
                <dd className="text-sm">
                  {prospect.has_ssl ? (
                    <span className="flex items-center gap-1 text-emerald-400"><Shield className="w-3 h-3" /> Yes</span>
                  ) : (
                    <span className="text-red-400">No</span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-xs text-slate-400">HTTP Status</dt>
                <dd className="text-sm text-white">{prospect.http_status || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-xs text-slate-400">Pages (est.)</dt>
                <dd className="text-sm text-white">{prospect.page_count_estimate || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-xs text-slate-400">Language</dt>
                <dd className="text-sm text-white">{prospect.language || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-xs text-slate-400">Quality Score</dt>
                <dd className={`text-sm font-bold ${
                  prospect.quality_score >= 60 ? 'text-emerald-400' :
                  prospect.quality_score >= 30 ? 'text-amber-400' : 'text-slate-400'
                }`}>
                  {prospect.quality_score}/100
                </dd>
              </div>
              {prospect.title && (
                <div>
                  <dt className="text-xs text-slate-400 mb-1">Title</dt>
                  <dd className="text-sm text-white">{prospect.title}</dd>
                </div>
              )}
              {prospect.meta_description && (
                <div>
                  <dt className="text-xs text-slate-400 mb-1">Description</dt>
                  <dd className="text-xs text-slate-300 leading-relaxed">{prospect.meta_description}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Contact Info */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400" />
              Contact Info
            </h2>

            {/* Primary contact */}
            {prospect.contact_email ? (
              <div className="bg-white/[0.02] rounded-lg p-4 mb-4 border border-white/[0.06]">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Primary Contact</div>
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <a href={`mailto:${prospect.contact_email}`} className="text-sm text-white hover:text-indigo-400">
                    {prospect.contact_email}
                  </a>
                </div>
                {prospect.contact_name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-sky-400" />
                    <span className="text-sm text-white">{prospect.contact_name}</span>
                    {prospect.contact_role && (
                      <span className="text-xs text-slate-400">({prospect.contact_role})</span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/[0.02] rounded-lg p-4 mb-4 border border-white/[0.06] text-center">
                <span className="text-sm text-slate-500">No contact email found</span>
              </div>
            )}

            {/* All emails found */}
            {prospect.emails && prospect.emails.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs text-slate-400 mb-2">All Emails Found ({prospect.emails.length})</h3>
                <div className="space-y-2">
                  {prospect.emails.map((e, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/[0.01] rounded px-3 py-2">
                      <div>
                        <span className="text-xs text-white">{e.email}</span>
                        {e.name && <span className="text-[10px] text-slate-400 ml-2">({e.name})</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          e.confidence === 'high' ? 'bg-emerald-600/20 text-emerald-400' :
                          e.confidence === 'medium' ? 'bg-amber-600/20 text-amber-400' :
                          'bg-slate-600/20 text-slate-400'
                        }`}>
                          {e.confidence}
                        </span>
                        <span className="text-[10px] text-slate-500">{e.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact form */}
            {prospect.has_contact_form && (
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-white">Has contact form</span>
                {prospect.contact_page_url && (
                  <a href={prospect.contact_page_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline">
                    View page
                  </a>
                )}
              </div>
            )}

            {/* Social links */}
            {Object.keys(prospect.social_links || {}).length > 0 && (
              <div>
                <h3 className="text-xs text-slate-400 mb-2">Social Media</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(prospect.social_links).map(([platform, url]) => {
                    const Icon = SOCIAL_ICONS[platform] || Globe;
                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/[0.06] rounded text-xs text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <Icon className="w-3 h-3" />
                        {platform}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Technology Stack */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Code className="w-4 h-4 text-violet-400" />
              Technology Stack
            </h2>
            {(prospect.technology_stack || []).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {prospect.technology_stack.map(tech => (
                  <span key={tech} className="px-3 py-1.5 bg-white/[0.06] rounded-lg text-xs text-white">
                    {tech}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No technologies detected</p>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-slate-400" />
              Pipeline Info
            </h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-xs text-slate-400">Source</dt>
                <dd className="text-sm text-white">{prospect.source}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-xs text-slate-400">Batch Date</dt>
                <dd className="text-sm text-white">{prospect.batch_date}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-xs text-slate-400">Added</dt>
                <dd className="text-sm text-white">
                  {new Date(prospect.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-xs text-slate-400">Last Updated</dt>
                <dd className="text-sm text-white">
                  {new Date(prospect.updated_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </dd>
              </div>
              {prospect.email_sent_at && (
                <div className="flex justify-between">
                  <dt className="text-xs text-slate-400">Email Sent</dt>
                  <dd className="text-sm text-white">
                    {new Date(prospect.email_sent_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </dd>
                </div>
              )}
              {prospect.email_opened_at && (
                <div className="flex justify-between">
                  <dt className="text-xs text-slate-400">Email Opened</dt>
                  <dd className="text-sm text-emerald-400">
                    {new Date(prospect.email_opened_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
