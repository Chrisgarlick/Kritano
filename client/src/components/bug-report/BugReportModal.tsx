/**
 * Bug Report Modal
 *
 * Modal form for submitting bug reports.
 * Captures title, description, severity, category, and browser context.
 */

import { useState, useRef } from 'react';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { bugReportsApi } from '../../services/api';
import { useFocusTrap } from '../../hooks/useFocusTrap';

type Severity = 'critical' | 'major' | 'minor' | 'trivial';
type Category = 'ui' | 'functionality' | 'performance' | 'data' | 'security' | 'other';

interface FormData {
  title: string;
  description: string;
  severity: Severity;
  category: Category;
}

const severityOptions: { value: Severity; label: string; description: string }[] = [
  { value: 'critical', label: 'Critical', description: 'App is broken, data loss' },
  { value: 'major', label: 'Major', description: 'Feature not working' },
  { value: 'minor', label: 'Minor', description: 'Something is off' },
  { value: 'trivial', label: 'Trivial', description: 'Small cosmetic issue' },
];

const categoryOptions: { value: Category; label: string }[] = [
  { value: 'ui', label: 'UI/Visual' },
  { value: 'functionality', label: 'Functionality' },
  { value: 'performance', label: 'Performance' },
  { value: 'data', label: 'Data/Reports' },
  { value: 'security', label: 'Security' },
  { value: 'other', label: 'Other' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function BugReportModal({ isOpen, onClose }: Props) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(isOpen, modalRef, onClose);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    severity: 'minor',
    category: 'functionality',
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }
    if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }
    if (formData.description.length < 20) {
      newErrors.description = 'Please provide more detail (20+ characters)';
    }
    if (formData.description.length > 5000) {
      newErrors.description = 'Description must be less than 5000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const browserInfo = {
        name: navigator.userAgent.includes('Chrome') ? 'Chrome' :
              navigator.userAgent.includes('Firefox') ? 'Firefox' :
              navigator.userAgent.includes('Safari') ? 'Safari' : 'Other',
        version: navigator.userAgent.match(/(?:Chrome|Firefox|Safari)\/(\d+)/)?.[1] || 'Unknown',
        os: navigator.platform,
      };

      await bugReportsApi.create({
        title: formData.title,
        description: formData.description,
        severity: formData.severity,
        category: formData.category,
        pageUrl: window.location.href,
        browserInfo,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
      });

      setSubmitted(true);
      setTimeout(() => {
        setFormData({
          title: '',
          description: '',
          severity: 'minor',
          category: 'functionality',
        });
        setSubmitted(false);
        onClose();
      }, 2000);
    } catch (err) {
      toast('Failed to submit bug report', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        title: '',
        description: '',
        severity: 'minor',
        category: 'functionality',
      });
      setErrors({});
      setSubmitted(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bug-report-title"
        className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl
                      w-full max-w-lg max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 id="bug-report-title" className="text-lg font-semibold text-slate-900 dark:text-white">
            Report a Bug
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="p-1 text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success state */}
        {submitted ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Thanks for reporting!
            </h3>
            <p className="text-slate-600 dark:text-slate-500">
              We'll look into this and keep you updated.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-4 space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="bug-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  What's the issue?
                </label>
                <input
                  id="bug-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description of the problem"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600
                           rounded-lg bg-white dark:bg-slate-900
                           text-slate-900 dark:text-white placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Severity */}
              <fieldset>
                <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Severity
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {severityOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start p-3 border rounded-lg cursor-pointer
                               transition-colors
                               ${formData.severity === option.value
                                 ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                 : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                               }`}
                    >
                      <input
                        type="radio"
                        name="severity"
                        value={option.value}
                        checked={formData.severity === option.value}
                        onChange={() => setFormData({ ...formData, severity: option.value })}
                        className="mt-0.5 text-indigo-600"
                      />
                      <div className="ml-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {option.label}
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                          {option.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Category */}
              <div>
                <label htmlFor="bug-category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  id="bug-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600
                           rounded-lg bg-white dark:bg-slate-900
                           text-slate-900 dark:text-white"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="bug-description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Describe the issue
                </label>
                <textarea
                  id="bug-description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What happened? What did you expect to happen? Steps to reproduce..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600
                           rounded-lg bg-white dark:bg-slate-900
                           text-slate-900 dark:text-white resize-none placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Context info */}
              <div className="text-xs text-slate-500 dark:text-slate-500 bg-slate-50
                            dark:bg-slate-900 p-3 rounded-lg">
                <p className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  We'll automatically include your current page URL and browser info.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
