'use client';

import React from 'react';
import DashboardLayout, { NavItem } from '../../components/DashboardLayout';
import { ProtectedRoute } from '../../components/ProtectedRoute';

const providerNavItems: NavItem[] = [
  { label: 'Overview', href: '/provider' },
  { label: 'Profile', href: '/provider/profile' },
  { label: 'Services', href: '/provider/services' },
  { label: 'Requests', href: '/provider/requests' },
];

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['PROVIDER']}>
      <DashboardLayout navItems={providerNavItems} title="Provider Portal" roleContext="Hospital / Clinic Partner">
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
