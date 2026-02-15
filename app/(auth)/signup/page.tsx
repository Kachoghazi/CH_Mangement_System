'use client';

import { useRouter } from 'next/navigation';
import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import toast from 'react-hot-toast';
import Link from 'next/link';

import { useUserStore } from '@/store/user-store';
import z from 'zod';
import { signUpSchema } from '@/schemas/signUpSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function SignupPage() {
  const { status, createUser, login } = useUserStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
  });

  const password = watch('password');

  const onSubmit: SubmitHandler<z.infer<typeof signUpSchema>> = async (data) => {
    await createUser(data.fullName, data.email, data.password);
    const { status: currentStatus, error: currentError } = useUserStore.getState();

    if (currentStatus === 'error') {
      return;
    }

    // Auto-login after successful registration
    await login(data.email, data.password, '/');
    const { status: loginStatus } = useUserStore.getState();

    if (loginStatus === 'authenticated') {
      router.push('/');
    } else {
      router.push('/login');
    }
  };

  const isLoading = status === 'loading' || isSubmitting;

  return (
    <>
      <div className="overflow-hidden rounded-2xl shadow-md w-full max-w-md bg-gray-900">
        <h1 className="text-center text-2xl font-bold mb-4 mt-4">Create an account</h1>
        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="fullName" className="mb-1 block text-sm font-medium text-slate-700">
                Full name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                className={`w-full text-sm ${errors.fullName ? 'border-red-300' : ''}`}
                {...register('fullName', {
                  required: 'Full name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  maxLength: { value: 50, message: 'Name must be less than 50 characters' },
                })}
              />
              {errors.fullName && (
                <p className="mt-1.5 flex items-center gap-1 text-sm text-red-600">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className={`w-full text-sm ${errors.email ? 'border-red-300' : ''}`}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$/i,
                    message: 'Please enter a valid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="mt-1.5 flex items-center gap-1 text-sm text-red-600">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className={`w-full text-sm ${errors.password ? 'border-red-300' : ''}`}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message:
                      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                  },
                })}
              />
              {errors.password ? (
                <p className="mt-1.5 flex items-center gap-1 text-sm text-red-600">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.password.message}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-slate-500">
                  Min 8 characters with uppercase, lowercase, and number
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Confirm password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className={`w-full text-sm ${errors.confirmPassword ? 'border-red-300' : ''}`}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === watch('password') || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && (
                <p className="mt-1.5 flex items-center gap-1 text-sm text-red-600">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t" />
            <span className="px-4 text-sm text-slate-500">or</span>
            <div className="flex-1 border-t" />
          </div>

          <p className="text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default SignupPage;
