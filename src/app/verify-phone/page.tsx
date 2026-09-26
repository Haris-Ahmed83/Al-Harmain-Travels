'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function VerifyPhonePage() {
  const router = useRouter();
  const { userRole, isAuthenticated, isAuthLoading } = useApp();

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      router.replace('/sign-in');
      return;
    }
    const dest =
      userRole === 'admin'
        ? '/admin'
        : userRole === 'dispatcher'
        ? '/dispatcher'
        : userRole === 'driver'
        ? '/driver'
        : '/customer';
    router.replace(dest);
  }, [router, userRole, isAuthenticated, isAuthLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
      <div className="flex items-center gap-3 text-muted-foreground text-sm">
        <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        Redirecting...
      </div>
    </div>
  );
}
