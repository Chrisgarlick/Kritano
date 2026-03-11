import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import {
  Display,
  Body,
} from '../../components/ui/Typography';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="dashboard-bg min-h-full">
        {/* Header Section */}
        <div className="mb-8 animate-reveal-up">
          <div className="flex items-start justify-between">
            <div>
              <Display size="sm" as="h1" className="text-slate-900 dark:text-white">
                Welcome back, <span className="italic text-indigo-600 dark:text-indigo-400">{user?.firstName}</span>
              </Display>
              <Body muted className="mt-1">
                Here's the pulse of your sites
              </Body>
            </div>
            <Button
              variant="accent"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => navigate('/audits/new')}
            >
              New Audit
            </Button>
          </div>
        </div>

        {/* Placeholder - Audits come in Phase 3 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12">
          <div className="flex flex-col items-center justify-center text-center py-8">
            <div className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4">
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
                <path
                  d="M4 32h12l4-12 6 24 6-16 4 8h12l4-8 4 8h4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-indigo-400"
                />
                <circle cx="32" cy="32" r="28" strokeOpacity="0.2" />
              </svg>
            </div>
            <Display size="sm" as="h3" className="text-slate-700 dark:text-slate-300">
              No audits yet
            </Display>
            <Body muted className="mt-2 max-w-sm">
              Run your first audit to see the pulse of your website's health
            </Body>
            <div className="mt-6">
              <Button variant="accent" onClick={() => navigate('/audits/new')}>
                Run First Audit
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
