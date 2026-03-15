import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import type { AxiosError } from 'axios';
import type { ErrorResponse } from '../../types/auth.types';
import { SocialButtons } from './SocialButtons';

const registerSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name is too long'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name is too long'),
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email is too long'),
  companyName: z
    .string()
    .max(255, 'Company name is too long')
    .optional(),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password is too long')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
  confirmPassword: z.string(),
  acceptedTos: z.boolean().refine((val) => val === true, {
    message: 'You must accept the Terms of Service to register',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || undefined;
  const eaParam = searchParams.get('ea');
  const earlyAccessChannel = (eaParam === 'email' || eaParam === 'social') ? eaParam : undefined;
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.companyName,
        acceptedTos: data.acceptedTos,
        referralCode,
        earlyAccessChannel,
      });

      if (earlyAccessChannel && (result as any)?.earlyAccess) {
        navigate('/register/early-access-success', { state: { email: data.email } });
      } else {
        navigate('/register/success', { state: { email: data.email } });
      }
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const errorData = axiosError.response?.data;

      if (errorData?.code === 'EMAIL_EXISTS') {
        setError('An account with this email already exists.');
      } else if (errorData?.code === 'WEAK_PASSWORD') {
        setError(errorData.details?.map(d => d.message).join(' ') || 'Password is too weak.');
      } else if (errorData?.code === 'COMMON_PASSWORD') {
        setError('This password is too common. Please choose a stronger password.');
      } else if (errorData?.code === 'RATE_LIMITED') {
        setError(`Too many attempts. Please try again in ${Math.ceil((errorData.retryAfter || 3600) / 60)} minutes.`);
      } else {
        setError(errorData?.error || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {earlyAccessChannel && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold mb-1">Founding Member Benefits</p>
          <ul className="list-disc list-inside space-y-0.5 text-amber-700">
            <li>30-day free Agency trial (full access)</li>
            <li>50% lifetime discount when you subscribe</li>
          </ul>
        </div>
      )}
      {referralCode && !earlyAccessChannel && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 text-sm text-indigo-700">
          You were referred by a friend! Complete registration and your first audit to earn bonus audits.
        </div>
      )}
      <SocialButtons mode="register" />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-500">or register with email</span>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <fieldset className="grid grid-cols-2 gap-4">
        <legend className="sr-only">Name</legend>
        <Input
          label="First name"
          required
          autoComplete="given-name"
          {...register('firstName')}
          error={errors.firstName?.message}
        />
        <Input
          label="Last name"
          required
          autoComplete="family-name"
          {...register('lastName')}
          error={errors.lastName?.message}
        />
      </fieldset>

      <Input
        label="Email"
        type="email"
        required
        autoComplete="email"
        {...register('email')}
        error={errors.email?.message}
      />

      <Input
        label="Company name (optional)"
        autoComplete="organization"
        {...register('companyName')}
        error={errors.companyName?.message}
      />

      <fieldset className="space-y-6">
        <legend className="sr-only">Password</legend>
        <Input
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          {...register('password')}
          error={errors.password?.message}
        />

        <Input
          label="Confirm password"
          type="password"
          required
          autoComplete="new-password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />

        <div className="text-xs text-slate-500">
          Password must be at least 12 characters with uppercase, lowercase, number, and special character.
        </div>
      </fieldset>

      {/* Terms of Service acceptance */}
      <div className="space-y-1">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            id="acceptedTos"
            aria-describedby={errors.acceptedTos ? 'acceptedTos-error' : undefined}
            aria-invalid={errors.acceptedTos ? true : undefined}
            {...register('acceptedTos')}
            className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
          />
          <span className="text-sm text-slate-600">
            I agree to the{' '}
            <Link
              to="/terms"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              to="/privacy"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </Link>
          </span>
        </label>
        {errors.acceptedTos && (
          <p id="acceptedTos-error" role="alert" className="text-sm text-red-600">{errors.acceptedTos.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Create account
      </Button>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}
