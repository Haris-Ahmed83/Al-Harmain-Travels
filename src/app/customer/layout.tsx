import React from 'react';
import RouteGuard from '@/components/auth/RouteGuard';

export const metadata = {
  title: 'Customer Portal — Al Harmain Travels',
  description: 'Manage luxury pilgrimage and city transfers across Makkah, Madinah, and Jeddah.',
};

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard allowedRoles={['customer']}>{children}</RouteGuard>;
}
