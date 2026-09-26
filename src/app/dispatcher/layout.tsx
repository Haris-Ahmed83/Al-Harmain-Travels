import React from 'react';
import RouteGuard from '@/components/auth/RouteGuard';

export const metadata = {
  title: 'Operations & Dispatch — Al Harmain Travels',
  description: 'Live ride queue, fleet tracking, and automated assignment control.',
};

export default function DispatcherLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard allowedRoles={['dispatcher']}>{children}</RouteGuard>;
}
