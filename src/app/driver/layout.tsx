import React from 'react';
import RouteGuard from '@/components/auth/RouteGuard';

export const metadata = {
  title: 'Captain Driver Cockpit — Al Harmain Travels',
  description: 'Captain ride assignments, live navigation, and earnings dashboard.',
};

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard allowedRoles={['driver']}>{children}</RouteGuard>;
}
