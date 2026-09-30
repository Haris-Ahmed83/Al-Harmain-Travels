'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const { signIn } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setUnverifiedEmail(null);

    if (!email.includes('@') || !email.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await signIn(email, password);
      if (res.success) {
        toast.success("Welcome back — you're signed in.");
        
        // Strict role validation for redirect: Only follow redirect if it belongs to the user's role
        const isValidRedirectForRole = (url: string | null, role?: string) => {
          if (!url || !url.startsWith('/') || url.startsWith('/auth')) return false;
          if (role === 'admin') return url.startsWith('/admin');
          if (role === 'dispatcher') return url.startsWith('/dispatcher') || url.startsWith('/staff');
          if (role === 'driver') return url.startsWith('/driver');
          if (role === 'customer') return url.startsWith('/customer');
          return false;
        };

        if (redirectParam && isValidRedirectForRole(redirectParam, res.role)) {
          router.push(redirectParam);
          return;
        }

        // Dedicated dashboard per role
        switch (res.role) {
          case 'admin':
            router.push('/admin');
            break;
          case 'dispatcher':
            router.push('/dispatcher');
            break;
          case 'driver':
            router.push('/driver');
            break;
          case 'customer':
          default:
            router.push('/customer');
            break;
        }
      } else {
        if (res.requiresVerification) {
          setUnverifiedEmail(res.email || email.trim().toLowerCase());
        }
        setErrorMsg(res.error || 'Invalid email or password. Please verify your credentials.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-page text-primary flex items-center justify-center py-10 px-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] bg-emerald-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-5 animate-fade-up">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group mb-1">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-950 flex items-center justify-center text-amber-400 font-bold text-xl border border-emerald-500/30">
              الح
            </div>
            <div className="text-left">
              <div className="font-display text-xl font-semibold text-primary leading-tight">
                Al Harmain <span className="text-amber-500">Travel</span>
              </div>
              <div className="text-2xs text-emerald-600 dark:text-emerald-400/80 tracking-label uppercase font-semibold mt-0.5">
                Makkah · Madinah · Jeddah
              </div>
            </div>
          </Link>
          <h1 className="type-page-title">Welcome back</h1>
          <p className="type-muted text-xs sm:text-sm">Sign in to book, track, or manage journeys</p>
        </div>

        <div className="surface-card overflow-hidden">
          <div className="p-6 sm:p-7 space-y-5">
            {unverifiedEmail ? (
              <div
                role="alert"
                className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-200 text-xs space-y-2.5 animate-fade-in"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                  <div>
                    <span className="font-semibold block">Email Verification Required</span>
                    <span>{errorMsg || 'Your email address has not been confirmed yet. Please verify your email before signing in.'}</span>
                  </div>
                </div>
                <div className="pt-1 flex gap-2">
                  <Link
                    href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                    className="btn-brand text-xs !py-2 !px-3 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Resend / Verify Email</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : errorMsg ? (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2 animate-fade-in"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            ) : null}

            <form onSubmit={handleSignIn} className="space-y-4 text-xs">
              <div>
                <label htmlFor="email" className="type-label">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field-input pl-10"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="type-label !mb-0">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] text-amber-500 dark:text-amber-400 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="field-input pl-10 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-primary rounded-lg"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-[11px] text-secondary">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-base text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Remember my session</span>
                </label>
              </div>

              <button type="submit" disabled={isLoading} className="btn-brand w-full py-3.5">
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="flex items-start gap-2 text-[11px] text-muted bg-surface/80 rounded-xl p-3 border border-base">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p>
                Customers book rides securely. Staff, drivers, and admins are automatically routed to their authorized portals with strict boundary enforcement.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-muted">
          New pilgrim?{' '}
          <Link href="/sign-up" className="text-amber-500 dark:text-amber-400 font-bold hover:underline">
            Create a customer account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center">Loading…</div>}>
      <SignInForm />
    </Suspense>
  );
}
