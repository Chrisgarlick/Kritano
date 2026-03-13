import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function EarlyAccessSuccessPage() {
  const location = useLocation();
  const email = (location.state as { email?: string })?.email;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>You're In! | PagePulser</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <p className="text-3xl font-bold text-indigo-600">PagePulser</p>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">You're in!</h1>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>

          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Your founding member spot is secured
          </h2>

          {email && (
            <p className="text-slate-600 mb-4">
              We've sent a confirmation to <span className="font-medium text-slate-900">{email}</span>
            </p>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-medium text-amber-800 mb-2">What happens next:</p>
            <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
              <li>Verify your email using the link we sent</li>
              <li>We'll notify you when early access goes live</li>
              <li>You'll get a 30-day Agency trial + 50% lifetime discount</li>
            </ul>
          </div>

          <Link to="/login">
            <Button variant="outline" className="w-full">
              Back to login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
