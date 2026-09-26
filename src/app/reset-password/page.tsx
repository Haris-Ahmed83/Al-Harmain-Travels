'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Lock, ArrowRight, CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const { changePassword } = useApp();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Password criteria check
  const criteria = useMemo(() => {
    return {
      length: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    };
  }, [password]);

  const isValid = criteria.length && criteria.hasUpper && criteria.hasLower && criteria.hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isValid) {
      setErrorMsg('Password must be at least 8 characters long and include uppercase, lowercase, and numbers.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your new password.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await changePassword('old-simulated-password', password);
      if (res.success) {
        setIsDone(true);
        toast.success('Your password has been successfully updated.');
      } else {
        setErrorMsg(res.error || 'Failed to update password. Please try again.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-page text-primary flex items-center justify-center py-10 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-emerald-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-5 relative z-10 animate-fade-up">
        <div className="text-center space-y-2">
          <h1 className="type-page-title text-xl sm:text-2xl">Create New Password</h1>
          <p className="text-xs text-muted">
            Set a strong and confidential password for your account{emailParam ? ` (${emailParam})` : ''}.
          </p>
        </div>

        <div className="surface-card overflow-hidden">
          <div className="p-6 sm:p-7 space-y-5">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {isDone ? (
              <div className="p-6 text-center space-y-4 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700/50 rounded-2xl animate-fade-in">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-primary">Password Updated Securely</h4>
                <p className="text-xs text-secondary leading-relaxed">
                  Your new password is now active. You can sign in to your customer dashboard.
                </p>
                <div className="pt-2">
                  <Link
                    href="/sign-in"
                    className="btn-brand inline-flex items-center gap-2 text-xs !py-2.5 !px-5"
                  >
                    <span>Sign In Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="type-label">New Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="field-input pl-10 pr-10"
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

                <div>
                  <label className="type-label">Confirm New Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="field-input pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-primary rounded-lg"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-[10px] text-rose-500 mt-1">Passwords do not match.</p>
                  )}
                </div>

                {/* Password Criteria List */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-[10px] text-muted">
                  <span className={`flex items-center gap-1 ${criteria.length ? 'text-emerald-500' : ''}`}>
                    {criteria.length ? <CheckCircle2 className="w-3 h-3" /> : '○'} 8+ characters
                  </span>
                  <span className={`flex items-center gap-1 ${criteria.hasUpper ? 'text-emerald-500' : ''}`}>
                    {criteria.hasUpper ? <CheckCircle2 className="w-3 h-3" /> : '○'} Uppercase letter
                  </span>
                  <span className={`flex items-center gap-1 ${criteria.hasLower ? 'text-emerald-500' : ''}`}>
                    {criteria.hasLower ? <CheckCircle2 className="w-3 h-3" /> : '○'} Lowercase letter
                  </span>
                  <span className={`flex items-center gap-1 ${criteria.hasNumber ? 'text-emerald-500' : ''}`}>
                    {criteria.hasNumber ? <CheckCircle2 className="w-3 h-3" /> : '○'} Number (0-9)
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !isValid || password !== confirmPassword}
                  className="btn-brand w-full py-3.5"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Saving New Password…</span>
                    </>
                  ) : (
                    <>
                      <span>Save New Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="pt-2 border-t border-base text-center">
              <Link href="/sign-in" className="text-xs text-muted hover:text-primary transition-colors font-medium">
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
