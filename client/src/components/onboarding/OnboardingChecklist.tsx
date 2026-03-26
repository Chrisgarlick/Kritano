import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  ShieldCheck,
  FileSearch,
  Check,
  X,
  PartyPopper,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Heading, Body } from '../ui/Typography';
import type { SiteWithStats } from '../../types/site.types';
import type { Audit } from '../../types/audit.types';

const DISMISSED_KEY = 'pagepulser_onboarding_dismissed';

interface OnboardingChecklistProps {
  sites: SiteWithStats[];
  audits: Audit[];
  loading: boolean;
}

interface Step {
  id: string;
  title: string;
  description: string;
  complete: boolean;
  href: string;
  ctaLabel: string;
  icon: React.ReactNode;
}

export function OnboardingChecklist({ sites, audits, loading }: OnboardingChecklistProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(DISMISSED_KEY) === 'true';
  });
  const [celebrating, setCelebrating] = useState(false);

  const hasSite = sites.length > 0;
  const hasVerified = sites.some(s => s.verified);
  const hasCompletedAudit = audits.some(a => a.status === 'completed');

  const steps: Step[] = [
    {
      id: 'add-site',
      title: 'Add your first site',
      description: 'Register a website to start monitoring its health.',
      complete: hasSite,
      href: '/sites',
      ctaLabel: 'Add Site',
      icon: <Globe className="w-5 h-5" />,
    },
    {
      id: 'verify-domain',
      title: 'Verify your domain',
      description: 'Prove ownership to unlock full scanning capabilities.',
      complete: hasVerified,
      href: hasSite ? `/sites/${sites[0]?.id}` : '/sites',
      ctaLabel: 'Verify',
      icon: <ShieldCheck className="w-5 h-5" />,
    },
    {
      id: 'run-audit',
      title: 'Run your first audit',
      description: 'Scan your site for SEO, accessibility, and security issues.',
      complete: hasCompletedAudit,
      href: '/audits/new',
      ctaLabel: 'Run Audit',
      icon: <FileSearch className="w-5 h-5" />,
    },
  ];

  const completedCount = steps.filter(s => s.complete).length;
  const allComplete = completedCount === 3;

  // Auto-dismiss after celebration
  const handleAutoDismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  }, []);

  useEffect(() => {
    if (allComplete && !dismissed) {
      setCelebrating(true);
      const timer = setTimeout(handleAutoDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [allComplete, dismissed, handleAutoDismiss]);

  if (dismissed || loading) return null;

  // Celebration state
  if (celebrating) {
    return (
      <div className="mb-8 animate-reveal-up">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <PartyPopper className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <Heading size="sm" as="h3">All set! You're ready to go.</Heading>
                <Body size="sm" muted>
                  Your workspace is fully configured. Happy auditing!
                </Body>
              </div>
            </div>
            <button
              onClick={handleAutoDismiss}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 animate-reveal-up">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <Heading size="sm" as="h3">Get started with PagePulser</Heading>
            <Body size="sm" muted className="mt-0.5">
              {completedCount} of 3 complete
            </Body>
          </div>
          <button
            onClick={() => {
              localStorage.setItem(DISMISSED_KEY, 'true');
              setDismissed(true);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Dismiss onboarding checklist"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-5">
          <div
            className="h-1.5 bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / 3) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                step.complete
                  ? 'bg-slate-50 dark:bg-slate-800/50'
                  : 'bg-white dark:bg-slate-900'
              }`}
            >
              {/* Checkbox */}
              <div
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${
                  step.complete
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {step.complete && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
              </div>

              {/* Icon */}
              <div
                className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                  step.complete
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                    : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                }`}
              >
                {step.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    step.complete
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {step.title}
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    step.complete
                      ? 'text-slate-400 dark:text-slate-600'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {step.description}
                </p>
              </div>

              {/* CTA */}
              {!step.complete && (
                <Button
                  variant="outline"
                  size="sm"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  onClick={() => navigate(step.href)}
                >
                  {step.ctaLabel}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
