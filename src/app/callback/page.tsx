'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { CheckCircle2, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { type EmailOtpType } from '@supabase/supabase-js';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [destUrl, setDestUrl] = useState<string>('/customer');

  useEffect(() => {
    let isCancelled = false;

    const processAuth = async () => {
      try {
        // 1. Check if Supabase sent error in URL params
        const urlError = searchParams.get('error_description') || searchParams.get('error');
        if (urlError) {
          if (!isCancelled) {
            setStatus('error');
            setErrorMsg(decodeURIComponent(urlError.replace(/\+/g, ' ')));
          }
          return;
        }

        // 2. Check for PKCE exchange code (?code=...)
        const code = searchParams.get('code');
        if (code) {
          const { data: codeData, error: codeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (codeErr) {
            console.error('PKCE code exchange error:', codeErr);
            if (!isCancelled) {
              setStatus('error');
              setErrorMsg(codeErr.message || 'Verification link is invalid or has expired.');
            }
            return;
          }
          if (codeData.session) {
            await handleSuccessfulVerification(codeData.session.user.id, codeData.session.user.email);
            return;
          }
        }

        // 3. Check for Token Hash verification (?token_hash=...&type=...)
        const tokenHash = searchParams.get('token_hash');
        const typeParam = searchParams.get('type') as EmailOtpType | null;
        if (tokenHash) {
          const { data: otpData, error: otpErr } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: typeParam || 'signup',
          });
          if (otpErr) {
            console.error('OTP verification error:', otpErr);
            if (!isCancelled) {
              setStatus('error');
              setErrorMsg(otpErr.message || 'Verification token is invalid or has expired.');
            }
            return;
          }
          if (otpData.session) {
            await handleSuccessfulVerification(otpData.session.user.id, otpData.session.user.email);
            return;
          }
        }

        // 4. Check for active session or hash fragment processed by client
        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) {
          if (!isCancelled) {
            setStatus('error');
            setErrorMsg(sessionErr.message);
          }
          return;
        }

        if (sessionData.session) {
          await handleSuccessfulVerification(sessionData.session.user.id, sessionData.session.user.email);
          return;
        }

        // 5. Listen for auth change (hash fragment or background token exchange)
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session && !isCancelled) {
            await handleSuccessfulVerification(session.user.id, session.user.email);
          }
        });

        // 6. Timeout safeguard
        const timer = setTimeout(async () => {
          if (!isCancelled && status === 'loading') {
            const { data: checkData } = await supabase.auth.getSession();
            if (checkData.session) {
              await handleSuccessfulVerification(checkData.session.user.id, checkData.session.user.email);
            } else {
              setStatus('error');
              setErrorMsg('Verification session timed out. Please sign in with your verified email and password.');
            }
          }
        }, 5000);

        return () => {
          clearTimeout(timer);
          authListener.subscription.unsubscribe();
        };
      } catch (err: unknown) {
        if (!isCancelled) {
          setStatus('error');
          const msg = err instanceof Error ? err.message : 'Failed to process email confirmation.';
          setErrorMsg(msg);
        }
      }
    };

    const handleSuccessfulVerification = async (userId: string, email?: string) => {
      if (isCancelled) return;
      setStatus('success');
      if (email) setUserEmail(email);

      try {
        // Explicitly set email_verified = true in profiles table
        await supabase
          .from('profiles')
          .update({
            email_verified: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (typeof window !== 'undefined') {
          localStorage.removeItem('aht_pending_verification_email');
        }

        const { data: prof } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        const dest =
          prof?.role === 'admin'
            ? '/admin'
            : prof?.role === 'driver'
            ? '/driver'
            : prof?.role === 'dispatcher'
            ? '/dispatcher'
            : '/customer';

        setDestUrl(dest);

        setTimeout(() => {
          if (!isCancelled) {
            router.replace(dest);
          }
        }, 1500);
      } catch (err) {
        console.error('Profile update error on confirmation:', err);
        setDestUrl('/customer');
        setTimeout(() => {
          if (!isCancelled) {
            router.replace('/customer');
          }
        }, 1500);
      }
    };

    processAuth();

    return () => {
      isCancelled = true;
    };
  }, [router, searchParams, status]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-page text-primary flex items-center justify-center p-4">
      <div className="surface-card max-w-md w-full p-8 text-center space-y-4 rounded-3xl shadow-xl animate-fade-in border border-base">
        {status === 'loading' && (
          <div className="space-y-3 py-4">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto" />
            <h3 className="text-lg font-bold text-primary">Verifying Email Confirmation…</h3>
            <p className="text-xs text-muted">Securing your Al Harmain Travels account credentials.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 py-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary">Email Confirmed Successfully!</h3>
              {userEmail && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  {userEmail}
                </p>
              )}
              <p className="text-xs text-muted mt-2">
                Your account is now verified. Redirecting you to your portal…
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => router.replace(destUrl)}
                className="btn-brand text-xs py-2.5 px-5 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 py-2">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700/50 text-rose-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary">Confirmation Error</h3>
              <p className="text-xs text-secondary mt-1 max-w-sm mx-auto">
                {errorMsg || 'The verification link may have expired or was already used.'}
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2">
              <Link href="/verify-email" className="btn-brand text-xs py-2.5 px-4 inline-flex items-center justify-center">
                Resend Confirmation Email
              </Link>
              <Link href="/sign-in" className="btn-secondary text-xs py-2.5 px-4 inline-flex items-center justify-center">
                Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
