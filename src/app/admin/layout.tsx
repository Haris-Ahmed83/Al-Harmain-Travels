import React from 'react';
import RouteGuard from '@/components/auth/RouteGuard';

export const metadata = {
  title: 'Executive Admin HQ — Al Harmain Travels',
  description: 'Enterprise fleet management, tariff rules, and system oversight.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard allowedRoles={['admin']}>{children}</RouteGuard>;
}
