import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { authApi } from '../../services/api';
import { ArrowLeft, Mail } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setError(null);
    setIsLoading(true);

    try {
      await authApi.forgotPassword(data.email);
      setIsSubmitted(true);
    } catch {
      // Always show success to prevent email enumeration
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Forgot Password | PagePulser</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">PagePulser</p>
          <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">Reset your password</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-500">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Check your email</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                If an account exists with that email, we've sent a password reset link. Check your inbox and spam folder.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-500"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && <Alert variant="error">{error}</Alert>}

              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register('email')}
                error={errors.email?.message}
              />

              <Button type="submit" className="w-full" isLoading={isLoading}>
                Send reset link
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-500"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
