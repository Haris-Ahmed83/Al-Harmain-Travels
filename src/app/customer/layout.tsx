import React from 'react';
import RouteGuard from '@/components/auth/RouteGuard';
import CustomerDashboardShell from '@/components/customer/CustomerDashboardShell';

export const metadata = {
  title: 'Customer VIP Portal — Al Harmain Travels',
  description: 'Manage luxury pilgrimage and city transfers across Makkah, Madinah, and Jeddah.',
};

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={['customer']}>
      <CustomerDashboardShell>
        {children}
      </CustomerDashboardShell>
    </RouteGuard>
  );
}
