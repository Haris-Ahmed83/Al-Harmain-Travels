'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Globe,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const COUNTRY_CODES = [
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦', placeholder: '50 123 4567' },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰', placeholder: '300 1234567' },
  { code: '+971', name: 'UAE', flag: '🇦🇪', placeholder: '50 123 4567' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧', placeholder: '7911 123456' },
  { code: '+1', name: 'USA / Canada', flag: '🇺🇸', placeholder: '202 555 0123' },
  { code: '+90', name: 'Turkey', flag: '🇹🇷', placeholder: '532 123 4567' },
  { code: '+62', name: 'Indonesia', flag: '🇮🇩', placeholder: '812 3456 7890' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾', placeholder: '12 345 6789' },
  { code: '+20', name: 'Egypt', flag: '🇪🇬', placeholder: '10 1234 5678' },
];

export default function SignUpPage() {
  const router = useRouter();
  const { signUpCustomer } = useApp();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [localPhone, setLocalPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Password strength calculation
  const passwordCriteria = useMemo(() => {
    return {
      length: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const strengthScore = useMemo(() => {
    const passed = Object.values(passwordCriteria).filter(Boolean).length;
    return passed;
  }, [passwordCriteria]);

  const strengthLabel = useMemo(() => {
    if (password.length === 0) return { label: 'Empty', color: 'bg-slate-300 dark:bg-slate-700', text: 'text-muted' };
    if (strengthScore <= 2) return { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-500' };
    if (strengthScore <= 4) return { label: 'Good', color: 'bg-amber-500', text: 'text-amber-500' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500' };
  }, [password, strengthScore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!fullName.trim() || fullName.trim().length < 3) {
      setErrorMsg('Please enter your full legal name (at least 3 characters).');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }
    const cleanPhoneDigits = localPhone.replace(/\D/g, '');
    if (cleanPhoneDigits.length < 7 || cleanPhoneDigits.length > 12) {
      setErrorMsg('Please enter a valid phone number for the selected country.');
      return;
    }
    if (strengthScore < 3 || password.length < 8) {
      setErrorMsg('Please choose a stronger password meeting the security criteria below.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your password entry.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('You must agree to the Terms of Service & Privacy Policy.');
      return;
    }

    const fullPhone = `${selectedCountry.code} ${localPhone.trim()}`;

    try {
      setIsLoading(true);
      const res = await signUpCustomer({
        fullName,
        email,
        phone: fullPhone,
        password,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Registration failed. Please check your information.');
        return;
      }

      if (res.requiresVerification) {
        toast.success('Account created! Please verify your email to activate your account.');
        router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      } else {
        toast.success('Account created successfully! Welcome to Al Harmain Travels.');
        router.push('/customer');
      }
    } catch {
      setErrorMsg('An unexpected network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-page text-primary flex items-center justify-center py-10 px-4 sm:px-6 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-emerald-900/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-5 relative z-10 animate-fade-up">
        {/* Header Branding */}
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
          <h1 className="type-page-title">Create Customer Account</h1>
          <p className="type-muted text-xs sm:text-sm">
            Sign up for executive pilgrimage transfers, flight tracking, and chauffeur bookings.
          </p>
        </div>

        {/* Card Container */}
        <div className="surface-card overflow-hidden">
          <div className="p-6 sm:p-7 space-y-5">
            {errorMsg && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2"
              >
                <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Full Legal Name */}
              <div>
                <label className="type-label">Full Legal Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Abdullah Rahman"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="field-input pl-10"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="type-label">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field-input pl-10"
                  />
                </div>
              </div>

              {/* Phone Number with Country Code */}
              <div>
                <label className="type-label">Phone Number (WhatsApp Active) *</label>
                <div className="flex gap-2">
                  <select
                    value={selectedCountry.code}
                    onChange={(e) => {
                      const found = COUNTRY_CODES.find((c) => c.code === e.target.value);
                      if (found) setSelectedCountry(found);
                    }}
                    className="w-32 py-2.5 px-2.5 rounded-xl bg-input border border-base text-primary text-xs focus:outline-none focus:border-emerald-500 shrink-0 cursor-pointer"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      placeholder={selectedCountry.placeholder}
                      value={localPhone}
                      onChange={(e) => setLocalPhone(e.target.value)}
                      className="field-input pl-10"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-muted mt-1 block">
                  SMS &amp; WhatsApp ride updates will be delivered to this number.
                </span>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="type-label !mb-0">Create Password *</label>
                  <span className={`text-[10px] font-bold ${strengthLabel.text}`}>
                    {strengthLabel.label}
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min. 8 characters"
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

                {/* Password Strength Progress Bar */}
                <div className="grid grid-cols-5 gap-1 mt-1.5">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <div
                      key={idx}
                      className={`h-1 rounded-full transition-colors ${
                        idx <= strengthScore ? strengthLabel.color : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  ))}
                </div>

                {/* Password Requirements List */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-[10px] text-muted">
                  <span className={`flex items-center gap-1 ${passwordCriteria.length ? 'text-emerald-500' : ''}`}>
                    {passwordCriteria.length ? <CheckCircle2 className="w-3 h-3" /> : '○'} 8+ characters
                  </span>
                  <span className={`flex items-center gap-1 ${passwordCriteria.hasUpper ? 'text-emerald-500' : ''}`}>
                    {passwordCriteria.hasUpper ? <CheckCircle2 className="w-3 h-3" /> : '○'} Uppercase letter
                  </span>
                  <span className={`flex items-center gap-1 ${passwordCriteria.hasLower ? 'text-emerald-500' : ''}`}>
                    {passwordCriteria.hasLower ? <CheckCircle2 className="w-3 h-3" /> : '○'} Lowercase letter
                  </span>
                  <span className={`flex items-center gap-1 ${passwordCriteria.hasNumber ? 'text-emerald-500' : ''}`}>
                    {passwordCriteria.hasNumber ? <CheckCircle2 className="w-3 h-3" /> : '○'} Number (0-9)
                  </span>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="type-label">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter password"
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

              {/* Terms & Conditions Acceptance */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-secondary">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-base text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    I agree to the{' '}
                    <span className="text-amber-500 underline font-semibold">Terms of Service</span> and{' '}
                    <span className="text-amber-500 underline font-semibold">Privacy Policy</span>.
                  </span>
                </label>
              </div>

              {/* Notice */}
              <div className="p-3 rounded-xl bg-surface/80 border border-base text-[11px] text-muted flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  Public registration grants verified <strong>Customer</strong> booking status. Internal staff and fleet captains are provisioned by Administration.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-brand w-full py-3.5"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Creating Account…</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="border-t border-base px-6 py-4 bg-surface/40 text-center text-xs text-muted">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-amber-500 dark:text-amber-400 font-bold hover:underline">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
