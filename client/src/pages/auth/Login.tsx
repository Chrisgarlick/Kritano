import { Helmet } from 'react-helmet-async';
import { LoginForm } from '../../components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Sign In | Kritano</title>
        <meta name="description" content="Sign in to your Kritano account to access website audits, security reports, and performance insights." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <p className="text-3xl font-display text-indigo-600 dark:text-indigo-400">Kritano</p>
          <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">Sign in to your account</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Access your website audits and security reports
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
