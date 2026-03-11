import { RegisterForm } from '../../components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">PagePulser</p>
          <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">Create your account</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Start scanning websites for SEO, accessibility, and security issues
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
