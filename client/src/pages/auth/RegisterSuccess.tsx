import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';

export default function RegisterSuccessPage() {
  const location = useLocation();
  const email = (location.state as { email?: string })?.email;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Check Your Email | PagePulser</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <p className="text-3xl font-display text-indigo-600">PagePulser</p>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Check your email</h1>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
          <Alert variant="success" className="mb-6">
            Account created successfully!
          </Alert>

          <p className="text-slate-600 mb-4">
            We've sent a verification email to:
          </p>

          {email && (
            <p className="font-medium text-slate-900 mb-6">{email}</p>
          )}

          <p className="text-sm text-slate-500 mb-6">
            Click the link in the email to verify your account. The link will expire in 24 hours.
          </p>

          <p className="text-sm text-slate-500 mb-4">
            Didn't receive the email? Check your spam folder or
          </p>

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
