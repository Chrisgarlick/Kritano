import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSiteMode } from '../../contexts/SiteModeContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import type { AxiosError } from 'axios';
import type { ErrorResponse } from '../../types/auth.types';
import { SocialButtons } from './SocialButtons';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mode = useSiteMode();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/app/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorData = axiosError.response?.data;

      if (errorData?.code === 'SSO_ONLY_ACCOUNT') {
        setError('This account uses social sign-in. Please sign in with Google or Facebook, or set a password from your account settings.');
      } else if (errorData?.code === 'ACCOUNT_LOCKED') {
        setError(`Account locked. Please try again in ${Math.ceil((errorData.retryAfter || 900) / 60)} minutes.`);
      } else if (errorData?.code === 'INVALID_CREDENTIALS') {
        setError('Invalid email or password.');
      } else if (errorData?.code === 'ACCOUNT_SUSPENDED') {
        setError('Your account has been suspended. Please contact support.');
      } else {
        setError(errorData?.error || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SocialButtons mode="login" />

    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        {...register('email')}
        error={errors.email?.message}
      />

      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        {...register('password')}
        error={errors.password?.message}
      />

      <div className="flex items-center justify-between">
        <Link
          to="/forgot-password"
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Sign in
      </Button>

      {mode !== 'waitlist' && (
        <p className="text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <Link
            to={mode === 'early_access' ? '/register?ea=email' : '/register'}
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Sign up
          </Link>
        </p>
      )}
    </form>
    </div>
  );
}
