'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.includes('@') || !email.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    // Simulate safe API dispatch
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoading(false);
    setIsSubmitted(true);
    toast.success('Password reset instructions generated.');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-page text-primary flex items-center justify-center py-10 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-5 relative z-10 animate-fade-up">
        <div className="text-center space-y-2">
          <h1 className="type-page-title text-xl sm:text-2xl">Reset Your Password</h1>
          <p className="text-xs text-muted">
            Enter your registered email address to receive password recovery instructions.
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

            {isSubmitted ? (
              <div className="p-6 text-center space-y-4 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700/50 rounded-2xl animate-fade-in">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-primary">Instructions Dispatched</h4>
                <p className="text-xs text-secondary leading-relaxed">
                  If an account exists for <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{email}</strong>, you will receive password reset instructions within 2 minutes.
                </p>
                <div className="pt-2">
                  <Link
                    href={`/reset-password?email=${encodeURIComponent(email)}`}
                    className="btn-brand inline-flex items-center gap-2 text-xs !py-2.5 !px-4"
                  >
                    <span>Proceed to Password Reset</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="type-label">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="field-input pl-10"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface/80 border border-base text-[11px] text-muted flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    To protect account privacy, we never disclose whether a specific email address is registered.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-brand w-full py-3.5"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Sending Instructions…</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Instructions</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="pt-2 border-t border-base text-center">
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-primary transition-colors font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
