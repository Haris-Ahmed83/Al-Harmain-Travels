'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Clock,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verificationState, resendEmailConfirmation, checkEmailVerification, userRole } = useApp();

  const targetDashboard =
    userRole === 'admin'
      ? '/admin'
      : userRole === 'dispatcher'
      ? '/dispatcher'
      : userRole === 'driver'
      ? '/driver'
      : '/customer';

  const [cooldown, setCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const queryEmail = searchParams.get('email');
  const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('aht_pending_verification_email') : null;
  const emailTarget = queryEmail || verificationState?.email || storedEmail || '';

  // Cooldown countdown
  useEffect(() => {
    if (!verificationState?.emailSentAt) return;
    const updateCooldown = () => {
      const elapsed = Math.floor((Date.now() - verificationState.emailSentAt) / 1000);
      const remaining = Math.max(0, 60 - elapsed);
      setCooldown(remaining);
    };
    updateCooldown();
    const timer = setInterval(updateCooldown, 1000);
    return () => clearInterval(timer);
  }, [verificationState?.emailSentAt]);

  // Auto-poll for email confirmation every 5 seconds
  const handleCheckVerification = useCallback(async (isManual = false) => {
    if (isManual) setIsChecking(true);
    setErrorMsg('');
    try {
      const confirmed = await checkEmailVerification();
      if (confirmed) {
        setIsVerified(true);
        toast.success('Email confirmed! Redirecting to your dashboard…');
        setTimeout(() => router.push(targetDashboard), 1200);
      } else if (isManual) {
        setErrorMsg('Email has not been confirmed yet. Please check your inbox and click the confirmation link, or click Resend.');
      }
    } finally {
      if (isManual) setIsChecking(false);
    }
  }, [checkEmailVerification, router, targetDashboard]);

  useEffect(() => {
    const interval = setInterval(() => handleCheckVerification(false), 5000);
    return () => clearInterval(interval);
  }, [handleCheckVerification]);

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setErrorMsg('');
    setSuccessMsg('');
    setIsResending(true);
    try {
      const res = await resendEmailConfirmation(emailTarget);
      if (!res.success) {
        setErrorMsg(res.error || 'Could not resend confirmation email.');
      } else {
        setCooldown(60);
        setSuccessMsg(`Confirmation email successfully resent to ${emailTarget || 'your email'}.`);
        toast.success('Confirmation email resent — please check your inbox.');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-page text-primary flex items-center justify-center py-10 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-emerald-900/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-5 relative z-10 animate-fade-up">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500 dark:border-emerald-400 flex items-center justify-center text-[10px] font-bold">
              {isVerified ? <CheckCircle2 className="w-3 h-3" /> : '1'}
            </span>
            Email Confirmation
          </span>
          <span className="text-muted">&rarr;</span>
          <span className="flex items-center gap-1.5 text-muted">
            <span className="w-5 h-5 rounded-full bg-elevated border border-base flex items-center justify-center text-[10px]">
              2
            </span>
            Customer Portal
          </span>
        </div>

        {/* Card */}
        <div className="surface-card overflow-hidden">
          <div className="p-6 sm:p-7 space-y-5">
            {/* Icon & Title */}
            <div className="text-center space-y-2">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto transition-colors ${
                  isVerified
                    ? 'bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700/50 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/50 text-amber-600 dark:text-amber-400'
                }`}
              >
                {isVerified ? (
                  <CheckCircle2 className="w-7 h-7" />
                ) : (
                  <Mail className="w-7 h-7" />
                )}
              </div>
              <h1 className="type-page-title text-xl sm:text-2xl">
                {isVerified ? 'Email Confirmed!' : 'Check Your Inbox'}
              </h1>
              <p className="text-xs text-muted max-w-xs mx-auto">
                {isVerified ? (
                  'Your email has been verified. Redirecting you to the customer dashboard…'
                ) : (
                  <>
                    We sent a verification link to{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                      {emailTarget || 'your email address'}
                    </strong>
                    . Please open the email and click the confirmation link to activate your account.
                  </>
                )}
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-start gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                <span>{successMsg}</span>
              </div>
            )}

            {!isVerified && (
              <>
                {/* Instructions card */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 space-y-3">
                  <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    How to verify
                  </p>
                  <ol className="space-y-2 text-xs text-secondary list-none">
                    {[
                      `Open the inbox for ${emailTarget || 'your registered email'}`,
                      'Find the email from Al Harmain Travels (check Spam/Junk if needed)',
                      'Click "Confirm your email" or the verification link inside',
                      'Once verified, click the button below to continue',
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Manual Check */}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleCheckVerification(true)}
                    disabled={isChecking}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    {isChecking ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Status…</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>I&apos;ve Confirmed My Email</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Resend Action */}
                <div className="pt-2 text-center text-xs text-muted flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span>Didn&apos;t receive the email?</span>
                    <button
                      type="button"
                      disabled={cooldown > 0 || isResending}
                      onClick={handleResend}
                      className="text-amber-500 dark:text-amber-400 font-bold hover:underline inline-flex items-center gap-1 disabled:opacity-50 disabled:no-underline cursor-pointer"
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending…</span>
                        </>
                      ) : cooldown > 0 ? (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          <span>Resend in {cooldown}s</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Resend Confirmation Email</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Quick Webmail Shortcuts */}
                <div className="flex items-center justify-center gap-3 pt-1">
                  <span className="text-[10px] text-muted">Quick open:</span>
                  {[
                    { label: 'Gmail', href: 'https://mail.google.com' },
                    { label: 'Outlook', href: 'https://outlook.live.com' },
                    { label: 'Yahoo', href: 'https://mail.yahoo.com' },
                  ].map(({ label, href }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-amber-500 dark:text-amber-400 font-semibold hover:underline flex items-center gap-0.5"
                    >
                      {label}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              </>
            )}

            {isVerified && (
              <button
                type="button"
                onClick={() => router.push(targetDashboard)}
                className="btn-brand w-full py-3.5"
              >
                <span>Go to Authorized Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="border-t border-base px-6 py-3.5 bg-surface/40 text-center text-xs text-muted">
            Wrong email?{' '}
            <Link href="/sign-up" className="text-amber-500 dark:text-amber-400 font-bold hover:underline">
              Start over
            </Link>
            {' · '}
            Already confirmed?{' '}
            <Link href="/sign-in" className="text-amber-500 dark:text-amber-400 font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
